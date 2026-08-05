<template>
  <view class="page-container">
    <view class="header-section">
      <view @click="goBack" class="back-btn">
        <image src="/static/icons/common/back.png" class="back-icon" mode="aspectFit" />
      </view>
    </view>

    <scroll-view scroll-y class="scroll-content">
      <view class="content-area">
        <!-- Tab切换 -->
        <view class="tab-container">
          <view class="tab-indicator" :style="{ left: activeTab === 'text2img' ? '4px' : 'calc(50% + 3px)' }"></view>

          <view @click="activeTab = 'text2img'" class="tab-item"
            :class="{ 'tab-item-active': activeTab === 'text2img' }">
            <text class="tab-text">文生图</text>
            <text v-if="activeTab === 'text2img'" class="tab-icon">⭐</text>
          </view>
          <view @click="activeTab = 'img2img'" class="tab-item" :class="{ 'tab-item-active': activeTab === 'img2img' }">
            <text class="tab-text">图生图</text>
          </view>
        </view>

        <!-- 关键词输入 -->
        <view class="input-card">
          <text class="card-title">关键词输入</text>
          <view class="input-wrapper">
            <textarea v-model="promptText" class="input-textarea" placeholder="请输入画面描述词" :maxlength="maxChars" />

            <view class="input-footer">
              <text class="magic-icon">✨</text>
              <text class="char-counter">{{ promptText.length }}/{{ maxChars }}</text>
            </view>
          </view>
        </view>

        <!-- 参考图片（图生图模式） -->
        <view v-if="activeTab === 'img2img'" class="image-card">
          <text class="card-title">参考图片</text>
          <template v-if="!imageUploaded">
            <view @click="triggerImageUpload" class="upload-area">
              <view class="upload-icon-circle">
                <text class="upload-icon">📤</text>
              </view>
              <text class="upload-title">点击上传参考图片</text>
              <text class="upload-subtitle">支持 JPG、PNG 格式，最多9张</text>
            </view>
          </template>
          <template v-else>
            <view class="image-grid">
              <view v-for="(preview, index) in imagePreviews" :key="index" class="image-item">
                <image :src="preview" mode="aspectFill" class="image-preview" />
                <view @click="removeImage(index)" class="remove-btn">
                  <text class="remove-icon">×</text>
                </view>
              </view>
              <view v-if="imagePreviews.length < 9" @click="triggerImageUpload" class="add-image-btn">
                <text class="add-icon">+</text>
                <text class="add-text">继续添加</text>
              </view>
            </view>
            <view class="upload-status">
              <text class="check-icon">✓</text>
              <text class="status-text">已上传 {{ imageUrls.length }} 张图片</text>
            </view>
          </template>
        </view>

        <!-- 尺寸选择 -->
        <view class="ratio-card">
          <text class="card-title">尺寸选择</text>
          <scroll-view scroll-x class="ratio-scroll">
            <view class="ratio-container">
              <view v-for="ratio in ratios" :key="ratio.id" @click="activeRatio = ratio.id" class="ratio-item"
                :class="{ 'ratio-item-active': activeRatio === ratio.id }">
                <view class="ratio-box" :class="{ 'ratio-box-active': activeRatio === ratio.id }"
                  :style="{ width: ratio.w, height: ratio.h }"></view>
                <text class="ratio-label" :class="{ 'ratio-label-active': activeRatio === ratio.id }">
                  {{ ratio.label }}
                </text>
              </view>
            </view>
          </scroll-view>
        </view>

        <!-- 清晰度选择 -->
        <view class="resolution-card">
          <text class="card-title">清晰度选择</text>
          <view class="resolution-container">
            <view v-for="res in resolutions" :key="res.id" @click="activeResolution = res.id" class="resolution-item"
              :class="{ 'resolution-item-active': activeResolution === res.id }">
              <text class="resolution-badge" :class="{ 'resolution-badge-active': activeResolution === res.id }">
                {{ res.badge }}
              </text>
              <text class="resolution-label" :class="{ 'resolution-label-active': activeResolution === res.id }">
                {{ res.label }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-buttons">
        <view @click="goToMyWorks" class="secondary-btn">
          <text class="btn-icon">📁</text>
          <text class="btn-text">我的作品</text>
        </view>

        <view @click="handleGenerate" :class="['primary-btn', { 'primary-btn-loading': loading }]">
          <view v-if="loading" class="loading-spinner"></view>
          <template v-else>
            <text class="btn-icon">⭐</text>
            <text class="btn-text">立即生成</text>
            <view class="cost-badge">
              <text class="cost-icon">⚡</text>
              <text class="cost-text">{{ currentCost }}</text>
            </view>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

import { postGenerateImage } from '@/api/miniapp'
import { useGlobalState } from '@/composables/useGlobalState'

const { getUserId } = useGlobalState()

const activeTab = ref('text2img')
const promptText = ref('')
const maxChars = 1000
const loading = ref(false)

const imageUrls = ref<string[]>([])
const imagePreviews = ref<string[]>([])
const uploadingImage = ref(false)

const imageUploaded = computed(() => imageUrls.value.length > 0)

const ratios = [
  { id: '1:1', label: '1:1', w: '22px', h: '22px', size: '1024x1024' },
  { id: '4:3', label: '4:3', w: '26px', h: '20px', size: '1024x768' },
  { id: '3:4', label: '3:4', w: '20px', h: '26px', size: '768x1024' },
  { id: '16:9', label: '16:9', w: '28px', h: '16px', size: '1024x576' },
  { id: '9:16', label: '9:16', w: '16px', h: '28px', size: '576x1024' },
]
const activeRatio = ref('1:1')

const resolutions = [
  { id: 'SD', label: '标清', badge: 'SD', cost: 5, resolution: '1k' },
  { id: 'HD', label: '高清', badge: 'HD', cost: 10, resolution: '2k' },
  { id: 'UHD', label: '超清', badge: 'UHD', cost: 15, resolution: '4k' },
]
const activeResolution = ref('HD')

const currentCost = computed(() => {
  const res = resolutions.find(r => r.id === activeResolution.value)
  return res ? res.cost : 10
})

const goBack = () => {
  uni.navigateBack()
}

const goToMyWorks = () => {
  uni.navigateTo({
    url: '/pages/aiAgent/myWorks'
  })
}

const triggerImageUpload = () => {
  if (uploadingImage.value) return

  const remainingCount = 9 - imageUrls.value.length

  uni.chooseImage({
    count: remainingCount,
    sourceType: ['album', 'camera'],
    success: (res: any) => {
      uploadingImage.value = true
      uni.showToast({ title: '正在上传...', icon: 'loading', duration: 30000 })

      const uploadPromises = res.tempFilePaths.map((filePath: string) => {
        return new Promise((resolve, reject) => {
          uni.uploadFile({
            url: 'https://aiplatformsslapi.yxiaozhu.com/api/v1/miniapp/video/upload/',
            filePath: filePath,
            name: 'file',
            success: async (uploadFileRes: any) => {
              try {
                const resData = JSON.parse(uploadFileRes.data)
                console.log(resData)
                const url = resData.data.video_url
                resolve({ url: url, preview: filePath })
              } catch (e) {
                reject(e)
              }
            },
            fail: reject
          })
        })
      })

      Promise.all(uploadPromises)
        .then((results: any[]) => {
          results.forEach((result) => {
            imageUrls.value.push(result.url)
            imagePreviews.value.push(result.preview)
          })

          uni.hideToast()
          uni.showToast({ title: '上传成功', icon: 'success' })
        })
        .catch((e) => {
          console.error('上传解析失败', e)
          uni.hideToast()
          uni.showToast({ title: '上传失败', icon: 'none' })
        })
        .finally(() => {
          uploadingImage.value = false
        })
    },
    fail: () => {
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    }
  })
}

const removeImage = (index: number) => {
  imageUrls.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

const handleGenerate = async () => {
  if (!promptText.value.trim()) {
    uni.showToast({ title: '请输入关键词', icon: 'none' })
    return
  }

  if (activeTab.value === 'img2img' && imageUrls.value.length === 0) {
    uni.showToast({ title: '请上传参考图片', icon: 'none' })
    return
  }

  if (loading.value) return
  loading.value = true

  const currentRatio = ratios.find(r => r.id === activeRatio.value)
  const currentRes = resolutions.find(r => r.id === activeResolution.value)

  try {
    uni.showToast({ title: '正在生成...', icon: 'loading', duration: 60000 })

    const res: any = await postGenerateImage({
      userid: getUserId() + '',
      prompt: promptText.value,
      size: currentRatio?.id,
      resolution: currentRes?.resolution,
      image_urls: activeTab.value === 'img2img' ? imageUrls.value : undefined,
    })

    uni.hideToast()
    if (res.code == 200) {
      uni.showToast({ title: '生成任务已启动，请稍后在我的作品中查看结果', icon: 'success' })
    } else {
      uni.showToast({ title: res.message, icon: 'none' })
    }
  } catch (e) {
    console.error('生成失败', e)
    uni.hideToast()
    uni.showToast({ title: '生成失败，请稍后重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #F8F9FD;
  position: relative;
  overflow: hidden;
  padding-bottom: 0;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 48px 20px 16px;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
}

.back-icon {
  width: 20px;
  height: 20px;
}

.scroll-content {
  flex: 1;
}

.content-area {
  padding: 0 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 120px;
}

.tab-container {
  background: white;
  border-radius: 50px;
  padding: 4px;
  display: flex;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 50px;
  transition: all 0.3s ease-in-out;
  background: linear-gradient(to right, #8B58FF, #60A5FA);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  width: calc(50% - 4px);
}

.tab-item {
  flex: 1;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 500;
  border-radius: 50px;
  position: relative;
  z-index: 10;
  transition: color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #6B7280;
}

.tab-item-active {
  color: white;
}

.tab-text {
  font-size: 14px;
}

.tab-icon {
  font-size: 12px;
  line-height: 1;
}

.input-card {
  background: white;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 15px;
  font-weight: bold;
  color: #1F2937;
  margin-bottom: 12px;
  display: block;
}

.input-wrapper {
  position: relative;
  background: #F9FAFB;
  border: 1px solid #F3F4F6;
  border-radius: 16px;
  padding: 12px;
  padding-bottom: 32px;
  height: 80px;
}

.input-textarea {
  width: 100%;
  height: 100%;
  background: transparent;
  resize: none;
  outline: none;
  color: #374151;
  font-size: 14px;
}

.input-footer {
  position: absolute;
  bottom: 8px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.magic-icon {
  font-size: 16px;
  line-height: 1;
}

.char-counter {
  font-size: 12px;
  color: #9CA3AF;
}

.image-card {
  background: white;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.upload-area {
  background: #F9FAFB;
  border: 2px dashed #E5E7EB;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:active {
  border-color: #C4B5FD;
}

.upload-icon-circle {
  width: 40px;
  height: 40px;
  background: #F5F3FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 20px;
  line-height: 1;
}

.upload-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.upload-subtitle {
  font-size: 11px;
  color: #9CA3AF;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.image-item {
  position: relative;
  background: #F9FAFB;
  border: 1px solid #F3F4F6;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-icon {
  color: white;
  font-size: 16px;
  line-height: 1;
}

.add-image-btn {
  background: #F9FAFB;
  border: 2px dashed #E5E7EB;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  cursor: pointer;
  transition: border-color 0.3s;
}

.add-image-btn:active {
  border-color: #C4B5FD;
}

.add-icon {
  font-size: 20px;
  line-height: 1;
  color: #8B58FF;
}

.add-text {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 4px;
}

.upload-status {
  background: rgba(139, 88, 255, 0.1);
  border: 1px solid rgba(139, 88, 255, 0.2);
  border-radius: 50px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.check-icon {
  font-size: 14px;
  line-height: 1;
  color: #8B58FF;
}

.status-text {
  font-size: 12px;
  font-weight: 500;
  color: #8B58FF;
}

.ratio-card {
  background: white;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ratio-scroll {
  width: 100%;
  white-space: nowrap;
}

.ratio-container {
  display: inline-flex;
  gap: 10px;
  padding-bottom: 4px;
}

.ratio-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 64px;
  height: 80px;
  border-radius: 16px;
  border: 1px solid #E5E7EB;
  background: #F9FAFB;
  transition: all 0.3s;
}

.ratio-item-active {
  border-color: #8B58FF;
  background-color: rgba(139, 88, 255, 0.05);
}

.ratio-box {
  border: 2px solid #6B7280;
  border-radius: 2px;
  transition: all 0.3s;
}

.ratio-box-active {
  border-color: #8B58FF;
  background-color: rgba(139, 88, 255, 0.1);
}

.ratio-label {
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
}

.ratio-label-active {
  color: #8B58FF;
}

.resolution-card {
  background: white;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.resolution-container {
  display: flex;
  gap: 12px;
}

.resolution-item {
  flex: 1;
  padding: 12px 0;
  border-radius: 16px;
  border: 1px solid #F3F4F6;
  background: #F9FAFB;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.3s;
}

.resolution-item-active {
  border-color: #8B58FF;
  background: rgba(139, 88, 255, 0.05);
}

.resolution-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #9CA3AF;
  color: #6B7280;
  font-weight: 500;
  line-height: 1;
}

.resolution-badge-active {
  border-color: #8B58FF;
  color: #8B58FF;
}

.resolution-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-top: 4px;
}

.resolution-label-active {
  color: #8B58FF;
}

.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, #F8F9FD, #F8F9FD, transparent);
  padding-top: 32px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.secondary-btn {
  flex: 1;
  background: white;
  border: 1px solid #F3F4F6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 50px;
  padding: 14px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #374151;
  font-weight: 500;
  transition: transform 0.2s;
}

.secondary-btn:active {
  transform: scale(0.95);
}

.primary-btn {
  flex: 1.5;
  background: linear-gradient(to right, #8B58FF, #60A5FA);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border-radius: 50px;
  padding: 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: transform 0.2s;
}

.primary-btn:active {
  transform: scale(0.95);
}

.primary-btn-loading {
  background: #D1D5DB;
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.btn-text {
  font-size: 15px;
}

.cost-badge {
  font-size: 12px;
  background: rgba(255, 255, 255, 0.25);
  padding: 4px 10px;
  border-radius: 50px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.cost-icon {
  font-size: 15px;
  line-height: 1;
}

.cost-text {
  color: white;
  font-size: 12px;
}

.loading-spinner {
  width: 18px;
  height: 18px;
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
</style>