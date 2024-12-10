Page({
  data: {
    userInfo: {
      nickName: '',
    },
    selectedHand: '',
    tipText: '请填写姓名，并选择录入左手或右手',
    active: 0
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
  
});
