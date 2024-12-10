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
    capturedImage: '',
    active:1
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
      const fs = wx.getFileSystemManager();
      const base64 = fs.readFileSync(this.data.capturedImage, 'base64');
      
      const validateRes = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://palmvault.asia/api/validatePalm',
          method: 'POST',
          data: {
            image: base64,
            method: 1
          },
          success: resolve,  // 添加 success 回调
          fail: reject      // 添加 fail 回调
        });
      });

      if (validateRes && validateRes.data) {
        const message = validateRes.data.message;
        if (message === '匹配成功') {
          // 先显示匹配成功的消息
          await new Promise(resolve => {
            wx.showToast({
              title: `${validateRes.data.data.name} 掌纹匹配成功`,
              duration: 3000,
              icon: 'success',
              complete: resolve
            });
          });
          
          // 等待 toast 显示完成
          await new Promise(resolve => setTimeout(resolve, 3000));

          // 然后继续处理后续逻辑
          if (this.data.mode === 'punch') {
            wx.showLoading({
              title: '正在签到'
            });
            await this.handleMatchSuccess(validateRes.data.data);
          }
        } else {
          await new Promise(resolve => {
            wx.showModal({
              title: '匹配失败',
              content: '数据库中未找到匹配的掌纹',
              showCancel: false,
              confirmText: '确定',
              complete: resolve
            });
          });
        }
      } else {
        throw new Error('无效的响应');
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

  async handleMatchSuccess(matchData) {
    try {
      const punchRes = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://palmvault.asia/api/doPunchCard',
          method: 'POST',
          data: {
            name: matchData.name,
            type: this.data.punchType,
            time: new Date().toISOString()
          },
          success: resolve,  // 添加 success 回调
          fail: reject       // 添加 fail 回调
        });
      });

      if (punchRes.data.code === 200) {
        wx.showToast({
          title: this.data.punchType === 'in' ? '签到成功' : '签退成功',
          icon: 'success'
        });
        
        // 延迟返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        throw new Error(punchRes.data.message || '打卡失败');
      }
    } catch (error) {
      console.error('打卡失败:', error);
      wx.showToast({
        title: error.message || '打卡失败',
        icon: 'none'
      });
    }
  },
      // 监听 Tabbar 的切换
  onChange(event) {
    console.log(event.detail); // 打印选中的索引
    this.setData({
      active: event.detail // 更新 active 值，控制 tabbar 的选中状态
    });
  
    // 定义页面路径
    const tabPaths = [
      '/pages/entry-palm/index',   // 首页
      '/pages/punch-card/index'    // 我的
    ];
  
    // 跳转到对应的页面
    wx.redirectTo({
      url: tabPaths[event.detail], // 跳转到对应的页面
    });
  }
})