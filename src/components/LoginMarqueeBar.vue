<!--
  底部跑马灯登录条组件

  在 5 个 tabBar 页面底部展示（悬浮于 tabBar 之上）：
  - 未绑定手机号（currentUserPhone 为空）时显示
  - 已绑定手机号时自动隐藏
  - 点击整条跳转到登录页

  用法：在 TabBar 页面的模板末尾引入 <LoginMarqueeBar /> 即可。
-->
<template>
  <view v-if="!currentUserPhone" class="login-marquee-bar" @click="goLogin">
    <view class="marquee-icon"><text>📣</text></view>
    <view class="marquee-viewport">
      <view class="marquee-track">
        <text class="marquee-text">{{ marqueeText }}</text>
        <text class="marquee-text">{{ marqueeText }}</text>
      </view>
    </view>
    <view class="marquee-btn"><text>立即登录</text></view>
  </view>
</template>

<script setup lang="ts">
import { useGlobalState } from '@/composables/useGlobalState'

const { currentUserPhone } = useGlobalState()

const marqueeText = '您还未登录，登录后即可解锁完整功能，尊享专属权益与专属服务 »'

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}
</script>

<style scoped lang="scss">
.login-marquee-bar {
  position: fixed;
  left: 0;
  right: 0;
  /* 悬浮于 tabBar 之上（tabBar 高度 50px + 底部安全区） */
  bottom: 0;
  z-index: 998;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 10px 0 12px;
  box-sizing: border-box;
  background: linear-gradient(90deg, #6658f5 0%, #8b7cf8 100%);
  box-shadow: 0 -4px 16px rgba(102, 88, 245, 0.25);
}

.marquee-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  font-size: 14px;
}

.marquee-viewport {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}

.marquee-track {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  animation: marquee-scroll 14s linear infinite;
}

.marquee-text {
  flex-shrink: 0;
  font-size: 12px;
  color: #ffffff;
  padding-right: 40px;
}

.marquee-btn {
  flex-shrink: 0;
  margin-left: 8px;
  padding: 0 12px;
  height: 26px;
  border-radius: 13px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marquee-btn text {
  font-size: 12px;
  font-weight: 600;
  color: #6658f5;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}
</style>
