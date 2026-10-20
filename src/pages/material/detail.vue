<template>
  <view class="detail-page">
    <!-- 自定义导航 -->
    <view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="back" @tap="goBack"><text class="back-chevron"></text></view>
      <text class="nav-title">素材详情</text>
    </view>

    <view v-if="detail" class="content">
      <!-- 封面 / 视频 -->
      <view class="section hero">
        <view class="cover">
          <video v-if="videoPlaying && detail.videoUrl" class="cover-video" :src="detail.videoUrl" controls autoplay
            show-fullscreen-btn object-fit="cover" />
          <template v-else>
            <image :src="detail.cover" mode="aspectFill" />
            <view class="play" @tap="onPlay">
              <view class="triangle"></view>
            </view>
            <text v-if="detail.duration" class="duration">{{ detail.duration }}</text>
          </template>
        </view>
        <text class="hero-title">{{ detail.title }}</text>
        <text v-if="detail.subtitle" class="hero-subtitle">{{ detail.subtitle }}</text>
        <view class="meta">
          <scroll-view scroll-x class="tags-scroll" :show-scrollbar="false">
            <view class="tags">
              <text v-for="(tag, i) in detail.tags.slice(0, 5)" :key="i" class="tag">{{ tag }}</text>
            </view>
          </scroll-view>
          <text class="meta-date">更新时间：{{ detail.date || '-' }}</text>
        </view>
      </view>

      <!-- 图片合集 -->
      <view class="section" v-if="detail.images.length">
        <view class="section-head">
          <view class="section-title">图片合集<text class="muted">（{{ detail.images.length }}张）</text></view>
          <view class="link" @tap="saveAlbum">
            <text>保存相册</text><text class="link-chevron"></text>
          </view>
        </view>
        <view class="gallery">
          <view v-for="(src, i) in detail.images" :key="i" class="gallery-item" @tap="previewImage(i)">
            <image :src="src" mode="aspectFill" />
          </view>
        </view>
      </view>

      <!-- 文案内容 -->
      <view class="section" v-if="detail.copyText">
        <view class="section-head">
          <view class="section-title">文案内容</view>
          <text v-if="detail.scene" class="usage">适用于：{{ detail.scene }}</text>
        </view>
        <view class="copy-box">
          <text class="copy-text">{{ detail.copyText }}</text>
          <view class="copy-btn" @tap="copyText">
            <text>复制文案</text>
          </view>
        </view>
      </view>

      <!-- 视频下载 -->
      <view class="section">
        <view class="section-head">
          <view class="section-title">视频下载</view>
        </view>
        <view class="download-row">
          <image class="mini-cover" :src="detail.cover" mode="aspectFill" />
          <view class="file-info">
            <text class="file-name">MP4 格式</text>
            <text v-if="detail.duration" class="file-meta">时长：{{ detail.duration }}<text
                v-if="detail.videoSize">　|　大小：{{
                  detail.videoSize }}</text></text>
            <text v-else-if="detail.videoSize" class="file-meta">大小：{{ detail.videoSize }}</text>
            <text v-if="detail.resolution" class="file-meta">分辨率：{{ detail.resolution }} 高清</text>
          </view>
          <view class="download-btn" @tap="downloadVideo">
            <view class="download-ico"></view>
            <text>下载视频</text>
          </view>
        </view>
      </view>

      <!-- 素材说明 -->
      <view class="section desc-section">
        <view class="section-title">素材说明</view>
        <view class="desc-list">
          <view class="desc-row" v-if="detail.scene || detail.subtitle">
            <text class="dt">适用场景</text>
            <text class="dd">{{ detail.scene || detail.subtitle }}</text>
          </view>
          <view class="desc-row" v-if="detail.tags.length">
            <text class="dt">素材标签</text>
            <text class="dd">{{ detail.tags.join('、') }}</text>
          </view>
          <view class="desc-row" v-if="detail.date">
            <text class="dt">更新时间</text>
            <text class="dd">{{ detail.date }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else-if="!loading" class="empty">
      <text>素材不存在或已下架</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMaterialDetail } from '@/api/miniapp'
import { navigator, showToast } from '@/utils'
import { getImageUrl } from '@/utils/image'

const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 20)

const loading = ref(false)
const videoPlaying = ref(false)
const detail = ref<any>(null)

