<template>
  <view class="page-container">
    <view class="header-section">
      <view @click="goBack" class="back-btn">
        <image src="/static/icons/common/back.png" class="back-icon" mode="aspectFit" />
      </view>
      <text class="header-title">我的作品</text>
      <view class="manage-btn">
        <text class="manage-icon">📋</text>
        <text class="manage-text">管理</text>
      </view>
    </view>

    <view class="content-section">
      <!-- Tab切换 -->
      <view class="tab-container">
        <view class="tab-indicator"
          :style="{ width: 'calc(33.333% - 4px)', left: worksTab === 'all' ? '4px' : worksTab === 'tst' ? 'calc(33.333% + 2px)' : 'calc(66.666%)' }">
        </view>

        <view @click="worksTab = 'all'" class="tab-item" :class="{ 'tab-item-active': worksTab === 'all' }">
          <text class="tab-text">全部</text>
        </view>
        <view @click="worksTab = 'tst'" class="tab-item" :class="{ 'tab-item-active': worksTab === 'tst' }">
          <text class="tab-text">文生图</text>
        </view>
        <view @click="worksTab = 'wst'" class="tab-item" :class="{ 'tab-item-active': worksTab === 'wst' }">
          <text class="tab-text">图生图</text>
        </view>
      </view>

      <!-- 提示信息 -->
      <view class="warning-card">
        <text class="warning-icon">⚠️</text>
        <text class="warning-text">生成的作品仅保留48小时</text>
      </view>

      <!-- 作品列表 -->
      <view class="works-grid">
        <view v-for="item in filteredWorks" :key="item.id" class="work-card">
          <template v-if="item.status === 'generating'">
            <view class="generating-state">
              <view class="pulse-container">
                <view class="pulse-ring pulse-ring-1"></view>
                <view class="pulse-ring pulse-ring-2"></view>
                <view class="pulse-core">
                  <text class="star-icon">⭐</text>
                </view>
              </view>
              <text class="generating-text">AI 正在创作</text>
              <text class="generating-subtext">预计需要 3 分钟</text>
            </view>
          </template>
          <template v-else-if="item.status === 'failed'">
            <view class="failed-state">
              <view class="failed-icon-circle">
                <text class="failed-icon">×</text>
              </view>
              <text class="failed-text">生成失败</text>
              <text class="failed-subtext">请重新尝试</text>
            </view>
          </template>
          <template v-else>
            <view @click="handlePreview(item)" class="work-image-container">
              <image :src="item.image" mode="aspectFill" class="work-image" />
            </view>
            <view class="work-actions">
              <view @click="handleDownload(item)" class="action-icon">
                <text class="download-icon">⬇️</text>
              </view>
            </view>
          </template>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-buttons">
        <view @click="handleBatchManage" class="secondary-btn">
          <text class="btn-icon">📚</text>
          <text class="btn-text">批量管理</text>
        </view>

        <view @click="goBackToCreate" class="primary-btn">
          <text class="btn-icon">⭐</text>
          <text class="btn-text">继续创作</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useGlobalState } from '@/composables/useGlobalState'
import { postGenerateImageQuery } from '@/api/miniapp'

const { getUserId } = useGlobalState()
const worksTab = ref('all')

const worksList = ref([])
const pollingTimer = ref<number | null>(null)

const filteredWorks = computed(() => {
  if (worksTab.value === 'all') return worksList.value
  return worksList.value.filter(item => item.task_type === worksTab.value)
})

const goBack = () => {
  uni.navigateBack()
}

const goBackToCreate = () => {
  uni.navigateBack()
}

const handlePreview = (item: any) => {
  if (item.status === 'generating') {
    uni.showToast({ title: '图片正在生成中', icon: 'none' })
    return
  }
  const urls = filteredWorks.value.filter(w => w.status !== 'generating').map(w => w.image)
  uni.previewImage({
    urls: urls,
    current: item.image
  })
}

const handleDownload = (item: any) => {
  uni.downloadFile({
    url: item.image,
    success: (res) => {
      if (res.statusCode === 200) {
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            uni.showToast({ title: '保存成功', icon: 'success' })
          },
          fail: () => {
            uni.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      }
    },
    fail: () => {
      uni.showToast({ title: '下载失败', icon: 'none' })
    }
  })
}

const handleDelete = (item: any) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${item.title}"吗？`,
    success: (res) => {
      if (res.confirm) {
        const index = worksList.value.findIndex(w => w.id === item.id)
        if (index > -1) {
          worksList.value.splice(index, 1)
          uni.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    }
  })
}

const handleBatchManage = () => {
  uni.showToast({ title: '批量管理功能开发中', icon: 'none' })
}

