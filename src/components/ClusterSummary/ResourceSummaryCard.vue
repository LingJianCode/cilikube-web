<template>
  <div class="resource-summary-container">
    <!-- 简洁头部 -->
    <div class="summary-header">
      <div class="header-content">
        <div class="title-section">
          <el-icon class="title-icon"><DataAnalysis /></el-icon>
          <h3 class="main-title">集群资源概览</h3>
          <el-tag type="success" size="small" class="status-tag">运行中</el-tag>
        </div>
        <div class="header-actions">
          <span class="last-update" v-if="lastUpdateTime">{{ lastUpdateTime }}</span>
          <el-button 
            :icon="Refresh" 
            text 
            :loading="loading" 
            @click="fetchSummary" 
            class="refresh-btn"
          >
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div v-if="summaryData && displayItems.length > 0" class="stats-overview">
      <div class="stat-item">
        <div class="stat-number">{{ getTotalResources() }}</div>
        <div class="stat-label">总资源</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ getActiveResources() }}</div>
        <div class="stat-label">活跃类型</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ summaryData.namespaces || 0 }}</div>
        <div class="stat-label">命名空间</div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-if="error" class="error-state">
      <el-icon class="error-icon"><Warning /></el-icon>
      <div class="error-text">{{ error }}</div>
      <el-button type="primary" size="small" @click="fetchSummary">重试</el-button>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading && !summaryData" class="loading-state">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 资源网格 -->
    <div v-else-if="summaryData" class="resources-grid">
      <TransitionGroup name="resource" tag="div" class="grid-container">
        <div 
          v-for="(item, index) in displayItems" 
          :key="item.key" 
          class="resource-card"
          :style="{ '--delay': index * 0.02 + 's' }"
          @click="handleResourceClick(item)"
        >
          <div class="card-content">
            <div class="resource-icon" :style="{ color: item.color }">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div class="resource-info">
              <div class="resource-name">{{ item.label }}</div>
              <div class="resource-count">{{ formatCount(summaryData[item.key]) }}</div>
            </div>
            <el-tag 
              :type="getResourceStatus(summaryData[item.key]).type" 
              size="small"
              effect="plain"
              class="resource-status"
            >
              {{ getResourceStatus(summaryData[item.key]).text }}
            </el-tag>
          </div>
        </div>
      </TransitionGroup>

      <!-- 空状态 -->
      <div v-if="displayItems.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Files /></el-icon>
        <div class="empty-text">暂无资源数据</div>
        <el-button type="primary" size="small" @click="fetchSummary">刷新</el-button>
      </div>
    </div>
  </div>
