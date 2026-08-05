<template>
  <view class="page-container">
    <view class="page-gradient-bg"></view>

    <view class="header-section">
      <view @click="goBack" class="header-btn">
        <image src="/static/icons/common/back.png" class="header-icon" mode="aspectFit" />
      </view>
      <text class="header-title">反推提示词</text>
      <view class="header-btn">
        <image src="/static/icons/common/clock.png" class="header-icon" mode="aspectFit" />
      </view>
    </view>

    <view class="content-section">
      <template v-if="!isUploaded">
        <view @click="triggerUpload" class="upload-area">
          <view class="upload-icon-circle">
            <text class="upload-icon-emoji">📤</text>
          </view>
          <view class="upload-text-area">
            <text class="upload-title">点击或拖拽上传视频</text>
            <text class="upload-subtitle">支持 MP4, MOV 格式</text>
          </view>
        </view>

        <view @click="triggerUpload" class="upload-btn primary-gradient-btn">
          <text class="upload-btn-icon">📤</text>
          <text class="upload-btn-text">上传视频</text>
        </view>
      </template>

      <template v-else>
        <view class="video-info-card">
          <view @click="playVideo" class="video-thumbnail">
            <image :src="videoCover" mode="aspectFill" class="video-cover-image" />
            <view class="play-overlay">
              <view class="play-button">
                <text class="play-icon">▶</text>
              </view>
            </view>
            <view class="video-duration-badge">
              {{ videoDuration }}
            </view>
          </view>

          <view class="video-details">
            <view class="video-name-row">
              <text class="video-icon-emoji">🎬</text>
              <text class="video-name-text">{{ videoName }}</text>
            </view>

            <view class="video-meta">
              <view class="meta-item">
                <text class="meta-icon-emoji">⏱</text>
                <text class="meta-text">时长：{{ videoDuration }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-icon-emoji">📁</text>
                <text class="meta-text">大小：{{ videoSize }}</text>
              </view>
            </view>

            <view class="upload-success-badge">
              <text class="success-icon-emoji">✓</text>
              <text class="success-text">上传完成</text>
            </view>
          </view>
        </view>

        <view class="action-buttons">
          <view @click="reUpload" class="action-btn secondary-btn">
            <text class="btn-icon-emoji">🔄</text>
            <text class="btn-text">重新上传</text>
          </view>

          <view @click="handleConfirm" :class="['action-btn', loading ? 'disabled-btn' : 'primary-gradient-btn']">
            <view v-if="loading" class="loading-spinner"></view>
            <template v-else>
              <text class="btn-icon-emoji">✓</text>
              <text class="btn-text">确认</text>
              <view class="cost-badge">
                <text class="cost-icon-emoji">⚡</text>
                <text class="cost-text">10</text>
              </view>
            </template>
          </view>
        </view>
      </template>

      <view class="prompt-card">
        <view class="prompt-header">
          <view class="prompt-title-row">
            <view class="prompt-indicator"></view>
            <text class="prompt-title">提示词</text>
          </view>

          <view @click="copyPrompt" class="copy-btn">
            <text class="copy-icon-emoji">📋</text>
            <text class="copy-btn-text">复制</text>
          </view>
        </view>

        <view class="prompt-content">
          <view v-if="!promptText" class="prompt-empty">
            <text class="empty-text">请先上传视频，确认后生成提示词...</text>
          </view>
          <view v-else>
            <text class="prompt-text">{{ promptText }}</text>
          </view>
        </view>
      </view>

      <view class="footer-note">
        <text class="lock-icon-emoji">🔒</text>
        <text class="footer-text">内容由 AI 生成，仅供参考</text>
      </view>
    </view>

    <view v-if="showToast" class="toast-message">
      <text class="toast-icon-emoji">✓</text>
      <text class="toast-text">已复制到剪贴板</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { postVideoToPrompt } from '@/api/miniapp'

const isUploaded = ref(false)
const showToast = ref(false)
const loading = ref(false)
const uploading = ref(false)

const videoName = ref('')
const videoSize = ref('')
const videoDuration = ref('')
const videoCover = ref('')
const videoPath = ref('')
const videoUrl = ref('')

const promptText = ref('')

const goBack = () => {
  uni.navigateBack()
}

const triggerUpload = () => {
  if (uploading.value) return

  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    success: (res: any) => {
      if (res.duration > 180) {
        uni.showToast({ title: '视频时长不能超过 3 分钟', icon: 'none' })
        return
      }

      uploading.value = true
      uni.showToast({ title: '正在上传...', icon: 'loading', duration: 30000 })

      uni.uploadFile({
        url: 'https://aiplatformsslapi.yxiaozhu.com/api/v1/miniapp/video/upload/',
        filePath: res.tempFilePath,
        name: 'file',
        success: async (uploadFileRes: any) => {
          try {
            const resData = JSON.parse(uploadFileRes.data)
            videoUrl.value = resData.data.video_url
            videoPath.value = res.tempFilePath
            videoName.value = res.tempFilePath.split('/').pop() || '视频文件.mp4'
            videoSize.value = formatSize(res.size)
            videoDuration.value = formatDuration(res.duration)
            videoCover.value = res.thumbTempFilePath || ''
            isUploaded.value = true

            uni.hideToast()
            uni.showToast({ title: '上传成功', icon: 'success' })
          } catch (e) {
            console.error('上传解析失败', e)
            uni.hideToast()
            uni.showToast({ title: '上传失败', icon: 'none' })
          } finally {
            uploading.value = false
          }
        },
        fail: () => {
          uni.hideToast()
          uni.showToast({ title: '上传失败', icon: 'none' })
          uploading.value = false
        }
      })
    },
    fail: () => {
      uni.showToast({ title: '选择视频失败', icon: 'none' })
    }
  })
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const reUpload = () => {
  isUploaded.value = false
  videoPath.value = ''
  videoName.value = ''
  videoSize.value = ''
  videoDuration.value = ''
  videoCover.value = ''
  videoUrl.value = ''
  promptText.value = ''
}

