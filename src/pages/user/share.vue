<template>
  <view class="share-page">
    <!-- 装饰元素 -->
    <view class="decor decor--top"></view>
    <view class="decor decor--left"></view>
    <view class="dot-cloud dot-cloud--left"></view>
    <view class="dot-cloud dot-cloud--right"></view>

    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="icon-button back-button" @click="goBack">
        <view class="back-arrow"></view>
      </view>
      <text class="nav-title">分享海报</text>
    </view>

    <!-- 海报展示区 -->
    <view class="poster-stage" v-if="posters.length > 0">
      <view class="poster-frame" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <view v-for="(poster, idx) in posters" :key="poster.id || idx" class="poster-card" :class="{
          'is-active': currentIdx === idx,
          'is-before': idx < currentIdx,
        }">
          <template v-if="poster.image_url">
            <image :src="poster.image_url" class="poster-bg-img" mode="aspectFill" />
            <view class="qr-overlay" :style="qrStyle(poster)">
              <image v-if="qrImages[idx]" :src="qrImages[idx]" class="qr-img" mode="aspectFit" />
            </view>
          </template>
          <view v-else class="poster-empty">
            <text class="empty-icon-big">📱</text>
            <text class="empty-small">该海报暂无背景图</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 无海报空状态 -->
    <view class="poster-stage" v-else>
      <view class="poster-frame">
        <view class="poster-empty">
          <text class="empty-icon-big">📭</text>
          <text class="empty-small">暂无分享海报</text>
          <text class="empty-small">企业端可创建分享海报</text>
        </view>
      </view>
    </view>

    <!-- 缩略图轮播区 -->
    <view class="carousel-area" v-if="posters.length > 0">
      <view class="carousel-arrow carousel-arrow--left" @click="prevPoster" v-if="posters.length > 1">
        <view class="arrow-left"></view>
      </view>

      <view class="thumbnail-list" v-if="posters.length > 1">
        <view v-for="(poster, idx) in posters" :key="idx" class="thumbnail" :class="{ 'is-active': currentIdx === idx }"
          @click="goToPoster(idx)">
          <image v-if="poster.image_url" :src="poster.image_url" class="thumb-img" mode="aspectFill" />
          <text v-else class="thumb-placeholder">📱</text>
          <view class="selected-mark" v-if="currentIdx === idx"></view>
        </view>
      </view>

      <view class="carousel-arrow carousel-arrow--right" @click="nextPoster" v-if="posters.length > 1">
        <view class="arrow-right"></view>
      </view>

      <view class="pagination" v-if="posters.length > 1">
        <view v-for="(poster, idx) in posters" :key="idx" class="page-dot" :class="{ 'is-active': currentIdx === idx }"
          @click="goToPoster(idx)"></view>
      </view>
      <view class="swipe-hint" v-if="posters.length > 1">
        <text class="swipe-arrow">‹</text>
        <text class="swipe-text">左右滑动切换海报</text>
        <text class="swipe-arrow">›</text>
      </view>
    </view>

    <!-- 分享操作面板 -->
    <view class="share-panel" v-if="posters.length > 0">
      <view class="share-action save-action" @click="handleSaveAlbum">
        <view class="share-icon download-icon"></view>
        <text class="action-label">保存相册</text>
      </view>
      <!-- 微信小程序：open-type="share" 触发真实转发 -->
      <!-- #ifdef MP-WEIXIN -->
      <button class="share-action share-btn-reset" open-type="share" hover-class="none">
        <view class="share-icon wechat-icon"></view>
        <text class="action-label">微信好友</text>
      </button>
      <!-- #endif -->
      <!-- H5：降级为预览卡片 -->
      <!-- #ifndef MP-WEIXIN -->
      <view class="share-action" @click="handleShareFriend">
        <view class="share-icon wechat-icon"></view>
        <text class="action-label">微信好友</text>
      </view>
      <!-- #endif -->
      <view class="share-action" @click="handleShareMoments">
        <view class="share-icon moments-icon"></view>
        <text class="action-label">朋友圈</text>
      </view>
    </view>

    <!-- Toast 提示 -->
    <view class="toast" :class="{ 'is-visible': toastVisible }">
      <text class="toast-text">{{ toastMessage }}</text>
    </view>

    <!-- 分享卡片预览弹窗 -->
    <view v-if="cardPreviewVisible" class="card-preview-mask" @click="cardPreviewVisible = false">
      <view class="card-preview-box" @click.stop="">
        <view class="card-close" @click="cardPreviewVisible = false"><text>✕</text></view>
        <view class="preview-header">
          <text class="preview-badge">{{ shareTarget === 'friend' ? '💬 分享给好友' : '🌐 分享到朋友圈' }}</text>
          <text class="preview-tip-text">{{ shareTarget === 'friend'
            ? '小程序中点击「微信好友」可直接转发；分享链接自动携带你的邀请码'
            : '点击右上角「···」→ 分享到朋友圈；分享链接自动携带你的邀请码'
          }}</text>
        </view>
        <view class="wechat-card" :class="{ 'is-moments': shareTarget === 'moments' }">
          <template v-if="shareTarget === 'friend'">
            <view class="card-row">
              <view class="card-cover">
                <image v-if="cardCoverImage" :src="cardCoverImage" class="cover-img" mode="aspectFill" />
                <text v-else class="card-cover-placeholder">📋</text>
              </view>
              <view class="card-text">
                <text class="card-title">{{ cardTitle }}</text>
                <text class="card-source">{{ miniappName }}</text>
              </view>
            </view>
          </template>
          <template v-else>
            <view class="moments-card">
              <view class="moments-cover">
                <image v-if="cardCoverImage" :src="cardCoverImage" class="cover-img-wide" mode="aspectFill" />
                <text v-else class="card-cover-placeholder">📋</text>
              </view>
              <text class="moments-title">{{ cardTitle }}</text>
              <text class="moments-source">{{ miniappName }}</text>
            </view>
          </template>
        </view>
        <view class="share-params-info">
          <view class="param-row">
            <text class="param-label">卡片封面</text>
            <text class="param-value">{{ cardCoverImage ? '已设置' : '未设置（将使用小程序截图）' }}</text>
          </view>
          <view class="param-row">
            <text class="param-label">钩子语</text>
            <text class="param-value">{{ cardTitle || '未设置' }}</text>
          </view>
        </view>
        <view class="card-confirm-btn" @click="cardPreviewVisible = false"><text>知道了</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import QRCode from 'qrcode-generator'
