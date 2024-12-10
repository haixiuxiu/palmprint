Page({
  data: {
    currentTime: '',
    currentDate: '',
    punchRecords: []
  },

  onLoad() {
    this.updateDateTime()
    // 每秒更新时间
    setInterval(() => {
      this.updateDateTime()
    }, 1000)
    
    // 加载打卡记录
    this.loadPunchRecords()
  },

  onShow() {
    // 页面显示时刷新记录
    this.loadPunchRecords()
  },

  updateDateTime() {
    const now = new Date()
    
    // 更新时间
    const timeStr = now.toLocaleTimeString('zh-CN', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    
    // 更新日期
    const dateStr = now.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
    
    this.setData({ 
      currentTime: timeStr,
      currentDate: dateStr
    })
  },

  // 跳转到掌纹匹配页面
  goToPalmMatch(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/palm-scan/index?mode=punch&type=${type}`,
      success: () => {
        console.log('跳转成功')
      },
      fail: (error) => {
        console.error('跳转失败:', error)
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        })
      }
    })
  },

  // 加载打卡记录
  async loadPunchRecords() {
    try {
      const res = await wx.request({
        url: 'http://47.100.103.52:5000/api/getPunchRecords',
        method: 'GET'
      })

      if (res.data.code === 200) {
        // 处理时间格式
        const records = res.data.data.map(record => ({
          ...record,
          checkInTime: record.checkInTime ? this.formatTime(record.checkInTime) : '-',
          checkOutTime: record.checkOutTime ? this.formatTime(record.checkOutTime) : '-'
        }))
        
        this.setData({ punchRecords: records })
      } else {
        throw new Error(res.data.message || '获取记录失败')
      }
    } catch (error) {
      console.error('获取打卡记录失败:', error)
      wx.showToast({
        title: '获取记录失败',
        icon: 'none'
      })
    }
  },

  // 格式化时间
  formatTime(timeStr) {
    const date = new Date(timeStr)
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })
  }
})