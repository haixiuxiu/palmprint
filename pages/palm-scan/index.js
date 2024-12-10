Page({
  data: {
    hasScannedImage: false,
    palmImage: null,
    matchResult: '',
    isScanning: false,
    flashMode: 'off',
    devicePosition: 'back',
    tipText: '请将手掌放入框内进行扫描',
    matchSuccess: false,
    similarity: 0,
    cameraContext: null,
    mode: '',
    punchType: '',
    capturedImage: ''
  },

  onLoad(options) {
    this.setData({
      cameraContext: wx.createCameraContext()
    })

    if (options.mode === 'punch') {
      this.setData({
        mode: options.mode,
        punchType: options.type
      })
    }
  },

  // 切换闪光灯
  toggleFlash() {
    console.log('切换闪光灯', this.data.flashMode)
    this.setData({
      flashMode: this.data.flashMode === 'on' ? 'off' : 'on'
    }, () => {
      wx.showToast({
        title: this.data.flashMode === 'on' ? '闪光灯已开启' : '闪光灯已关闭',
        icon: 'none'
      })
    })
  },

  // 切换摄像头
  switchCamera() {
    console.log('切换摄像头', this.data.devicePosition)
    this.setData({
      devicePosition: this.data.devicePosition === 'back' ? 'front' : 'back'
    }, () => {
      wx.showToast({
        title: this.data.devicePosition === 'back' ? '后置摄像头' : '前置摄像头',
        icon: 'none'
      })
    })
  },

  // 处理扫描按钮点击
  handleScanButton() {
    if (this.data.capturedImage) {
      // 如果有拍摄的图片，则重新扫描
      this.setData({
        capturedImage: '',
        isScanning: false
      });
      return;
    }

    if (this.data.isScanning) {
      this.setData({ isScanning: false });
      return;
    }

    this.startScan();
  },

  // 开始扫描
  async startScan() {
    this.setData({ isScanning: true });

    try {
      const cameraContext = wx.createCameraContext();
      const res = await new Promise((resolve, reject) => {
        cameraContext.takePhoto({
          quality: 'high',
          success: resolve,
          fail: reject
        });
      });

      // 保存拍摄的图片
      this.setData({
        capturedImage: res.tempImagePath,
        isScanning: false
      });

    } catch (error) {
      console.error('扫描失败:', error);
      wx.showToast({
        title: '扫描失败',
        icon: 'none'
      });
      this.setData({ isScanning: false });
    }
  },

  // 开始匹配
  async matchPalm() {
    if (!this.data.capturedImage) {
      return;
    }

    wx.showLoading({ title: '匹配中...' });

    try {
      // 转换图片为 base64
      const fs = wx.getFileSystemManager();
      const base64 = fs.readFileSync(this.data.capturedImage, 'base64');
      
      // 调用后端验证接口
      const validateRes = await wx.request({
        url: 'http://47.100.103.52:5000/api/validatePalm',
        method: 'POST',
        data: {
          image: base64,
          method: 1
        }
      });

      if (validateRes.data.code === 200) {
        // 如果是打卡模式，调用打卡接口
        if (this.data.mode === 'punch') {
          await this.handleMatchSuccess(validateRes.data.data);
        } else {
          // 普通匹配模式的处理
          wx.showToast({
            title: '匹配成功',
            icon: 'success'
          });
        }
      } else {
        throw new Error(validateRes.data?.message || '匹配失败');
      }

    } catch (error) {
      console.error('匹配失败:', error);
      wx.showToast({
        title: error.message || '匹配失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  error(e) {
    wx.showToast({
      title: '相机调用失败，请检查权限设置',
      icon: 'none'
    })
  },

  onUnload() {
    // 页面卸载时清理资源
    if (this.data.palmImage) {
      wx.removeSavedFile({
        filePath: this.data.palmImage
      })
    }
  },

  async handleMatchSuccess(result) {
    if (this.data.mode === 'punch') {
      try {
        const res = await wx.request({
          url: 'http://47.100.103.52:5000/api/doPunchCard',
          method: 'POST',
          data: {
            userId: result.userId,
            type: this.data.punchType,
            time: new Date().toISOString()
          }
        })

        if (res.data.code === 200) {
          wx.showToast({
            title: this.data.punchType === 'in' ? '签到成功' : '签退成功',
            icon: 'success'
          })
          
          // 返回打卡页面
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      } catch (error) {
        console.error('打卡失败:', error)
        wx.showToast({
          title: '打卡失败',
          icon: 'error'
        })
      }
    } else {
      // 原有的匹���成功逻辑
      // ...
    }
  }
})