</template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { ElMessage } from 'element-plus';
  import { request } from '@/utils/service'; // Adjust path
  import {
      DataAnalysis, Refresh, Platform, CollectionTag, Files, TakeawayBox, Service,
      Coin, MessageBox, SetUp, Notebook, Key, Lock, Connection, Warning, // Added more icons
      Loading, Clock, CircleCheck, View, TrendCharts, SuccessFilled, InfoFilled,
      CaretTop, Minus
  } from '@element-plus/icons-vue';
  
  interface ResourceSummaryData {
    nodes?: number | null;
    namespaces?: number | null;
    pods?: number | null;
    deployments?: number | null;
    services?: number | null;
    persistentVolumes?: number | null;
    pvcs?: number | null;
    statefulSets?: number | null;
    daemonSets?: number | null;
    configMaps?: number | null;
    secrets?: number | null;
    ingresses?: number | null;
    // Add keys corresponding to the Go model
  }
  
  interface DisplayConfig {
      key: keyof ResourceSummaryData;
      label: string;
      icon: any; // Vue component type
      color: string;
  }
  
  const loading = ref(false);
  const summaryData = ref<ResourceSummaryData | null>(null);
  const error = ref<string | null>(null);
  const lastUpdateTime = ref<string>('');

  // 更新最后更新时间
  const updateLastUpdateTime = () => {
    const now = new Date();
    lastUpdateTime.value = now.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Define the display order, labels, icons, and colors
  const displayConfig: DisplayConfig[] = [
      { key: 'nodes', label: '节点', icon: Platform, color: '#409EFF' },
      { key: 'namespaces', label: '命名空间', icon: CollectionTag, color: '#67C23A' },
      { key: 'pods', label: 'Pods', icon: Files, color: '#E6A23C' },
      { key: 'deployments', label: 'Deployments', icon: TakeawayBox, color: '#F56C6C' },
      { key: 'statefulSets', label: 'StatefulSets', icon: SetUp, color: '#a774d1' }, // Purple
      { key: 'daemonSets', label: 'DaemonSets', icon: Notebook, color: '#7f8c8d' }, // Grey
      { key: 'services', label: 'Services', icon: Service, color: '#3498DB' }, // Blue
      { key: 'ingresses', label: 'Ingresses', icon: Connection, color: '#1ABC9C' }, // Turquoise
      { key: 'persistentVolumes', label: 'PVs', icon: Coin, color: '#f39c12' }, // Orange
      { key: 'pvcs', label: 'PVCs', icon: MessageBox, color: '#f1c40f' }, // Yellow
      { key: 'configMaps', label: 'ConfigMaps', icon: Key, color: '#2ecc71' }, // Emerald
      { key: 'secrets', label: 'Secrets', icon: Lock, color: '#e74c3c' }, // Red
      // Add more resources here
  ];
  
  // Filter config based on available data keys from backend
  const displayItems = computed(() => {
      if (!summaryData.value) return [];
      return displayConfig.filter(item => summaryData.value?.[item.key] !== undefined && summaryData.value?.[item.key] !== null);
  });
  
  const fetchSummary = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await request<{ code: number; data: ResourceSummaryData; message: string }>({
        url: '/api/v1/summary/resources',
        method: 'get',
        timeout: 15000 // 增加超时时间，因为需要从K8s集群获取数据
        // 移除硬编码的baseURL，让它使用service.ts中的配置
      });
      if (response.code === 200 && response.data) {
        summaryData.value = response.data;
        updateLastUpdateTime();
      } else {
        throw new Error(response.message || '获取数据格式错误');
      }
    } catch (err: any) {
      console.error("Failed to fetch resource summary:", err);
      error.value = err.message || '网络请求失败';
    } finally {
      loading.value = false;
    }
  };

  // 获取资源状态
  const getResourceStatus = (count: number | null | undefined) => {
    if (count === null || count === undefined) {
      return { type: 'info', text: '未知' };
    }
    if (count === 0) {
      return { type: 'info', text: '空闲' };
    }
    if (count > 50) {
      return { type: 'warning', text: '繁忙' };
    }
    return { type: 'success', text: '正常' };
  };

  // 获取资源进度（模拟使用率）
  const getResourceProgress = (key: string, count: number | null | undefined): number => {
    if (count === null || count === undefined || count === 0) return 0;
    
    // 根据不同资源类型设置不同的进度计算逻辑
    const progressMap: Record<string, number> = {
      'nodes': Math.min((count / 10) * 100, 100),
      'pods': Math.min((count / 100) * 100, 100),
      'namespaces': Math.min((count / 20) * 100, 100),
      'deployments': Math.min((count / 50) * 100, 100),
      'services': Math.min((count / 30) * 100, 100),
    };
    
    return Math.round(progressMap[key] || Math.min((count / 20) * 100, 100));
  };

  // 处理资源卡片点击
  const handleResourceClick = (item: DisplayConfig) => {
    ElMessage.info(`点击了 ${item.label}，功能开发中...`);
  };

  // 获取总资源数
  const getTotalResources = (): number => {
    if (!summaryData.value) return 0;
    return Object.values(summaryData.value).reduce((total, count) => {
      return total + (count || 0);
    }, 0);
  };

  // 获取活跃资源数（非零资源）
  const getActiveResources = (): number => {
    if (!summaryData.value) return 0;
    return Object.values(summaryData.value).filter(count => count && count > 0).length;
  };
  
  const formatCount = (count: number | null | undefined): string | number => {
    // Backend uses pointers, so check for null explicitly
    if (count === null || count === undefined) {
      return '?'; // Indicate data wasn't fetched or error occurred for this type
    }
    return count;
  };
  
  onMounted(() => {
    fetchSummary();
  });
  
  // Expose fetchSummary if you want to call it from parent
  // defineExpose({ fetchSummary });
  
  </script>
  
  <style lang="scss" scoped>
  .resource-summary-container {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    margin-bottom: 20px;
    overflow: hidden;
    transition: all 0.2s ease;

    &:hover {
      border-color: #d1d5db;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }
  }

  // 简洁头部
  .summary-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid #f3f4f6;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .title-icon {
        font-size: 18px;
        color: #3b82f6;
      }

      .main-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }

      .status-tag {
        font-size: 12px;
        font-weight: 500;
        padding: 2px 8px;
        border-radius: 4px;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .last-update {
        font-size: 12px;
        color: #6b7280;
      }

      .refresh-btn {
        font-size: 12px;
        font-weight: 500;
        color: #3b82f6;
      }
    }
  }

  // 统计概览
  .stats-overview {
    display: flex;
    padding: 16px 24px;
    background: #f9fafb;
    border-bottom: 1px solid #f3f4f6;

    .stat-item {
      flex: 1;
      text-align: center;

      &:not(:last-child) {
        border-right: 1px solid #e5e7eb;
      }

      .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: #111827;
        line-height: 1;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }
    }
  }

  // 错误状态
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 24px;
    text-align: center;

    .error-icon {
      font-size: 32px;
      color: #ef4444;
    }

    .error-text {
      font-size: 14px;
      color: #6b7280;
      max-width: 300px;
    }
  }

  // 加载状态
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 24px;
    color: #6b7280;
    font-size: 14px;

    .loading-icon {
      font-size: 16px;
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  // 资源网格
  .resources-grid {
    padding: 12px 16px 16px;

    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 10px;
    }

    .resource-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      transition: all 0.2s ease;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      animation-delay: var(--delay);
      animation-fill-mode: both;

      &:hover {
        border-color: #d1d5db;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .card-content {
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 90px;
      }

      .resource-icon {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        background: #f9fafb;
        display: flex;
        align-items: center;
        justify-content: center;
        align-self: flex-start;

        .el-icon {
          font-size: 16px;
        }
      }

      .resource-info {
        flex: 1;

        .resource-name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .resource-count {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          line-height: 1;
        }
      }

      .resource-status {
        align-self: flex-end;
        
        .el-tag {
          font-size: 10px;
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 3px;
        }
      }
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  // 空状态
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 24px;
    text-align: center;

    .empty-icon {
      font-size: 32px;
      color: #9ca3af;
    }

    .empty-text {
      font-size: 14px;
      color: #6b7280;
    }
  }

  // 过渡动画
  .resource-enter-active,
  .resource-leave-active {
    transition: all 0.2s ease;
  }

  .resource-enter-from {
    opacity: 0;
    transform: translateY(10px);
  }

  .resource-leave-to {
    opacity: 0;
    transform: translateY(-10px);
  }

  // 响应式设计
  @media (max-width: 768px) {
    .resource-summary-container {
      margin: 0 -16px 20px;
      border-radius: 0;
      border-left: none;
      border-right: none;
    }

    .summary-header {
      padding: 16px 20px 12px;

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .title-section {
        align-self: stretch;
        justify-content: space-between;
      }

      .header-actions {
        align-self: stretch;
        justify-content: space-between;
      }
    }

    .stats-overview {
      padding: 12px 20px;

      .stat-item .stat-number {
        font-size: 20px;
      }
    }

    .resources-grid {
      padding: 10px 20px 16px;

      .grid-container {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px;
      }

      .resource-card {
        .card-content {
          padding: 10px;
          min-height: 80px;
        }

        .resource-icon {
          width: 28px;
          height: 28px;

          .el-icon {
            font-size: 14px;
          }
        }

        .resource-info {
          .resource-name {
            font-size: 12px;
          }

          .resource-count {
            font-size: 18px;
          }
        }
      }
    }

    .error-state,
    .empty-state {
      padding: 24px 20px;
    }

    .loading-state {
      padding: 24px 20px;
    }
  }

  @media (max-width: 480px) {
    .stats-overview {
      flex-direction: column;
      gap: 12px;

      .stat-item {
        &:not(:last-child) {
          border-right: none;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 12px;
        }
      }
    }

    .resources-grid {
      .grid-container {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 6px;
      }

      .resource-card {
        .card-content {
          padding: 8px;
          min-height: 70px;
          gap: 6px;
        }

        .resource-icon {
          width: 24px;
          height: 24px;

          .el-icon {
            font-size: 12px;
          }
        }

        .resource-info {
          .resource-name {
            font-size: 11px;
          }

          .resource-count {
            font-size: 16px;
          }
        }

        .resource-status .el-tag {
          font-size: 9px;
          padding: 1px 4px;
        }
      }
    }
  }
  </style>