Page({
  data: {
    currentTime: '',
    currentDate: '',
    punchRecords: [],
    formatPunchRecords:[],
    active: 1,
    sortedDates: [], // 存储排序后的日期
    recordsByDate: {}, // 按日期分类的记录
    isPanelOpen: {}, // 控制日期面板展开/折叠
    isPanelVisible: false, // 控制弹出面板显示与否
  },
  

  onLoad() {
    // 页面加载时调用一次更新日期函数
    this.updateDate();

    // 每秒更新时间
    setInterval(() => {
      this.updateTime();
    }, 1000);

    // 加载打卡记录
    this.loadPunchRecords();
    //console.log(this.punchRecords)
    // 分类
    //this.sortAndClassifyRecords();
  },

  onShow() {
    // 页面显示时刷新记录
    this.loadPunchRecords();
  },

  updateDate() {
    const now = new Date();

    // 获取日期（仅年月日）
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;

    // 更新日期数据
    this.setData({
      currentDate: date
    });
  },

  updateTime() {
    const now = new Date();

    // 获取小时、分钟、秒数，并补齐为两位数
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    // 格式化时间为 16:35:12 格式
    const time = `${hours}:${minutes}:${seconds}`;

    // 更新当前时间
    this.setData({
      currentTime: time
    });
  },
  // 显示历史记录
  showHistory() {
      wx.showToast({
        title: '历史记录显示中',
        icon: 'none'
      })
  },

  // 跳转到掌纹匹配页面
  goToPalmMatch(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/palm-scan/index?mode=punch&type=${type}`,
      success: () => {
        console.log('跳转成功');
      },
      fail: (error) => {
        console.error('跳转失败:', error);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 加载打卡记录
  async loadPunchRecords() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://palmvault.asia/api/getPunchRecords',
          method: 'GET',
          success: resolve,
          fail: reject
        })
      })

      console.log('API响应数据:', res) // 添加调试日志

      if (!res || !res.data) {
        throw new Error('未收到有效的响应数据')
      }

      const records = Array.isArray(res.data) ? res.data : (res.data.data || [])
      
      const formattedRecords = records.map(record => ({
        ...record,
        checkInTime: record.checkInTime ? this.formatTime(record.checkInTime) : '-',
        checkOutTime: record.checkOutTime ? this.formatTime(record.checkOutTime) : '-'
      }))
      
      this.setData({ 
        punchRecords:records,
        formatPunchRecords: formattedRecords 
      })
      //console.log(punchRecords);

    } catch (error) {
      console.error('获取打卡记录详细错误:', error) // 添加详细错误日志
      wx.showToast({
        title: '获取记录失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 格式化时间
  formatTime(timeStr) {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
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
  },

  // 分类并排序记录
  sortAndClassifyRecords: function () {
    const recordsByDate = {};
    const sortedDates = [];

    // 按照日期分类并格式化日期
    this.data.punchRecords.forEach(record => {
        // 提取日期部分并格式化 (YYYY-MM-DD)
        const dateObj = new Date(record.checkInTime);
        const formattedDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

        if (!recordsByDate[formattedDate]) {
            recordsByDate[formattedDate] = [];
            sortedDates.push(formattedDate); // 添加新的日期到日期列表
        }

        // 保存格式化数据
        recordsByDate[formattedDate].push({
            ...record,
            checkInTime: record.checkInTime ? this.formatTime(record.checkInTime) : '-',
            checkOutTime: record.checkOutTime ? this.formatTime(record.checkOutTime) : '-'
        });
    });

    // 排序日期（从最新到最旧）
    sortedDates.sort((a, b) => new Date(b) - new Date(a));

    this.setData({
        recordsByDate,
        sortedDates,
    });
},


  // 切换日期面板的展开/折叠
  togglePanel: function (e) {
    const date = e.currentTarget.dataset.date;
    const isPanelOpen = this.data.isPanelOpen;

    // 切换日期的面板展开/折叠状态
    isPanelOpen[date] = !isPanelOpen[date];

    this.setData({
      isPanelOpen,
    });
  },

  // 打开记录面板
  openRecordPanel: function () {
    this.sortAndClassifyRecords();
    this.setData({
      isPanelVisible: true,
    });
  },

  // 关闭记录面板
  closePanel: function () {
    this.setData({
      isPanelVisible: false,
    });
  },
  
});