import { getMiniappConfig } from '@/api/miniapp'
import { useShare } from '@/composables/useShare'
import { navigator } from '@/utils'

// 注册页面分享：分享首页 + 自动携带邀请参数（海报分享的封面/标题用当前选中海报）
useShare(() => ({
  title: cardTitle.value || '邀请你一起体验',
  path: '/pages/home/index',
  imageUrl: cardCoverImage.value,
}))

const posters = ref<any[]>([])
const currentIdx = ref(0)
const qrImages = ref<string[]>([])
const cardPreviewVisible = ref(false)
const shareTarget = ref<'friend' | 'moments'>('friend')
const miniappName = ref('小程序')

// Toast
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

function showToast(msg: string) {
  toastMessage.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2200)
}

const currentPoster = computed(() => posters.value[currentIdx.value] || {})

const cardCoverImage = computed(() => {
  return currentPoster.value.share_image || currentPoster.value.image_url || ''
})

const cardTitle = computed(() => {
  return currentPoster.value.share_title || '邀请你一起体验'
})

const QR_SIZE_MAP: Record<string, string> = {
  small: '16%',
  medium: '22%',
  large: '28%',
}

function qrStyle(poster: any) {
  return {
    left: `${poster.qr_x ?? 85}%`,
    top: `${poster.qr_y ?? 85}%`,
    width: QR_SIZE_MAP[poster.qr_size || 'medium'],
    height: QR_SIZE_MAP[poster.qr_size || 'medium'],
    transform: 'translate(-50%, -50%)',
  } as any
}

