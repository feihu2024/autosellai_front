<template>
  <view class="page-container">
    <view class="page-gradient-bg"></view>

    <view class="header-section">
      <view @click="goBack" class="back-btn">
        <image src="/static/icons/common/back.png" class="back-icon" mode="aspectFit" />
      </view>
    </view>

    <scroll-view scroll-y class="scroll-container">
      <view class="content-section">
        <view v-if="videoUrl" class="video-card">
          <view class="card-header">
            <image src="/static/icons/common/play.png" class="card-icon" mode="aspectFit" />
            <text class="card-title">视频预览</text>
          </view>
          <view class="video-wrapper">
            <video controls class="video-player" :src="videoUrl" :poster="coverUrl"></video>
          </view>
          <view @click="handleSave('video')" class="save-btn primary-btn">
            <text class="icon-text">⬇</text>
            <text class="save-btn-text">保存视频至相册</text>
          </view>
        </view>

        <view v-if="videoUrl" class="cover-card">
          <view class="card-header">
            <text class="card-icon-emoji">🖼</text>
            <text class="card-title">封面预览</text>
          </view>
          <view class="cover-wrapper">
            <image :src="coverUrl" mode="aspectFill" class="cover-image" />
          </view>
          <view @click="handleSave('cover')" class="save-btn secondary-btn">
            <text class="icon-text">⬇</text>
            <text class="save-btn-text">保存封面图片</text>
          </view>
        </view>

        <view v-else class="gallery-card">
          <view class="card-header-row">
            <view class="card-header">
              <text class="card-icon-emoji">📷</text>
              <text class="card-title">
                提取图集 <text class="gallery-count">({{ gallery.length }}张)</text>
              </text>
            </view>
            <view @click="handleSelectAll" class="select-all-btn">
              {{ selectedImages.length === gallery.length ? '取消全选' : '全选' }}
            </view>
          </view>

          <view class="gallery-grid">
            <view v-for="(src, idx) in gallery" :key="idx" @click="toggleImageSelection(idx)"
              :class="['gallery-item', { 'gallery-item-selected': selectedImages.includes(idx) }]">
              <image :src="src" mode="aspectFill" class="gallery-image" />
              <view :class="['gallery-checkbox', { 'gallery-checkbox-selected': selectedImages.includes(idx) }]">
                <text v-if="selectedImages.includes(idx)" class="check-icon">✓</text>
              </view>
            </view>
          </view>

          <view @click="handleDownloadGallery" :disabled="selectedImages.length === 0"
            :class="['save-btn', selectedImages.length > 0 ? 'primary-btn' : 'disabled-btn']">
            <text class="icon-text">⬇</text>
            <text class="save-btn-text">
              下载选中图片 {{ selectedImages.length > 0 ? `(${selectedImages.length})` : '' }}
            </text>
          </view>
        </view>

        <view class="text-card">
          <view class="card-header-row">
            <view class="card-header">
              <text class="card-icon-emoji">📝</text>
              <text class="card-title">提取文案</text>
            </view>
            <view @click="handleCopyText" class="copy-btn">
              <text class="icon-text">📋</text>
              <text class="copy-btn-text">复制文案</text>
            </view>
          </view>

          <view class="text-content">
            <text class="text-title">{{ titleText }}</text>
            <text class="text-tags">{{ tagsText }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script lang="ts" setup>
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { postDownloadVideo } from '@/api/miniapp'

const selectedImages = ref<number[]>([])

const videoUrl = ref('')
const coverUrl = ref('')
const downloadUrl = ref('')
const coverDownloadUrl = ref('')
const titleText = ref('')
const tagsText = ref('')
const gallery = ref<string[]>([])

onLoad((options: any) => {
  if (options?.data) {
    try {
      const data = JSON.parse(decodeURIComponent(options.data))
      videoUrl.value = data.video_url || ''
      coverUrl.value = data.cover_url || ''
      titleText.value = data.title || ''
      tagsText.value = data.tags || ''
      gallery.value = data.pics || []
    } catch (e) {
      console.error('解析数据失败', e)
    }
  }
})

const goBack = () => {
  uni.navigateBack()
}

const showToast = (msg: string) => {
  uni.showToast({
    title: msg,
    icon: 'none',
    duration: 3000
  })
}

const linkArr = [
  "https://aivideoapi.gudekj.com",
  "https://mlcfjihuaqn.yxiaozhu.com",
  "https://mzyer8wh3bytfapiadmin.gudekj.com",
  "https://task.yxiaozhu.com",
  "https://vipvideo.yxiaozhu.com",
  "https://yxiaozhu.com",
  "https://tcb-api.tencentcloudapi.com",
]

const isInternalUrl = (url: string) => {
  return linkArr.some(domain => url.includes(domain))
}

const getDownloadUrl = async (url: string): Promise<string> => {
  if (isInternalUrl(url)) {
    return url
  }
  try {
    const res: any = await postDownloadVideo({ url })
    if (res.data && res.data.qiniu_url) {
      return res.data.qiniu_url
    }
  } catch (e) {
    console.error('获取下载链接失败', e)
  }
  return url
}

const handleSave = async (type: 'video' | 'cover') => {
  const originalUrl = type === 'video' ? videoUrl.value : coverUrl.value

  uni.showLoading({ title: '处理中...' })

  try {
    const url = await getDownloadUrl(originalUrl)

    uni.downloadFile({
      url,
      success: (res) => {
        uni.hideLoading()
        if (res.statusCode === 200) {
          if (type === 'video') {
            uni.saveVideoToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                showToast('保存成功')
              },
              fail: () => {
                showToast('保存失败')
              }
            })
          } else {
            uni.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                showToast('保存成功')
              },
              fail: () => {
                showToast('保存失败')
              }
            })
          }
        }
      },
      fail: () => {
        uni.hideLoading()
        showToast('下载失败')
      }
    })
  } catch (e) {
    uni.hideLoading()
    showToast('处理失败')
  }
}

