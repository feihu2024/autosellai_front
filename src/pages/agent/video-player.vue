<template>
  <view class="player-page">
    <video
      v-if="videoUrl"
      id="sampleVideo"
      class="player"
      :src="videoUrl"
      :poster="coverUrl"
      :autoplay="true"
      :controls="true"
      object-fit="contain"
      :show-center-play-btn="true"
      :show-fullscreen-btn="true"
      :enable-play-gesture="true"
    />
    <view v-else class="empty">
      <text>暂无视频</text>
    </view>

    <view class="back" :style="{ top: statusBarHeight + 8 + 'px' }" @tap="goBack">
      <text class="back-icon">‹</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onReady, onUnload } from '@dcloudio/uni-app'
import { navigator } from '@/utils'

const STORAGE_KEY = 'agentSamplePlayer'

const videoUrl = ref('')
const coverUrl = ref('')
const statusBarHeight = ref(0)

const sysInfo = uni.getSystemInfoSync()
statusBarHeight.value = sysInfo.statusBarHeight || 0

function safeDecode(value: string) {
  if (!value) return ''
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function goBack() {
  stopPlayback()
  navigator.back()
}

function stopPlayback() {
  try {
    uni.createVideoContext('sampleVideo')?.stop()
  } catch {
    // ignore
  }
}

onLoad((options: any) => {
  const stored = uni.getStorageSync(STORAGE_KEY) || {}
  videoUrl.value = safeDecode(options?.url || stored.url || '')
  coverUrl.value = safeDecode(options?.cover || stored.cover || '')
})

onReady(() => {
  if (!videoUrl.value) return
  try {
    uni.createVideoContext('sampleVideo')?.play()
  } catch {
    // ignore
  }
})

onUnload(() => {
  stopPlayback()
  uni.removeStorageSync(STORAGE_KEY)
})
</script>

<style scoped>
.player-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.player {
  width: 100%;
  height: 100%;
  background: #000;
}

.empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty text {
  color: rgba(255, 255, 255, 0.72);
  font-size: 28rpx;
}

.back {
  position: fixed;
  left: 16px;
  z-index: 20;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}

.back-icon {
  color: #fff;
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
}
</style>
