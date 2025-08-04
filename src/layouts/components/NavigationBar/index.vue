<script lang="ts" setup>
import { computed, onMounted } from "vue" // 确保 onMounted 已导入
import { useRouter } from "vue-router"
import { storeToRefs } from "pinia"
import { useAppStore } from "@/store/modules/app"
import { useSettingsStore } from "@/store/modules/settings"
import { useUserStore } from "@/store/modules/user"
import { useClusterStore, type ClusterInfo } from "@/store/modules/clusterStore" // 导入 cluster store
import { UserFilled, ArrowDown, OfficeBuilding, Refresh, Loading } from "@element-plus/icons-vue" // 添加 Refresh 和 Loading
import Hamburger from "../Hamburger/index.vue"
import Breadcrumb from "../Breadcrumb/index.vue"
import Sidebar from "../Sidebar/index.vue"
import Notify from "@/components/Notify/index.vue"
import ThemeSwitch from "@/components/ThemeSwitch/index.vue"
import Screenfull from "@/components/Screenfull/index.vue"
import SearchMenu from "@/components/SearchMenu/index.vue"
import { useDevice } from "@/hooks/useDevice"
import { useLayoutMode } from "@/hooks/useLayoutMode"
import { ElMessage } from 'element-plus' // 导入 ElMessage

const { isMobile } = useDevice()
const { isTop } = useLayoutMode()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const clusterStore = useClusterStore() // 使用 cluster store

const { showNotify, showThemeSwitch, showScreenfull, showSearchMenu } = storeToRefs(settingsStore)
const { availableClusters, selectedClusterName, loadingClusters } = storeToRefs(clusterStore) // 从 store 获取集群状态

/** 切换侧边栏 */
const toggleSidebar = () => {
  appStore.toggleSidebar(false)
}

/** 登出 */
const logout = () => {
  userStore.logout()
  router.push("/login")
}

/** 处理集群选择变化或刷新操作 */
const handleClusterCommand = (command: string | number | boolean) => {
  if (typeof command === 'string') {
    if (command === "__REFRESH__") {
      ElMessage.info("正在刷新集群列表...")
      clusterStore.fetchAvailableClusters() // 调用 store 中的 action 刷新
      return
    }
    // 切换集群 - 现在command是clusterId
    const oldClusterId = clusterStore.selectedClusterId
    clusterStore.setSelectedClusterId(command)
    // 仅当集群实际发生变化时提示，避免刷新列表时也提示切换
    if (oldClusterId !== command) {
        const cluster = availableClusters.value.find(c => c.id === command)
        ElMessage.success(`已切换到集群: ${cluster?.displayName || '未知集群'}`)
    }
  }
}

// 获取当前选中集群的显示名称
const getCurrentClusterDisplayName = (id: string | null = clusterStore.selectedClusterId): string => {
  if (!id) return "未选择集群"
  const cluster = availableClusters.value.find(c => c.id === id)
  return cluster ? cluster.displayName : "未知集群"
}

// 组件挂载时获取可用集群列表
onMounted(() => {
  // 仅当列表为空且不在加载中时获取，或者强制刷新（如果需要）
  if (availableClusters.value.length === 0 && !loadingClusters.value) {
    clusterStore.fetchAvailableClusters()
  }
})
</script>

<template>
  <div class="navigation-bar">
    <Hamburger
      v-if="!isTop || isMobile"
      :is-active="appStore.sidebar.opened"
      class="hamburger"
      @toggle-click="toggleSidebar"
    />
    <Breadcrumb v-if="!isTop || isMobile" class="breadcrumb" />
    <Sidebar v-if="isTop && !isMobile" class="sidebar" />
    <div class="right-menu">
      <SearchMenu v-if="showSearchMenu" class="right-menu-item" />
      <Screenfull v-if="showScreenfull" class="right-menu-item" />
      <ThemeSwitch v-if="showThemeSwitch" class="right-menu-item" />
      <Notify v-if="showNotify" class="right-menu-item" />

      <el-dropdown class="right-menu-item cluster-selector" trigger="click" @command="handleClusterCommand">
        <div class="right-menu-avatar cluster-dropdown-trigger">
          <el-icon :size="18" style="margin-right: 5px;"><OfficeBuilding /></el-icon>
          <span class="cluster-name-display" :title="getCurrentClusterDisplayName()">
            {{ getCurrentClusterDisplayName() }}
          </span>
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-if="loadingClusters" disabled>
              <el-icon class="is-loading" style="vertical-align: middle; margin-right: 5px;"><Loading /></el-icon>加载中...
            </el-dropdown-item>
            <el-dropdown-item
              v-else-if="!loadingClusters && availableClusters.length === 0"
              disabled
            >
              无可用集群
            </el-dropdown-item>
            <el-dropdown-item
              v-for="cluster in availableClusters"
              :key="cluster.id"
              :command="cluster.id"
              :disabled="clusterStore.selectedClusterId === cluster.id"
            >
              <span :style="{ fontWeight: clusterStore.selectedClusterId === cluster.id ? 'bold' : 'normal' }">
                {{ cluster.displayName }}
                <span v-if="cluster.name !== cluster.displayName" style="font-size: 0.8em; color: #909399;"> ({{ cluster.name }})</span>
              </span>
            </el-dropdown-item>
            <el-dropdown-item command="__REFRESH__" divided :icon="Refresh">
              刷新列表
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-dropdown class="right-menu-item">
        <div class="right-menu-avatar">
          <el-avatar :icon="UserFilled" :size="30" />
          <span>{{ userStore.username }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item divided @click="logout">
              <span style="display: block">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navigation-bar {
  height: var(--v3-navigationbar-height);
  overflow: hidden;
  color: var(--v3-navigationbar-text-color);
  display: flex;
  justify-content: space-between;
  .hamburger {
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 15px;
    cursor: pointer;
  }
  .breadcrumb {
    flex: 1;
    // 参考 Bootstrap 的响应式设计将宽度设置为 576
    @media screen and (max-width: 576px) {
      display: none;
    }
  }
  .sidebar {
    flex: 1;
    // 设置 min-width 是为了让 Sidebar 里的 el-menu 宽度自适应
    min-width: 0px;
    :deep(.el-menu) {
      background-color: transparent;
    }
    :deep(.el-sub-menu) {
      &.is-active {
        .el-sub-menu__title {
          color: var(--el-color-primary) !important;
        }
      }
    }
  }
  .right-menu {
    margin-right: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    .right-menu-item {
      padding: 0 10px;
      cursor: pointer;
      .right-menu-avatar { // 通用头像/触发器样式
        display: flex;
        align-items: center;
        .el-avatar {
          margin-right: 10px;
        }
        span { // 用户名或通用文本
          font-size: 16px;
        }
      }
      // 集群选择器特定样式调整
      &.cluster-selector {
        .cluster-dropdown-trigger { // 给集群选择器的触发区域一个明确的类名
            display: flex;
            align-items: center;
        }
        .cluster-name-display {
          display: inline-block;
          max-width: 150px; // 可根据实际显示调整
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
          font-size: 14px; // 可调整
          line-height: normal; // 确保对齐
        }
         .el-icon--right { // 下拉箭头图标
            margin-left: 4px;
            font-size: 12px; // 可调整
          }
      }
    }
  }
}

// 针对 el-dropdown-item 内的图标和文本对齐（如果需要更细致的控制）
:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  .el-icon {
    margin-right: 5px; // 图标和文本之间的间距
  }
}
</style>