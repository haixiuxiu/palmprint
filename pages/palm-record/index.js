import Notify from '@vant/weapp/notify/notify';

Page({
  data: {
    name: '', // 用户姓名
    hand: 'left', // 选择的手掌，默认 'left'
    isScanning: true, // 是否正在扫描
    progress: 0, // 进度条值（0-100）
    totalSteps: 3, // 总共需要拍摄的步骤
    currentStep: 0, // 当前已完成步骤数
    gradientColor: {
      '0%': '#FFE29F',
      '100%': '#FF719A'// 渐变终点颜色
    },
    active:0
  },

  onLoad(options) {
    // 获取传递的姓名和手掌信息
    const { name, hand } = options;
    this.setData({ name, hand });
  },

  // 拍照逻辑
  takePhoto() {
    const { currentStep, totalSteps, name, hand } = this.data;

    // 创建摄像头上下文
    const cameraContext = wx.createCameraContext();
    cameraContext.takePhoto({
      quality: 'high',
      success: (res) => {
        console.log('拍照成功:', res.tempImagePath);

        // 将图片转为 Base64 格式
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: res.tempImagePath, // 拍照临时文件路径
          encoding: 'base64', // 指定读取为 Base64 格式
          success: (fileRes) => {
            console.log('图片 Base64 编码成功');
            const base64Image = fileRes.data;
                  // 更新进度
                  if (currentStep < totalSteps) {
                    this.setData({
                      currentStep: currentStep + 1,
                    });
                    console.log(currentStep);
                    if(currentStep+1==totalSteps){
                      this.complete();
                    }
                  }
            // 调用后端接口发送数据
            wx.request({
              url: 'https://palmvault.asia/api/inputPalm',
              method: 'POST',
              data: {
                image: base64Image, // Base64 格式的图片
                name, // 用户姓名
                hand: hand === 'left' ? 'l' : 'r', // 根据手掌选择发送 l 或 r
              },
              header: {
                'Content-Type': 'application/json', // 设置为 JSON 格式
              },
              success: (apiRes) => {
                if (apiRes.data && apiRes.data.success) {
                  wx.showToast({
                    title: '上传成功',
                    icon: 'success',
                  });

                  // 更新进度
                  if (currentStep < totalSteps) {
                    this.setData({
                      currentStep: currentStep + 1,
                    });
                    if(currentStep==totalSteps){
                      this.complete();
                    }
                  }
                } else {
                  wx.showToast({
                    title: '录入失败，请重试',
                    icon: 'none',
                  });
                }
              },
              fail: (err) => {
                console.error('请求失败:', err);
                wx.showToast({
                  title: '上传失败，请检查网络',
                  icon: 'none',
                });
              },
            });
          },
          fail: (err) => {
            console.error('读取文件失败:', err);
            wx.showToast({
              title: '图片编码失败',
              icon: 'none',
            });
          },
        });
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败，请检查摄像头权限',
          icon: 'none',
        });
      },
    });
  },
  // 完成函数
  complete() {
    console.log(111);
    Notify({
      message: '录入完毕，即将返回主页',
      color: '#ad0000',
      background: '#ffe1e1',
      duration: 2000,
    });
     // 延迟跳转
  setTimeout(() => {
    wx.redirectTo({
      url: '/pages/index/index',  // 跳转到主页
    });
  }, 2000); // 延迟 1 秒后跳转
  },

  onCameraError(e) {
    console.error('摄像头错误：', e);
    wx.showToast({
      title: '摄像头初始化失败',
      icon: 'error',
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
  }
});
