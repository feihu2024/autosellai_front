<!--
  H5 端自定义 TabBar 组件

  在 H5 端，uni-app 的原生 tabBar 渲染效果与小程序不同，
  为了双模板样式一致，在 H5 端使用自定义 TabBar 组件覆盖原生。

  小程序端使用 pages.json 中配置的原生 tabBar，此组件通过条件编译仅 H5 可见。

  用法：在 TabBar 页面的模板末尾引入 <H5TabBar /> 即可。
-->
<!-- #ifdef H5 -->
<template>
  <view class="h5-tab-bar" :class="{ 'gold-theme': isGoldTemplate }">
    <view
      v-for="tab in tabs"
      :key="tab.pagePath"
      class="tab-item"
      :class="{ active: currentPath === tab.pagePath }"
      @click="onTabClick(tab)"
    >
      <view class="tab-icon-box">
        <image class="tab-icon icon-normal" :src="tab.iconPath" mode="aspectFit" />
        <image class="tab-icon icon-active" :src="tab.selectedIconPath" mode="aspectFit" />
      </view>
      <text class="tab-label">{{ tab.text }}</text>
    </view>
  </view>
</template>
<!-- #endif -->

<script setup lang="ts">
import { computed } from 'vue'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'

const { isGoldTemplate } = useMiniappTemplate()

// 紫色模板（模板1）图标
const purpleTabs = [
  { pagePath: '/pages/home/index', text: '首页', iconPath: '/static/icons/nav/home.png', selectedIconPath: '/static/icons/nav/home-active.png' },
  { pagePath: '/pages/info/index', text: '信息', iconPath: '/static/icons/nav/news.png', selectedIconPath: '/static/icons/nav/news-active.png' },
  { pagePath: '/pages/mall/index', text: '商城', iconPath: '/static/icons/nav/shop.png', selectedIconPath: '/static/icons/nav/shop-active.png' },
  { pagePath: '/pages/mcn/authorization', text: '授权', iconPath: '/static/icons/nav/auth.png', selectedIconPath: '/static/icons/nav/auth-active.png' },
  { pagePath: '/pages/profile/index', text: '我的', iconPath: '/static/icons/nav/profile.png', selectedIconPath: '/static/icons/nav/profile-active.png' },
]

// 金色模板（模板2）图标
const goldTabs = [
  { pagePath: '/pages/home/index', text: '首页', iconPath: '/static/tpl-gold/nav-home.png', selectedIconPath: '/static/tpl-gold/nav-home-active.png' },
  { pagePath: '/pages/info/index', text: '信息', iconPath: '/static/tpl-gold/nav-news.png', selectedIconPath: '/static/tpl-gold/nav-news-active.png' },
  { pagePath: '/pages/mall/index', text: '商城', iconPath: '/static/tpl-gold/nav-shop.png', selectedIconPath: '/static/tpl-gold/nav-shop-active.png' },
  { pagePath: '/pages/mcn/authorization', text: '授权', iconPath: '/static/tpl-gold/nav-auth.png', selectedIconPath: '/static/tpl-gold/nav-auth-active.png' },
  { pagePath: '/pages/profile/index', text: '我的', iconPath: '/static/tpl-gold/nav-mine.png', selectedIconPath: '/static/tpl-gold/nav-mine-active.png' },
]

const tabs = computed(() => (isGoldTemplate.value ? goldTabs : purpleTabs))

const currentPath = computed(() => {
  // #ifdef H5
  // H5 端获取当前 URL 路径
  const hash = window.location.hash || window.location.pathname
  // 从 hash 或 path 中提取 pages 路径
  const match = hash.match(/#?(\/pages\/[^?#]+)/)
  return match ? match[1] : '/pages/home/index'
  // #endif

  // #ifndef H5
  return '/pages/home/index'
  // #endif
})

function onTabClick(tab: any) {
  uni.switchTab({ url: tab.pagePath })
}
</script>

<!-- #ifdef H5 -->
<style scoped lang="scss">
.h5-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  height: calc(60px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid rgba(218, 224, 237, 0.9);
  box-shadow: 0 -4px 20px rgba(46, 58, 96, 0.06);
  display: flex;
  align-items: stretch;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
}

.tab-icon-box {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  transition: background 0.2s;
  position: relative;
}

.tab-icon {
  width: 20px;
  height: 20px;
  position: absolute;
}

.icon-active {
  display: none;
}

.tab-item.active .icon-normal {
  display: none;
}
.tab-item.active .icon-active {
  display: block;
}

.tab-label {
  font-size: 10px;
  font-weight: 600;
  color: #8c97ae;
}

.tab-item.active {
  .tab-label {
    color: #6658f5;
    font-weight: 700;
  }
  .tab-icon-box {
    background: #efedff;
  }
}

/* 金色模板主题 */
.h5-tab-bar.gold-theme {
  .tab-label {
    color: #777b82;
  }
  .tab-item.active {
    .tab-label {
      color: #f2a900;
    }
    .tab-icon-box {
      background: transparent;
    }
  }
  .tab-icon {
    width: 24px;
    height: 24px;
  }
  .tab-label {
    font-size: 11px;
  }
}
</style>
<!-- #endif -->
