export default {
  // 通用
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    reset: 'Reset',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info'
  },
  
  // 设置
  settings: {
    title: 'Settings',
    language: 'Language',
    font: 'Font',
    theme: 'Theme',
    layout: 'Layout'
  },
  
  // 语言选项
  language: {
    english: 'English',
    chinese: 'Chinese'
  },
  
  // 字体选项
  font: {
    default: 'Default',
    'maple-mono': 'Maple Mono',
    'jetbrains-mono': 'JetBrains Mono'
  },
  
  // 导航
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    settings: 'Settings'
  },

  // 菜单
  menu: {
    // 看板
    board: 'Dashboard',
    clusterInstall: 'Cluster Install',
    clusterOverview: 'Cluster Overview',
    clusterMonitor: 'Cluster Monitor',
    opsNavigation: 'Ops Navigation',
    
    // 集群
    cluster: 'Cluster',
    clusterManagement: 'Cluster Management',
    node: 'Node',
    namespace: 'Namespace',
    
    // 工作负载
    workloads: 'Workloads',
    pod: 'Pod',
    deployment: 'Deployment',
    
    // 存储
    storage: 'Storage',
    pv: 'PV',
    pvc: 'PVC',
    
    // 网络
    network: 'Network',
    service: 'Service',
    ingress: 'Ingress',
    
    // 配置管理
    config: 'Configuration',
    configmap: 'ConfigMap',
    secret: 'Secret',
    
    // 项目管理
    project: 'Project Management',
    chineseDocs: 'Chinese Docs',
    myBlog: 'My Blog',
    techStack: 'Tech Stack',
    
    // 权限
    permission: 'Permission',
    pageLevel: 'Page Level',
    buttonLevel: 'Button Level'
  },

  // 操作
  actions: {
    logout: 'Logout',
    refresh: 'Refresh',
    refreshing: 'Refreshing cluster list...',
    switchedToCluster: 'Switched to cluster: {name}',
    unknownCluster: 'Unknown cluster',
    noClusterSelected: 'No cluster selected',
    noClustersAvailable: 'No clusters available',
    loading: 'Loading...'
  },

  // 标签页操作
  tagsView: {
    refresh: 'Refresh',
    close: 'Close',
    closeOthers: 'Close Others',
    closeAll: 'Close All'
  },

  // 应用消息
  app: {
    welcomeTitle: 'Hello! Friend!',
    welcomeMessage: 'This is a passion project, please give it a free star! If possible, follow the WeChat account - Cillian, let\'s learn and progress together!',
    migrationSuccess: 'Your cluster selection settings have been automatically migrated to the new version'
  }
}