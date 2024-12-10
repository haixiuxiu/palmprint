Page({
    data: {
      userInfo: {
        nickName: '',
      },
      selectedHand: '',
    },
    // 输入姓名
    onInputChange(e) {
      this.setData({
        "userInfo.nickName": e.detail.value,
      });
    },
    // 选择左右手
    onHandSelect(e) {
      const selectedHand = e.currentTarget.dataset.hand;
      this.setData({ selectedHand });
    },
    // 开始录入
    startRecording() {
        if (this.data.userInfo.nickName && this.data.selectedHand) {
          wx.showToast({
            title: '开始录入中...',
            icon: 'success',
            duration: 1000,
            success: () => {
              // 页面跳转
              wx.navigateTo({
                url: `/pages/palm-record/index?name=${this.data.userInfo.nickName}&hand=${this.data.selectedHand}`,
              });
            },
          });
        } else {
          wx.showToast({
            title: '请补全信息',
            icon: 'error',
          });
        }
      },
  });
  