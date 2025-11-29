export default {
  // 通用
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加',
    search: '搜索',
    reset: '重置',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    warning: '警告',
    info: '信息'
  },
  
  // 设置
  settings: {
    title: '设置',
    language: '语言',
    font: '字体',
    theme: '主题',
    layout: '布局'
  },
  
  // 语言选项
  language: {
    english: 'English',
    chinese: '中文'
  },
  
  // 字体选项
  font: {
    default: '默认字体',
    kai: '楷体',
    hei: '黑体'
  },
  
  // 导航
  nav: {
    home: '首页',
    dashboard: '仪表板',
    settings: '设置'
  },

  // 菜单
  menu: {
    // 看板
    board: '看板',
    clusterInstall: '集群安装',
    clusterOverview: '集群概览',
    clusterMonitor: '集群监控',
    opsNavigation: '运维导航',
    
    // 集群
    cluster: '集群',
    clusterManagement: '集群管理',
    node: '节点',
    namespace: '命名空间',
    
    // 工作负载
    workloads: '工作负载',
    pod: 'Pod',
    deployment: 'Deployment',
    
    // 存储
    storage: '存储',
    pv: 'PV',
    pvc: 'PVC',
    
    // 网络
    network: '网络',
    service: 'Service',
    ingress: 'Ingress',
    
    // 配置管理
    config: '配置管理',
    configmap: 'ConfigMap',
    secret: 'Secret',
    
    // 项目管理
    project: '项目管理',
    chineseDocs: '中文文档',
    myBlog: '我的博客',
    techStack: '技术栈',
    
    // 权限
    permission: '权限',
    pageLevel: '页面级',
    buttonLevel: '按钮级'
  },

  // 操作
  actions: {
    logout: '退出登录',
    refresh: '刷新列表',
    refreshing: '正在刷新集群列表...',
    switchedToCluster: '已切换到集群: {name}',
    unknownCluster: '未知集群',
    noClusterSelected: '未选择集群',
    noClustersAvailable: '无可用集群',
    loading: '加载中...'
  },

  // 标签页操作
  tagsView: {
    refresh: '刷新',
    close: '关闭',
    closeOthers: '关闭其它',
    closeAll: '关闭所有'
  },

  // 应用消息
  app: {
    welcomeTitle: '你好呀！朋友！',
    welcomeMessage: '这是纯爱发电项目,点个免费star支持一下呀！如果可以，关注下公众号-希里安，共同学习进步！',
    migrationSuccess: '已自动迁移您的集群选择设置到新版本'
  }
}