// 生成二维码 — 使用 qr-code-generator 库
async function generateQrCode(idx: number) {
  const poster = posters.value[idx]
  if (!poster || !poster.qr_link) return

  try {
    // 使用 qr-code-generator 生成二维码
    const qr = QRCode(0, 'L')  // Version 0(自动), 纠错级别 L
    qr.addData(poster.qr_link)
    qr.make()

    // 获取二维码模块数组
    const modules = qr.getModules()
    const moduleCount = modules.length

    // 使用 canvas 绘制二维码
    const width = 200
    const margin = 4
    const cellSize = (width - 2 * margin) / moduleCount

    // 创建 canvas 上下文（使用临时 canvas ID）
    const canvasId = `qrcode-canvas-${idx}-${Date.now()}`
    const ctx = uni.createCanvasContext(canvasId)

    // 绘制白色背景
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, width, width)

    // 绘制二维码模块
    ctx.setFillStyle('#000000')
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (modules[row * moduleCount + col]) {
          const x = margin + col * cellSize
          const y = margin + row * cellSize
          ctx.fillRect(x, y, cellSize, cellSize)
        }
      }
    }

    // 由于 canvas 在小程序中无法直接获取 base64，这里使用简化的 SVG 方案
    // 或者返回一个标识，实际显示时使用 canvas 组件

    // 简化方案：直接使用在线二维码生成服务或后端接口
    // 这里先设置一个占位符，实际应该使用 canvas 组件或后端接口
    qrImages.value[idx] = `data:image/svg+xml,${encodeURIComponent(generateQRCodeSVG(modules, moduleCount, width))}`
  } catch {
    // ignore
  }
}

