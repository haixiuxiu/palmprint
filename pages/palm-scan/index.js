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
    cameraContext: null
  },

  onLoad() {
    this.setData({
      cameraContext: wx.createCameraContext()
    })
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

  async startScan() {
    if (this.data.isScanning) {
      this.setData({ isScanning: false })
      return
    }

    this.setData({ 
      isScanning: true,
      tipText: '正在扫描中，请保持手掌稳定...'
    })

    try {
      const res = await new Promise((resolve, reject) => {
        this.data.cameraContext.takePhoto({
          quality: 'high',
          success: resolve,
          fail: reject
        });
      });
      
      console.log('拍照结果:', res);
      console.log('图片路径:', res.tempImagePath);
      
      const imageInfo = await new Promise((resolve, reject) => {
        wx.getImageInfo({
          src: res.tempImagePath,
          success: resolve,
          fail: reject
        });
      });
      
      console.log('图片信息:', imageInfo);
      
      this.setData({
        palmImage: res.tempImagePath,
        hasScannedImage: true,
        tipText: '掌纹采集成功，请点击匹配按钮进行识别',
        isScanning: false
      });

      wx.showToast({
        title: '扫描成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('扫描错误:', error);
      wx.showToast({
        title: '扫描失败，请重试',
        icon: 'error'
      });
      this.setData({
        isScanning: false,
        tipText: '扫描失败，请重新尝试'
      });
    }
  },

  async matchPalm() {
    if (!this.data.palmImage) {
      wx.showToast({
        title: '请先扫描掌纹',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '正在匹配中...',
      mask: true
    });

    try {
      // 1. 检查图片文件是否存在
      const fs = wx.getFileSystemManager();
      
      // 2. 添加错误处理的 base64 转换函数
      const getBase64 = (filePath) => {
        try {
          const base64 = fs.readFileSync(filePath, 'base64');
          // 检查 base64 字符串是否有效
          if (!base64 || base64.length === 0) {
            throw new Error('Base64 转换结果为空');
          }
          console.log('Base64 长度:', base64.length); // 添加日志
          console.log('Base64 前20个字符:', base64.substring(0, 20)); // 查看开头部分
          return base64;
        } catch (error) {
          console.error('Base64 转换错误:', error);
          throw error;
        }
      };

      const fileContent = getBase64(this.data.palmImage);
      
      // 3. 调用后端 API
      console.log('开始调用API, 图片大小:', fileContent.length);
      
      const res = await wx.request({
        url: 'http://47.100.103.52:5000/api/validatePalm',
        method: 'POST',
        data: {
          image: fileContent,
          method: 1
        },
        header: {
          'content-type': 'application/json'
        }
      });

      console.log('API响应:', res.data);

      if (res.data && res.data.code === 200) {
        this.setData({
          matchSuccess: true,
          matchResult: res.data.data.matchResult
        });
        wx.showToast({
          title: '匹配成功',
          icon: 'success'
        });
      } else {
        throw new Error(res.data?.message || '未知错误');
      }
    } catch (error) {
      console.error('完整错误信息:', error);
      
      // 显示更友好的错误信息
      let errorMsg = '匹配失败';
      if (error.message.includes('未检测到关键点')) {
        errorMsg = '未能正确识别掌纹，请调整手掌位置重新拍摄';
      } else if (error.message.includes('Base64')) {
        errorMsg = '图片处理失败，请重新拍摄';
      }
      
      this.setData({
        matchSuccess: false,
        matchResult: errorMsg
      });
      
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
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
  }
})