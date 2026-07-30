<template>
  <view class="webview-page">
    <!-- H5 端：iframe + 完成按钮 -->
    <!-- #ifdef H5 -->
    <view class="webview-tips" v-if="!loaded && authUrl">
      <text class="tips-icon">⏳</text>
      <text class="tips-text">正在加载授权页面...</text>
    </view>

    <view class="iframe-container" v-if="authUrl">
      <iframe
        :src="authUrl"
        class="auth-frame"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        @load="onFrameLoad"
      ></iframe>
    </view>

    <view class="webview-empty" v-else>
      <text class="empty-text">授权链接无效</text>
      <view class="back-btn" @click="goAuthPage"><text>返回授权页</text></view>
    </view>

    <view class="webview-footer" v-if="loaded">
      <text class="footer-tip">完成授权后，请点击下方按钮返回</text>
      <view class="done-btn" @click="onDone"><text>我已完成授权</text></view>
    </view>
    <!-- #endif -->

    <!-- 微信小程序端：web-view 全屏 -->
    <!-- #ifdef MP-WEIXIN -->
    <view class="webview-tips" v-if="!authUrl">
      <text class="tips-icon">⚠</text>
      <text class="tips-text">授权链接无效</text>
      <view class="back-btn" @click="goAuthPage"><text>返回授权页</text></view>
    </view>

    <web-view v-if="authUrl" :src="authUrl" @message="onWebMessage"></web-view>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { navigator } from '@/utils'

const authUrl = ref('')
const loaded = ref(false)

onLoad((options: any) => {
  if (options?.url) {
    authUrl.value = decodeURIComponent(options.url)
  }
})

function onFrameLoad() {
  loaded.value = true
}

function onDone() {
  // 返回授权管理页并刷新状态
  navigator.replace('/m/mcn-authorization')
}

function goAuthPage() {
  navigator.replace('/m/mcn-authorization')
}

function onWebMessage(_e: any) {
  // 微信小程序 web-view 的 postMessage 回调（授权完成后外部页面可能发送消息）
}
</script>

<style scoped>
.webview-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* H5 iframe 样式 */
.iframe-container {
  flex: 1;
}
.auth-frame {
  width: 100%;
  min-height: 520px;
  border: none;
  border-radius: 12px;
  margin: 0 0 16px;
}

/* 加载提示 */
.webview-tips {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
}
.tips-icon { font-size: 40px; }
.tips-text { font-size: 14px; color: #64748b; }

/* 空状态 */
.webview-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}
.empty-text { font-size: 14px; color: #64748b; }
.back-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  background: #3488ff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.back-btn text { color: #fff; font-size: 13px; font-weight: 600; }

/* 底部完成按钮 */
.webview-footer {
  padding: 16px;
  text-align: center;
}
.footer-tip { font-size: 12px; color: #64748b; display: block; margin-bottom: 12px; }
.done-btn {
  width: 100%;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, #34d399, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
}
.done-btn text { color: #fff; font-size: 15px; font-weight: 700; }
</style>