// 生成 SVG 格式的二维码
function generateQRCodeSVG(modules: boolean[], moduleCount: number, width: number): string {
  const margin = 10
  const cellSize = (width - 2 * margin) / moduleCount

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}">`
  svg += `<rect width="${width}" height="${width}" fill="#ffffff"/>`

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (modules[row * moduleCount + col]) {
        const x = margin + col * cellSize
        const y = margin + row * cellSize
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`
      }
    }
  }

  svg += '</svg>'
  return svg
}

watch(posters, async () => {
  await nextTick()
  qrImages.value = new Array(posters.value.length).fill('')
  for (let i = 0; i < posters.value.length; i++) {
    await generateQrCode(i)
  }
}, { flush: 'post' })

// 切换海报
function prevPoster() {
  if (currentIdx.value > 0) currentIdx.value--
}

function nextPoster() {
  if (currentIdx.value < posters.value.length - 1) currentIdx.value++
}

function goToPoster(idx: number) {
  currentIdx.value = idx
}

// 触摸滑动
let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: any) {
  const touch = e.changedTouches?.[0] || e.touches?.[0]
  if (touch) {
    touchStartX = touch.clientX
    touchStartY = touch.clientY
  }
}

function onTouchEnd(e: any) {
  const touch = e.changedTouches?.[0] || e.touches?.[0]
  if (!touch) return
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  if (Math.abs(deltaX) > 36 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) nextPoster()
    else prevPoster()
  }
}

// 数据加载
onLoad(async () => {
  try {
    const res = await getMiniappConfig() as any
    posters.value = res.data?.posters || []
    miniappName.value = res.data?.theme?.miniapp_name || '小程序'
  } catch {
    posters.value = []
  }
})

// 操作按钮
function handleSaveAlbum() {
  // #ifdef H5
  showToast('长按海报图片可保存到相册')
  // #endif
  // #ifdef MP-WEIXIN
  const poster = posters.value[currentIdx.value]
  if (poster?.image_url) {
    uni.downloadFile({
      url: poster.image_url,
      success: (res) => {
        if (res.tempFilePath) {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => showToast('已保存到相册'),
            fail: () => showToast('保存失败，请授权相册权限'),
          })
        }
      },
      fail: () => showToast('下载图片失败'),
    })
  } else {
    showToast('暂无海报图片')
  }
  // #endif
}

function handleShareFriend() {
  shareTarget.value = 'friend'
  cardPreviewVisible.value = true
}

function handleShareMoments() {
  shareTarget.value = 'moments'
  // #ifdef MP-WEIXIN
  // 微信小程序不支持按钮触发朋友圈分享，引导用户用右上角菜单
  showToast('请点击右上角「···」→ 分享到朋友圈')
  // #endif
  // #ifndef MP-WEIXIN
  cardPreviewVisible.value = true
  // #endif
}

function goBack() {
  navigator.back()
}
</script>

<style scoped lang="scss">
.share-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 16%, rgba(255, 231, 166, 0.26), transparent 16%),
    linear-gradient(180deg, #fff 0%, #fffdfa 76%, #fff 100%);
}

/* 装饰元素 */
.decor {
  position: absolute;
  z-index: 1;
  background: radial-gradient(circle at 30% 30%, rgba(255, 226, 143, 0.55), rgba(255, 245, 214, 0.12));
}

.decor--top {
  top: 68px;
  right: -23px;
  width: 83px;
  height: 65px;
  border-radius: 0 0 0 100%;
}

.decor--left {
  top: 284px;
  left: -39px;
  width: 82px;
  height: 69px;
  border-radius: 0 100% 100% 0;
  opacity: 0.65;
}

.dot-cloud {
  position: absolute;
  z-index: 1;
  width: 26px;
  height: 26px;
  opacity: 0.8;
  background-image: radial-gradient(#ffcc45 1px, transparent 1px);
  background-size: 4px 4px;
  border-radius: 50%;
}

.dot-cloud--left {
  top: 151px;
  left: 32px;
}

.dot-cloud--right {
  top: 273px;
  right: 28px;
}

/* 导航栏 */
.nav-bar {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
}

.nav-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #181818;
}

.icon-button {
  position: absolute;
  left: 17px;
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
}

.back-arrow {
  width: 11px;
  height: 11px;
  border-bottom: 2.5px solid #111;
  border-left: 2.5px solid #111;
  border-radius: 1px;
  transform: rotate(45deg);
}

/* 海报展示区 */
.poster-stage {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  height: 460px;
  padding-top: 10px;
}

.poster-frame {
  position: relative;
  width: 226px;
  height: 402px;
  overflow: hidden;
  border: 5px solid rgba(255, 255, 255, 0.98);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(124, 85, 9, 0.16), 0 0 12px rgba(79, 51, 0, 0.07);
}

.poster-card {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  transform: translateX(14%);
  transition: opacity 0.36s ease, transform 0.42s cubic-bezier(0.22, 1, 0.36, 1);
}

.poster-card.is-active {
  z-index: 1;
  opacity: 1;
  transform: translateX(0);
}

.poster-card.is-before {
  transform: translateX(-14%);
}

.poster-bg-img {
  width: 100%;
  height: 100%;
}

.poster-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon-big {
  font-size: 40px;
  opacity: 0.4;
}

.empty-small {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

/* 二维码叠加 */
.qr-overlay {
  position: absolute;
  z-index: 5;
  border-radius: 6px;
  background: #fff;
  padding: 3px;
  border: 1.5px solid #fff;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-img {
  width: 100%;
  height: 100%;
}

/* 缩略图轮播区 */
.carousel-area {
  position: relative;
  z-index: 3;
  padding-top: 16px;
  min-height: 140px;
}

.thumbnail-list {
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnail {
  position: relative;
  width: 62px;
  height: 99px;
  margin: 0 8px;
  overflow: visible;
  border: 2px solid #e1e4e9;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(30, 35, 45, 0.08);
  transition: border-color 0.2s ease;
}

.thumbnail.is-active {
  border-color: #f6b900;
}

.thumb-img {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #94a3b8;
}

.selected-mark {
  position: absolute;
  top: -7px;
  right: -8px;
  width: 18px;
  height: 18px;
  border: 1.5px solid #fff;
  border-radius: 50%;
  background: #ffc400;
  box-shadow: 0 1px 3px rgba(143, 105, 0, 0.22);
}

.carousel-arrow {
  position: absolute;
  top: 40px;
  display: flex;
  width: 26px;
  height: 28px;
  align-items: center;
  justify-content: center;
}

.carousel-arrow--left {
  left: 16px;
}

.carousel-arrow--right {
  right: 16px;
}

.arrow-left {
  width: 9px;
  height: 9px;
  border-bottom: 1.5px solid #686d75;
  border-left: 1.5px solid #686d75;
  transform: rotate(45deg);
}

.arrow-right {
  width: 9px;
  height: 9px;
  border-bottom: 1.5px solid #686d75;
  border-left: 1.5px solid #686d75;
  transform: rotate(225deg);
}

.pagination {
  display: flex;
  justify-content: center;
  padding-top: 2px;
}

.page-dot {
  width: 6px;
  height: 6px;
  margin: 0 4px;
  border-radius: 50%;
  background: #c8c8c8;
  transition: background 0.2s ease, transform 0.2s ease;
}

.page-dot.is-active {
  background: #ffc000;
  transform: scale(1.08);
}

.swipe-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.swipe-arrow {
  padding: 0 4px;
  color: #a1a1a4;
  font-size: 14px;
}

.swipe-text {
  color: #85858a;
  font-size: 11px;
  letter-spacing: 0.5px;
}

/* 分享操作面板 */
.share-panel {
  position: relative;
  z-index: 4;
  display: flex;
  width: calc(100% - 50px);
  max-width: 325px;
  height: 88px;
  margin: 16px auto 0;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 5px 20px rgba(101, 75, 24, 0.13);
}

.share-action {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
}

/* <button open-type="share"> 重置默认样式，与 .share-action 视觉一致 */
.share-btn-reset {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  line-height: normal;
}

.share-btn-reset::after {
  border: none;
}

.share-action+.share-action::before,
.share-action+.share-btn-reset::before,
.share-btn-reset+.share-action::before,
.share-btn-reset+.share-btn-reset::before {
  position: absolute;
  top: 16px;
  left: 0;
  width: 1px;
  height: 44px;
  content: "";
  background: #dedede;
}

.action-label {
  margin-top: 6px;
  font-size: 12px;
  color: #181818;
}

/* CSS 图标 */
.share-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
}

/* 下载图标 */
.download-icon {
  background: linear-gradient(145deg, #ffc900, #ffad00);
  position: relative;
}

.download-icon::before {
  position: absolute;
  top: 11px;
  left: 17px;
  width: 4px;
  height: 13px;
  content: "";
  border-radius: 1px;
  background: #fff;
}

.download-icon::after {
  position: absolute;
  top: 18px;
  left: 13px;
  width: 9px;
  height: 9px;
  content: "";
  border-bottom: 4px solid #fff;
  border-right: 4px solid #fff;
  transform: rotate(45deg);
}

/* 微信图标 */
.wechat-icon {
  background: linear-gradient(145deg, #3ed54a, #21b936);
  position: relative;
}

/* 朋友圈图标 */
.moments-icon {
  border: 1px solid #e4e4e4;
  background: #fff;
  position: relative;
  overflow: hidden;
}

.moments-icon::before {
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 6px;
  content: "";
  border-radius: 50%;
  background: conic-gradient(#8358dc 0 12.5%, #e94f72 12.5% 25%, #f28b24 25% 37.5%,
      #f4cb2f 37.5% 50%, #63bf48 50% 62.5%, #25b2b9 62.5% 75%,
      #3e80dc 75% 87.5%, #6a59c8 87.5% 100%);
}

.moments-icon::after {
  position: absolute;
  top: 13px;
  left: 13px;
  right: 13px;
  bottom: 13px;
  content: "";
  border-radius: 50%;
  background: #fff;
}

/* Toast */
.toast {
  position: fixed;
  z-index: 20;
  bottom: 30px;
  left: 50%;
  max-width: 290px;
  padding: 8px 14px;
  border-radius: 20px;
  background: rgba(25, 25, 25, 0.88);
  opacity: 0;
  transform: translate(-50%, 12px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast.is-visible {
  opacity: 1;
  transform: translate(-50%, 0);
}

.toast-text {
  color: #fff;
  font-size: 13px;
}

/* 分享卡片预览弹窗 */
.card-preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card-preview-box {
  position: relative;
  width: 100%;
  max-width: 320px;
  background: #fff;
  border-radius: 16px;
  padding: 24px 20px 20px;
}

.card-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-close text {
  color: #64748b;
  font-size: 14px;
}

.preview-header {
  text-align: center;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-badge {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
}

.preview-tip-text {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.wechat-card {
  background: #f7f7f7;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.card-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.card-cover {
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  background: #e2e8f0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.card-cover-placeholder {
  font-size: 24px;
  color: #94a3b8;
}

.card-text {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.card-source {
  font-size: 12px;
  color: #94a3b8;
}

.moments-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.moments-cover {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #e2e8f0;
  margin-bottom: 8px;
}

.cover-img-wide {
  width: 100%;
  height: 160px;
}

.moments-title {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.moments-source {
  font-size: 12px;
  color: #94a3b8;
}

.share-params-info {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 16px;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.param-label {
  font-size: 12px;
  color: #64748b;
  flex-shrink: 0;
}

.param-value {
  font-size: 12px;
  color: #1e293b;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 12px;
}

.card-confirm-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-confirm-btn text {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
</style>