const playVideo = () => {
  if (!videoUrl.value) return
  uni.navigateTo({
    url: `/pages-sub/project/video?url=${encodeURIComponent(videoUrl.value)}&title=${encodeURIComponent(videoName.value)}`
  })
}

const handleConfirm = async () => {
  if (loading.value) return
  if (!videoUrl.value) {
    uni.showToast({ title: '请先上传视频', icon: 'none' })
    return
  }

  loading.value = true
  uni.showToast({ title: '正在生成提示词...', icon: 'loading' })

  try {
    const res: any = await postVideoToPrompt({
      video_url: videoUrl.value,
    })

    uni.hideToast()
    if (res) {
      promptText.value = res.output.choices[0].message.content[0].text
      uni.showToast({ title: '生成成功', icon: 'success' })
    } else {
      uni.showToast({ title: res.message || '生成失败', icon: 'none' })
    }
  } catch (e) {
    console.error('生成失败', e)
    uni.hideToast()
    uni.showToast({ title: '生成失败，请稍后重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const copyPrompt = () => {
  if (!promptText.value) {
    uni.showToast({ title: '暂无提示词可复制', icon: 'none' })
    return
  }

  uni.setClipboardData({
    data: promptText.value,
    success: () => {
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 2000)
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #F8F9FC;
  position: relative;
  overflow: hidden;
}

.page-gradient-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(to top, rgba(167, 139, 250, 0.15), transparent);
  pointer-events: none;
}

.header-section {
  padding: 48px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(248, 249, 252, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 20;
}

.header-btn {
  padding: 8px;
  margin: 0 -8px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.header-btn:active {
  background: rgba(229, 231, 235, 0.5);
}

.header-icon {
  width: 20px;
  height: 20px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #1F2937;
}

.content-section {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  position: relative;
  z-index: 10;
}

.upload-area {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px dashed #E5E7EB;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.upload-area:active {
  border-color: #C4B5FD;
}

.upload-icon-circle {
  width: 56px;
  height: 56px;
  background: #F5F3FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.upload-icon-emoji {
  font-size: 28px;
  line-height: 1;
}

.upload-text-area {
  text-align: center;
}

.upload-title {
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  display: block;
}

.upload-subtitle {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 6px;
  display: block;
}

.upload-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 0;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 500;
  transition: opacity 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.upload-btn:active {
  opacity: 0.9;
}

.primary-gradient-btn {
  background: linear-gradient(to right, #6B73FF, #985BF4);
  color: white;
}

.upload-btn-icon {
  font-size: 16px;
  line-height: 1;
}

.upload-btn-text {
  font-size: 14px;
  font-weight: 500;
}

.video-info-card {
  background: white;
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #F3F4F6;
  display: flex;
  gap: 16px;
  align-items: center;
}

.video-thumbnail {
  position: relative;
  width: 128px;
  height: 96px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  background: #111827;
  cursor: pointer;
}

.video-cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.8;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.play-icon {
  color: white;
  font-size: 20px;
  line-height: 1;
  margin-left: 2px;
}

.video-duration-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.video-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4px 0;
}

.video-name-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 8px;
}

.video-icon-emoji {
  font-size: 18px;
  line-height: 1;
}

.video-name-text {
  color: #1F2937;
  font-weight: 600;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.25;
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #6B7280;
}

.meta-icon-emoji {
  font-size: 14px;
  line-height: 1;
  margin-right: 6px;
}

.meta-text {
  font-size: 12px;
}

.upload-success-badge {
  width: 60px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #059669;
  background: #ECFDF5;
  border: 1px solid #D1FAE5;
  padding: 2px 8px;
  border-radius: 50px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.success-icon-emoji {
  font-size: 12px;
  line-height: 1;
}

.success-text {
  font-size: 11px;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 14px 0;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn:active {
  opacity: 0.9;
}

.secondary-btn {
  border: 1px solid rgba(229, 231, 235, 0.8);
  background: white;
  color: #4B5563;
}

.secondary-btn:active {
  background: #F9FAFB;
}

.disabled-btn {
  background: #D1D5DB;
  color: white;
}

.btn-icon-emoji {
  font-size: 16px;
  line-height: 1;
}

.btn-text {
  font-size: 14px;
  font-weight: 500;
}

.cost-badge {
  margin-left: 4px;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50px;
  padding: 2px 8px;
  font-size: 10px;
  backdrop-filter: blur(4px);
}

.cost-icon-emoji {
  font-size: 12px;
  line-height: 1;
}

.cost-text {
  color: white;
  font-size: 10px;
  margin-left: 2px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.prompt-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(243, 244, 246, 0.8);
  position: relative;
  display: flex;
  flex-direction: column;
  height: 450px;
}

.prompt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.prompt-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt-indicator {
  width: 4px;
  height: 16px;
  border-radius: 50px;
  background: linear-gradient(to bottom, #6B73FF, #985BF4);
}

.prompt-title {
  font-weight: 500;
  font-size: 15px;
  color: #1F2937;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6B7280;
  background: #F4F5F8;
  padding: 6px 12px;
  border-radius: 50px;
  transition: background-color 0.2s;
  border: 1px solid #F3F4F6;
}

.copy-btn:active {
  background: #E5E7EB;
}

.copy-icon-emoji {
  font-size: 14px;
  line-height: 1;
}

.copy-btn-text {
  font-size: 12px;
}

.prompt-content {
  background: #F8F9FB;
  border-radius: 12px;
  padding: 16px;
  font-size: 13.5px;
  color: #4B5563;
  line-height: 1.6;
  letter-spacing: 0.02em;
  flex: 1;
  overflow-y: auto;
}

.prompt-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  font-size: 14px;
}

.empty-text {
  font-size: 14px;
  color: #9CA3AF;
}

.prompt-text {
  font-size: 13.5px;
  color: #4B5563;
  line-height: 1.6;
}

.footer-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: #9CA3AF;
  margin-top: auto;
  padding-top: 8px;
}

.lock-icon-emoji {
  font-size: 14px;
  line-height: 1;
}

.footer-text {
  font-size: 11px;
}

.toast-message {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: #1F2937;
  color: white;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 50px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.toast-icon-emoji {
  font-size: 16px;
  line-height: 1;
  color: #4ADE80;
}

.toast-text {
  font-size: 14px;
}
</style>