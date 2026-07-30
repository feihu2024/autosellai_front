<template>
  <!--
    自定义导航栏组件
    用于非 TabBar 页面（详情页、子页面等）
    提供统一的返回按钮 + 标题 + 状态栏占位

    注意：使用 navigationStyle: custom 的页面需要自行处理状态栏高度
  -->
  <view class="custom-nav" :style="{ paddingTop: statusBarHeight + 'px' }">
    <view class="nav-bar">
      <view class="nav-left" @tap="handleBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="nav-title">{{ title }}</text>
      <view class="nav-right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  title?: string
}>()

const statusBarHeight = ref(0)

// 获取状态栏高度
const sysInfo = uni.getSystemInfoSync()
statusBarHeight.value = sysInfo.statusBarHeight || 0

function handleBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 })
  } else {
    // 无上一页时回首页
    uni.switchTab({ url: '/pages/home/index' })
  }
}
</script>

<style scoped lang="scss">
.custom-nav {
  position: relative;
  z-index: 100;
  background: #fff;
}

.nav-bar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.nav-left {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 28px;
  color: #1e293b;
  font-weight: 300;
  line-height: 1;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #1e293b;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-right {
  position: absolute;
  right: 12px;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
}
</style>