/** 详情字段兼容 */
function normalizeDetail(raw: any): any {
  const imgList = raw.images || raw.pictures || raw.gallery || raw.image_list || (raw.cover_url ? [raw.cover_url] : [])
  const images = (Array.isArray(imgList) ? imgList : [])
    .map((u: any) => (typeof u === 'string' ? u : u?.url || u?.image_url))
    .filter(Boolean)
    .map(getImageUrl)
  const cover = getImageUrl(raw.cover_url || raw.cover || raw.image || raw.thumb_url || raw.thumbnail || images[0])
  const tags = raw.tags || raw.tag_list || []
  return {
    title: raw.title || raw.name || '未命名素材',
    subtitle: raw.subtitle || raw.summary || '',
    cover,
    images: images.length ? images : (cover ? [cover] : []),
    tags: Array.isArray(tags) ? tags : String(tags).split(/[,，、]/).filter(Boolean),
    date: String(raw.updated_at || raw.updatedAt || raw.created_at || raw.publish_date || '').slice(0, 10),
    copyText: raw.copy_text || raw.copywriting || raw.content || raw.text || '',
    scene: raw.scene || raw.usage_scene || raw.applicable_scenes || raw.applicable_scene || '',
    videoUrl: getImageUrl(raw.video_url || raw.video || raw.file_url),
    duration: raw.video_duration || raw.duration || '',
    videoSize: raw.video_size || raw.file_size || raw.size || '',
    resolution: raw.resolution || '',
  }
}

async function fetchDetail(id: number) {
  loading.value = true
  try {
    const res = await getMaterialDetail(id)
    detail.value = normalizeDetail(res.data || {})
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    navigator.back()
  } else {
    navigator.switchTab('/m/material')
  }
}

function onPlay() {
  if (detail.value.videoUrl) {
    videoPlaying.value = true
  } else {
    showToast('视频暂未上传')
  }
}

function previewImage(index: number) {
  uni.previewImage({
    urls: detail.value.images,
    current: detail.value.images[index],
  })
}

function copyText() {
  const text = detail.value.copyText
  if (!text) return
  uni.setClipboardData({
    data: text,
    success: () => showToast('文案已复制'),
  })
}

/** 相册权限失败时引导开启 */
function guideAlbumAuth(err: any): Promise<boolean> {
  return new Promise((resolve) => {
    if (!String(err?.errMsg || '').includes('auth')) {
      resolve(false)
      return
    }
    uni.showModal({
      title: '提示',
      content: '需要相册权限才能保存，请在设置中开启',
      confirmText: '去设置',
      success: (m) => {
        if (m.confirm) {
          uni.openSetting({
            success: (s) => resolve(!!s.authSetting['scope.writePhotosAlbum']),
            fail: () => resolve(false),
          })
        } else {
          resolve(false)
        }
      },
      fail: () => resolve(false),
    })
  })
}

function download(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.downloadFile({ url, success: (res) => (res.statusCode === 200 ? resolve(res.tempFilePath) : reject(new Error('下载失败'))), fail: reject })
  })
}

async function saveAlbum() {
  const urls = detail.value.images
  if (!urls.length) return showToast('暂无可保存的图片')
  uni.showLoading({ title: '保存中...', mask: true })
  let success = 0
  for (const url of urls) {
    try {
      const filePath = await download(url)
      await new Promise<void>((resolve, reject) => {
        uni.saveImageToPhotosAlbum({ filePath, success: () => resolve(), fail: reject })
      })
      success++
    } catch (e: any) {
      uni.hideLoading()
      const granted = await guideAlbumAuth(e)
      if (granted) return saveAlbum()
      showToast(success ? `已保存${success}张` : '保存失败')
      return
    }
  }
  uni.hideLoading()
  showToast(`已保存${success}张图片`)
}

async function downloadVideo() {
  const url = detail.value.videoUrl
  if (!url) return showToast('视频暂未上传')
  uni.showLoading({ title: '下载中...', mask: true })
  try {
    const filePath = await download(url)
    await new Promise<void>((resolve, reject) => {
      uni.saveVideoToPhotosAlbum({ filePath, success: () => resolve(), fail: reject })
    })
    uni.hideLoading()
    showToast('视频已保存到相册')
  } catch (e: any) {
    uni.hideLoading()
    const granted = await guideAlbumAuth(e)
    if (granted) downloadVideo()
    else showToast('下载失败')
  }
}

onLoad((options: any) => {
  const id = Number(options?.id)
  if (id) fetchDetail(id)
})
</script>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
  padding: 0 20rpx calc(40rpx + env(safe-area-inset-bottom));
  background: linear-gradient(110deg, #fcfcfd, #fff 50%, #f8f9fb);
  box-sizing: border-box;
}

