<script lang="ts" setup>
// 导入布局模式钩子和 logo 图片资源
import { useLayoutMode } from "@/hooks/useLayoutMode"
import logo from "@/assets/layouts/logo.png?url"

// 组件属性接口定义
interface Props {
  collapse?: boolean // 是否折叠状态，true=折叠（只显示图标），false=展开（显示图标+文字）
}

// 设置默认属性值
const props = withDefaults(defineProps<Props>(), {
  collapse: true
})

// 获取布局模式信息（左侧布局、顶部布局等）
const { isTop } = useLayoutMode()
</script>

<template>
  <!-- Logo 容器，根据折叠状态和布局模式应用不同的 CSS 类 -->
  <div class="layout-logo-container" :class="{ collapse: props.collapse, 'layout-mode-top': isTop }">
    <!-- 淡入淡出过渡动画 -->
    <transition name="layout-logo-fade">
      <!-- 折叠状态：只显示 logo 图标 -->
      <router-link v-if="props.collapse" key="collapse" to="/" class="logo-link">
        <img :src="logo" class="layout-logo" />
      </router-link>
      <!-- 展开状态：显示 logo 图标 + CiliKube 文字 -->
      <router-link v-else key="expand" to="/" class="logo-link logo-with-text">
        <img :src="logo" class="layout-logo-icon" />
        <span class="logo-text">CiliKube</span>
      </router-link>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
/* Logo 组件样式 */
.layout-logo-container {
  position: relative;
  width: 100%;
  height: var(--v3-header-height);
  /* 使用全局头部高度变量 */
  line-height: var(--v3-header-height);
  text-align: center;
  overflow: hidden;

  /* Logo 链接基础样式 */
  .logo-link {
    display: inline-flex;
    /* 使用 flex 布局让图标和文字水平排列 */
    align-items: center;
    /* 垂直居中对齐 */
    text-decoration: none;
    /* 移除链接下划线 */
    color: inherit;
    /* 继承父元素颜色 */
  }

  /* 折叠状态下的 logo（默认隐藏，在 .collapse 类中显示） */
  .layout-logo {
    display: none;
  }

  /* 展开状态：logo + 文字组合 */
  .logo-with-text {
    gap: 1px;
    /* 图标和文字之间的间距，可调整 */

    /* 展开状态下的 logo 图标样式 */
    .layout-logo-icon {
      width: 80px;
      /* logo 宽度，可调整 */
      height: 80px;
      /* logo 高度，可调整 */
    }

    /* CiliKube 文字样式 */
    .logo-text {
      font-size: 25px;
      /* 文字大小，可调整 */
      font-weight: 700;
      /* 文字粗细，可调整 */
      color: var(--v3-text-color-primary, #333);
      /* 文字颜色，使用主题变量 */
      letter-spacing: 0.5px;
      /* 字母间距，可调整 */
    }
  }
}

/* 顶部布局模式样式 */
.layout-mode-top {
  height: var(--v3-navigationbar-height);
  /* 顶部导航栏高度 */
  line-height: var(--v3-navigationbar-height);
}

/* 折叠状态样式 */
.collapse {

  /* 折叠时显示小 logo */
  .layout-logo {
    width: 32px;
    /* 折叠状态 logo 宽度，可调整 */
    height: 32px;
    /* 折叠状态 logo 高度，可调整 */
    vertical-align: middle;
    display: inline-block;
  }

  /* 折叠时隐藏文字组合 */
  .logo-with-text {
    display: none;
  }
}

/* Logo 切换动画效果 */
.layout-logo-fade-enter-active,
.layout-logo-fade-leave-active {
  transition: opacity 0.3s ease;
  /* 0.3秒淡入淡出动画 */
}

.layout-logo-fade-enter-from,
.layout-logo-fade-leave-to {
  opacity: 0;
  /* 动画起始和结束透明度 */
}
</style>
