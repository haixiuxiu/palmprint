Page({
  data: {
    hasScannedImage: false,
    palmImage: null,
    matchResult: '',
    isScanning: false
  },

  async startScan() {
    this.setData({ isScanning: true });
    try {
      const ctx = wx.createCameraContext();
      const res = await ctx.takePhoto({
        quality: 'high'
      });
      
      this.setData({
        palmImage: res.tempImagePath,
        hasScannedImage: true,
        matchResult: '掌纹采集成功，请点击匹配按钮进行识别'
      });
    } catch (error) {
      wx.showToast({
        title: '扫描失败，请重试',
        icon: 'none'
      });
    }
    this.setData({ isScanning: false });
  },

  async matchPalm() {
    if (!this.data.palmImage) return;
    
    wx.showLoading({
      title: '正在匹配中...'
    });

    try {
      const res = await wx.uploadFile({
        url: 'YOUR_API_ENDPOINT',
        filePath: this.data.palmImage,
        name: 'palm_image',
      });
      
      const result = JSON.parse(res.data);
      this.setData({
        matchResult: result.matched ? 
          `匹配成功！识别为${result.handType === 'left' ? '左' : '右'}手，相似度：${result.similarity}%` : 
          '未找到匹配结果'
      });
    } catch (error) {
      this.setData({
        matchResult: '匹配失败，请重试'
      });
    }

    wx.hideLoading();
  },

  error(e) {
    wx.showToast({
      title: '相机调用失败，请检查权限设置',
      icon: 'none'
    });
  }
})