/* 导航 */
.nav {
  position: relative;
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back {
  position: absolute;
  left: 8rpx;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-chevron {
  width: 18rpx;
  height: 18rpx;
  border-left: 3rpx solid #101114;
  border-bottom: 3rpx solid #101114;
  transform: rotate(45deg);
  margin-left: 6rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #101114;
}

/* 通用 section */
.section {
  background: #fff;
  border-radius: 21rpx;
  box-shadow: 0 9rpx 22rpx rgba(36, 57, 81, 0.04);
  margin-bottom: 15rpx;
  padding: 18rpx 24rpx;
  box-sizing: border-box;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 14rpx;
}

.section-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #101114;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.section-title::before {
  content: '';
  width: 6rpx;
  height: 24rpx;
  background: #2c7cff;
  border-radius: 5rpx;
  margin-right: 12rpx;
}

.muted {
  font-size: 22rpx;
  font-weight: 400;
  color: #626b7a;
  margin-left: 6rpx;
}

/* Hero */
.hero {
  padding-top: 12rpx;
}

.cover {
  position: relative;
  width: 100%;
  height: 340rpx;
  border-radius: 15rpx;
  overflow: hidden;
  background: #d2e1ed;
}

.cover image,
.cover-video {
  width: 100%;
  height: 100%;
}

.play {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.triangle {
  width: 0;
  height: 0;
  border-top: 16rpx solid transparent;
  border-bottom: 16rpx solid transparent;
  border-left: 26rpx solid #fff;
  margin-left: 7rpx;
}

.duration {
  position: absolute;
  left: 14rpx;
  bottom: 12rpx;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 20rpx;
  padding: 4rpx 14rpx;
  font-size: 18rpx;
}

.hero-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: #101114;
  margin: 18rpx 0 6rpx;
}

.hero-subtitle {
  display: block;
  color: #8c919d;
  font-size: 22rpx;
  line-height: 1.5;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  margin-top: 12rpx;
}

.tags-scroll {
  flex: 1;
  min-width: 0;
}

.tags {
  display: flex;
  gap: 9rpx;
  white-space: nowrap;
}

.tag {
  font-size: 17rpx;
  color: #4e75b4;
  background: #eaf2ff;
  border-radius: 20rpx;
  padding: 6rpx 14rpx;
  flex-shrink: 0;
}

.meta-date {
  font-size: 18rpx;
  color: #8d94a2;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 图片合集 */
.link {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}

.link text {
  font-size: 19rpx;
  color: #287aff;
}

.link-chevron {
  width: 10rpx;
  height: 10rpx;
  border-top: 2rpx solid #287aff;
  border-right: 2rpx solid #287aff;
  transform: rotate(45deg);
}

.gallery {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8rpx;
}

.gallery-item {
  height: 200rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #e8edf3;
}

.gallery-item image {
  width: 100%;
  height: 100%;
}

/* 文案内容 */
.usage {
  font-size: 16rpx;
  color: #9299a8;
  text-align: right;
}

.copy-box {
  position: relative;
  background: #f4f5f8;
  border-radius: 15rpx;
  padding: 16rpx 18rpx;
  min-height: 130rpx;
  box-sizing: border-box;
}

.copy-text {
  font-size: 19rpx;
  line-height: 1.6;
  color: #535b69;
  white-space: pre-line;
}

.copy-btn {
  display: inline-block;
  margin-top: 14rpx;
  color: #247aff;
  background: #f9fbff;
  border: 1rpx solid #fff;
  box-shadow: 0 8rpx 20rpx rgba(43, 122, 255, 0.08);
  padding: 10rpx 22rpx;
  border-radius: 30rpx;
}

.copy-btn text {
  font-size: 20rpx;
  font-weight: 600;
}

/* 视频下载 */
.download-row {
  display: flex;
  align-items: center;
  gap: 17rpx;
}

.mini-cover {
  width: 165rpx;
  height: 90rpx;
  border-radius: 11rpx;
  flex-shrink: 0;
  background: #e8edf3;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.file-name {
  font-size: 19rpx;
  font-weight: 600;
  color: #101114;
}

.file-meta {
  font-size: 16rpx;
  color: #969ead;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #287aff;
  border-radius: 35rpx;
  padding: 16rpx 24rpx;
  flex-shrink: 0;
  box-shadow: 0 8rpx 20rpx rgba(40, 122, 255, 0.12);
}

.download-btn text {
  color: #fff;
  font-size: 20rpx;
}

/* 下载图标：向下箭头 + 底部托盘 */
.download-ico {
  width: 22rpx;
  height: 20rpx;
  position: relative;
  border-bottom: 3rpx solid #fff;
}

.download-ico::before {
  content: '';
  position: absolute;
  left: 50%;
  top: -2rpx;
  width: 3rpx;
  height: 15rpx;
  background: #fff;
  transform: translateX(-50%);
}

.download-ico::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 3rpx;
  width: 10rpx;
  height: 10rpx;
  border-right: 3rpx solid #fff;
  border-bottom: 3rpx solid #fff;
  transform: translateX(-50%) rotate(45deg);
}

/* 素材说明 */
.desc-section .section-title {
  margin-bottom: 14rpx;
}

.desc-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.desc-row {
  display: flex;
  align-items: flex-start;
  font-size: 18rpx;
  line-height: 1.6;
}

.dt {
  width: 130rpx;
  flex-shrink: 0;
  color: #59616d;
}

.dd {
  flex: 1;
  color: #939baa;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 120rpx 0;
  color: #8b94a2;
  font-size: 24rpx;
}
</style>