const handleSelectAll = () => {
  if (selectedImages.value.length === gallery.value.length) {
    selectedImages.value = []
  } else {
    selectedImages.value = gallery.value.map((_, idx) => idx)
  }
}

const toggleImageSelection = (idx: number) => {
  const index = selectedImages.value.indexOf(idx)
  if (index > -1) {
    selectedImages.value.splice(index, 1)
  } else {
    selectedImages.value.push(idx)
  }
}

const handleDownloadGallery = () => {
  if (selectedImages.value.length === 0) return

  selectedImages.value.forEach(async (idx) => {
    const url = gallery.value[idx]
    const downloadUrl = await getDownloadUrl(url)
    uni.downloadFile({
      url: downloadUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              showToast(`图片 ${idx + 1} 保存成功`)
            }
          })
        }
      }
    })
  })
}

const handleCopyText = () => {
  const fullText = `${titleText.value}\n${tagsText.value}`
  uni.setClipboardData({
    data: fullText,
    success: () => {
      showToast('文案已复制')
    }
  })
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #F7F9FE;
  position: relative;
  overflow: hidden;
}

.page-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 256px;
  background: linear-gradient(to bottom, #E6EAFC, transparent);
  opacity: 0.8;
  pointer-events: none;
}

.header-section {
  padding: 48px 24px 8px;
  position: relative;
  z-index: 10;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
}

.back-icon {
  width: 20px;
  height: 20px;
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
  z-index: 10;
  padding-bottom: 40px;
  height: calc(100vh - 100px);
}

.content-section {
  padding: 0 20px;
}

.video-card,
.cover-card,
.gallery-card,
.text-card {
  margin-top: 16px;
  margin-bottom: 24px;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 0 4px;
}

.card-icon {
  width: 20px;
  height: 20px;
}

.card-icon-emoji {
  font-size: 20px;
  line-height: 1;
}

.card-title {
  font-weight: bold;
  color: #1A1A1A;
  font-size: 16px;
}

.video-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-wrapper {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #F3F4F6;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.save-btn {
  width: 100%;
  border-radius: 16px;
  padding: 14px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
}

.save-btn:active {
  transform: scale(0.95);
}

.primary-btn {
  background: linear-gradient(to right, #7B8BFF, #5165FF);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.secondary-btn {
  background: #F2F5FF;
  border: 1px solid #E8EDFF;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.disabled-btn {
  background: #F3F4F6;
  color: #9CA3AF;
}

.icon-text {
  font-size: 16px;
  line-height: 1;
}

.save-btn-text {
  font-weight: 600;
  font-size: 15px;
  color: white;
}

.secondary-btn .save-btn-text {
  color: #5A75FF;
}

.disabled-btn .save-btn-text {
  color: #9CA3AF;
}

.gallery-card {
  display: flex;
  flex-direction: column;
}

.card-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 0 4px;
}

.gallery-count {
  color: #9CA3AF;
  font-size: 14px;
  font-weight: normal;
}

.select-all-btn {
  font-size: 14px;
  color: #5A75FF;
  font-weight: 500;
  padding: 4px 8px;
  background: #F2F5FF;
  border-radius: 8px;
  transition: transform 0.2s;
}

.select-all-btn:active {
  transform: scale(0.95);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
  cursor: pointer;
}

.gallery-item-selected {
  box-shadow: 0 0 0 2px #5A75FF, 0 0 0 4px rgba(90, 117, 255, 0.2);
  transform: scale(0.95);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-checkbox {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.8);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.gallery-checkbox-selected {
  background: #5A75FF;
  border-color: #5A75FF;
}

.check-icon {
  color: white;
  font-size: 14px;
  line-height: 1;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #F2F5FF;
  color: #5A75FF;
  border-radius: 12px;
  transition: transform 0.2s;
}

.copy-btn:active {
  transform: scale(0.95);
}

.copy-btn-text {
  font-size: 13px;
  font-weight: bold;
}

.text-content {
  background: #F9FAFB;
  border-radius: 16px;
  padding: 16px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
  border: 1px solid #F3F4F6;
}

.text-title {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.text-tags {
  color: #5A75FF;
  word-break: break-all;
}
</style>