const getList = async () => {
  // 清除旧的定时器
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value)
    pollingTimer.value = null
  }

  const taskRes: any = await postGenerateImageQuery({
    userid: getUserId() + ''
  })
  if (taskRes.code == 200) {
    let hasGenerating = false

    for (const i of taskRes.data) {
      if (i.qiniu_url === '生成中' || i.qiniu_url === '渲染中') {
        i.status = 'generating'
        i.image = ''
        hasGenerating = true
      } else if (i.qiniu_url === '生成失败' || i.qiniu_url === '失败') {
        i.status = 'failed'
        i.image = ''
      } else {
        i.status = 'completed'
        try {
          i.qiniu_url = JSON.parse(i.qiniu_url)
          if (i.qiniu_url.length > 0) {
            i.image = i.qiniu_url[0]
          }
        } catch (e) {
          console.error('解析图片URL失败', e)
          i.qiniu_url = []
          i.image = ''
        }
      }
    }
    worksList.value = taskRes.data

    // 如果有生成中的任务，5秒后重新查询
    if (hasGenerating) {
      pollingTimer.value = setTimeout(() => {
        getList()
      }, 5000)
    }
  }
}

onLoad(() => {
  getList()
})

onUnload(() => {
  // 页面卸载时清除定时器
  if (pollingTimer.value) {
    clearTimeout(pollingTimer.value)
    pollingTimer.value = null
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #F8F9FD;
  position: relative;
  overflow: hidden;
  padding-bottom: 8px;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 48px 20px 16px;
  background: #F8F9FD;
}

.back-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1F2937;
}

.back-icon {
  width: 20px;
  height: 20px;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
  color: #1F2937;
  letter-spacing: 0.05em;
}

.manage-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #374151;
}

.manage-icon {
  font-size: 18px;
  line-height: 1;
}

.manage-text {
  font-size: 14px;
}

.content-section {
  padding: 0 16px;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 112px;
}

.tab-container {
  background: white;
  border-radius: 50px;
  padding: 4px;
  display: flex;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  margin-bottom: 16px;
}

.tab-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: 50px;
  transition: all 0.3s ease-in-out;
  background: linear-gradient(to right, #8B58FF, #60A5FA);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.tab-item {
  flex: 1;
  padding: 8px 0;
  font-size: 14px;
  font-weight: 500;
  border-radius: 50px;
  position: relative;
  z-index: 10;
  transition: color 0.3s;
  text-align: center;
  color: #6B7280;
}

.tab-item-active {
  color: white;
}

.tab-text {
  font-size: 14px;
}

.warning-card {
  background: #FFF7ED;
  border: 1px solid rgba(251, 146, 60, 0.5);
  border-radius: 12px;
  padding: 10px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.warning-icon {
  font-size: 16px;
  line-height: 1;
}

.warning-text {
  font-size: 13px;
  font-weight: bold;
  color: #EA580C;
}

.works-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.work-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  border: 1px solid #F9FAFB;
}

.generating-state {
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom right, rgba(139, 88, 255, 0.1), rgba(96, 165, 250, 0.1));
}

.pulse-container {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: linear-gradient(to right, #8B58FF, #60A5FA);
  animation: pulse-ring 2s ease-out infinite;
}

.pulse-ring-1 {
  opacity: 0.2;
}

.pulse-ring-2 {
  inset: 8px;
  opacity: 0.4;
  animation-delay: 0.5s;
}

.pulse-core {
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  background: linear-gradient(to right, #8B58FF, #60A5FA);
  display: flex;
  align-items: center;
  justify-content: center;
}

.star-icon {
  font-size: 20px;
  line-height: 1;
  color: white;
}

.generating-text {
  font-size: 13px;
  font-weight: 500;
  color: #8B58FF;
}

.generating-subtext {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 4px;
}

.failed-state {
  aspect-ratio: 1 / 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom right, #FEF2F2, #FFF7ED);
}

.failed-icon-circle {
  width: 48px;
  height: 48px;
  background: #FEE2E2;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.failed-icon {
  font-size: 24px;
  line-height: 1;
  color: #EF4444;
}

.failed-text {
  font-size: 13px;
  font-weight: 500;
  color: #DC2626;
}

.failed-subtext {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 4px;
}

.work-image-container {
  position: relative;
  aspect-ratio: 1 / 1;
  background: #F3F4F6;
}

.work-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.work-actions {
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.action-icon {
  color: #9CA3AF;
  transition: color 0.3s;
}

.action-icon:active {
  color: #8B58FF;
}

.download-icon {
  font-size: 17px;
  line-height: 1;
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
  background: rgba(229, 231, 235, 0.7);
  border: 1px solid #E5E7EB;
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
  padding: 14px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  font-weight: 500;
  transition: transform 0.2s;
}

.primary-btn:active {
  transform: scale(0.95);
}

.btn-icon {
  font-size: 18px;
  line-height: 1;
}

.btn-text {
  font-size: 15px;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }

  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}
</style>