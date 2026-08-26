<template>
  <view class="poster-page">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="icon-button back-button" @click="goBack">
        <view class="back-arrow"></view>
      </view>
      <text class="nav-title">分享海报</text>
    </view>

    <!-- 标题 -->
    <view class="poster-heading">
      <text>SHARE POSTER</text>
      <view>为此刻挑一张海报</view>
      <text class="subtitle">左右滑动，选择你喜欢的风格</text>
    </view>

    <!-- 海报轮播（coverflow 风格） -->
    <swiper v-if="posters.length > 0" class="coverflow" :current="currentIdx" circular previous-margin="112rpx"
      next-margin="112rpx" @change="onSwiperChange">
      <swiper-item v-for="(poster, index) in posters" :key="poster.id || index">
        <view :class="['poster-card', { active: currentIdx === index }]">
          <template v-if="poster.image_url">
            <image :src="poster.image_url" mode="aspectFill" />
            <view class="shade"></view>
            <view class="qr-overlay" :style="qrStyle(poster)">
              <image v-if="qrImages[index]" :src="qrImages[index]" class="qr-img" mode="aspectFit" />
            </view>
            <view class="poster-copy">
              <text>0{{ index + 1 }}</text>
              <view>{{ poster.share_title || '邀请你一起体验' }}</view>
              <text>扫码一起体验</text>
            </view>
          </template>
          <view v-else class="poster-empty">
            <text class="empty-icon-big">📭</text>
            <text class="empty-small">该海报暂无背景图</text>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 无海报空状态 -->
    <view v-else class="empty-stage">
      <view class="poster-card empty-card">
        <view class="poster-empty">
          <text class="empty-icon-big">📭</text>
          <text class="empty-small">暂无分享海报</text>
          <text class="empty-small">企业端可创建分享海报</text>
        </view>
      </view>
    </view>

    <!-- 圆点指示器 -->
    <view class="dots" v-if="posters.length > 1">
      <text v-for="(_, index) in posters" :key="index" :class="{ active: currentIdx === index }"></text>
    </view>

    <!-- 当前海报名称 -->
    <view class="current-name" v-if="posters.length > 0">
      {{ currentPoster.share_title || '邀请你一起体验' }}
      <text v-if="currentPoster.share_desc"> · {{ currentPoster.share_desc }}</text>
    </view>

    <!-- 分享操作面板 -->
    <view class="poster-actions surface" v-if="posters.length > 0">
      <button class="save" @click="handleSaveAlbum">
        <text class="action-emoji">💾</text>保存相册
      </button>
      <!-- #ifdef MP-WEIXIN -->
      <button class="friend" open-type="share" hover-class="none">
        <text class="action-emoji">💬</text>分享好友
      </button>
      <!-- #endif -->
      <!-- #ifndef MP-WEIXIN -->
      <button class="friend" @click="handleShareFriend">
        <text class="action-emoji">💬</text>分享好友
      </button>
      <!-- #endif -->
      <button class="moments" @click="handleShareMoments">
        <text class="action-emoji">🌐</text>朋友圈
      </button>
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

    <!-- 用于合成海报（隐藏） -->
    <!-- 用于合成海报的隐藏 Canvas（微信小程序兼容） -->
    <canvas canvas-id="posterCanvas" class="hidden-canvas"
      style="position:fixed; left:0; top:0; width:750px; height:1334px; opacity:0; pointer-events:none;"></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import QRCode from 'qrcode-generator'
import { getMiniappConfig } from '@/api/miniapp'
import { useShare } from '@/composables/useShare'
import { navigator } from '@/utils'

// ==================== 注册页面分享 ====================
useShare(() => ({
  title: cardTitle.value || '邀请你一起体验',
  path: '/pages/home/index',
  imageUrl: cardCoverImage.value,
}))

// ==================== 状态 ====================
const posters = ref<any[]>([])
const currentIdx = ref(0)
const qrImages = ref<string[]>([]) // 仅用于预览展示，保存时用canvas重新绘制
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

// ==================== 计算属性 ====================
const currentPoster = computed(() => posters.value[currentIdx.value] || {})
const cardCoverImage = computed(() => currentPoster.value.share_image || currentPoster.value.image_url || '')
const cardTitle = computed(() => currentPoster.value.share_title || '邀请你一起体验')

// ==================== 生成预览二维码（SVG） ====================
function generateQRCodeSVG(qr: any, moduleCount: number, width: number): string {
  const margin = 10
  const cellSize = (width - 2 * margin) / moduleCount
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}">`
  svg += `<rect width="${width}" height="${width}" fill="#ffffff"/>`
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        const x = margin + col * cellSize
        const y = margin + row * cellSize
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="#000000"/>`
      }
    }
  }
  svg += '</svg>'
  return svg
}

async function generateQrCode(idx: number) {
  const poster = posters.value[idx]
  if (!poster || !poster.qr_link) return
  try {
    const qr = QRCode(0, 'L')
    qr.addData(poster.qr_link)
    qr.make()
    const moduleCount = qr.getModuleCount()
    const width = 200
    const svg = generateQRCodeSVG(qr, moduleCount, width)
    qrImages.value[idx] = `data:image/svg+xml,${encodeURIComponent(svg)}`
  } catch {
    qrImages.value[idx] = ''
  }
}

watch(posters, async () => {
  await nextTick()
  qrImages.value = new Array(posters.value.length).fill('')
  for (let i = 0; i < posters.value.length; i++) {
    await generateQrCode(i)
  }
}, { flush: 'post' })

// ==================== Swiper 切换 ====================
function onSwiperChange(e: any) {
  currentIdx.value = e.detail.current
}

// ==================== 数据加载 ====================
onLoad(async () => {
  try {
    const res = (await getMiniappConfig()) as any
    posters.value = res.data?.posters || []
    miniappName.value = res.data?.theme?.miniapp_name || '小程序'
  } catch {
    posters.value = []
  }
})

// 二维码尺寸映射
const QR_SIZE_MAP: Record<string, string> = {
  small: '16%',
  medium: '22%',
  large: '28%',
}

// 预览时计算二维码的 CSS 样式（用于 swiper 中的 qr-overlay）
function qrStyle(poster: any) {
  return {
    left: `${poster.qr_x ?? 85}%`,
    top: `${poster.qr_y ?? 85}%`,
    width: QR_SIZE_MAP[poster.qr_size || 'medium'],
    height: QR_SIZE_MAP[poster.qr_size || 'medium'],
    transform: 'translate(-50%, -50%)',
  }
}

// ==================== 保存相册（核心合成逻辑） ====================
function drawQRCodeOnCanvas(ctx: any, link: string, x: number, y: number, size: number) {
  try {
    const qr = QRCode(0, 'L')
    qr.addData(link)
    qr.make()
    const moduleCount = qr.getModuleCount()
    const margin = 2
    const cellSize = (size - 2 * margin) / moduleCount

    // 白底
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(x, y, size, size)

    ctx.setFillStyle('#000000')
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          const px = x + margin + col * cellSize
          const py = y + margin + row * cellSize
          ctx.fillRect(px, py, cellSize, cellSize)
        }
      }
    }
  } catch (e) {
    console.warn('Canvas绘制二维码失败', e)
  }
}

function drawPosterText(ctx: any, poster: any, idx: number, canvasWidth: number, canvasHeight: number) {
  const bottom = canvasHeight - 38
  const left = 34

  // 序号（0x）
  ctx.setFillStyle('rgba(255,255,255,0.75)')
  ctx.setFontSize(22)
  ctx.setTextAlign('left')
  ctx.setTextBaseline('bottom')
  ctx.fillText(`0${idx + 1}`, left, bottom - 10)

  // 主标题
  const title = poster.share_title || '邀请你一起体验'
  ctx.setFillStyle('#ffffff')
  ctx.setFontSize(48)
  // 部分平台不支持 fontWeight，忽略或使用 ctx.font
  ctx.fillText(title, left, bottom - 50)

  // 副标题
  ctx.setFillStyle('rgba(255,255,255,0.88)')
  ctx.setFontSize(25)
  ctx.fillText('扫码一起体验', left, bottom - 90)
}

function composePosterImage(poster: any, idx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvasId = 'posterCanvas'
    const ctx = uni.createCanvasContext(canvasId)

    // 1. 下载背景图
    uni.downloadFile({
      url: poster.image_url,
      success: (downloadRes) => {
        const bgPath = downloadRes.tempFilePath

        // 2. 获取图片尺寸，按比例铺满画布（aspectFill）
        uni.getImageInfo({
          src: bgPath,
          success: (imgInfo) => {
            const canvasWidth = 750   // 可调整，建议与设计稿一致
            const canvasHeight = 1334
            const scaleX = canvasWidth / imgInfo.width
            const scaleY = canvasHeight / imgInfo.height
            const scale = Math.max(scaleX, scaleY)
            const drawWidth = imgInfo.width * scale
            const drawHeight = imgInfo.height * scale
            const offsetX = (canvasWidth - drawWidth) / 2
            const offsetY = (canvasHeight - drawHeight) / 2

            // 3. 绘制背景
            ctx.drawImage(bgPath, offsetX, offsetY, drawWidth, drawHeight)

            // 4. 绘制二维码（如果存在链接）
            if (poster.qr_link) {
              const qrSizeMap: Record<string, number> = {
                small: 0.16,
                medium: 0.22,
                large: 0.28,
              }
              const sizeRatio = qrSizeMap[poster.qr_size || 'medium'] || 0.22
              const qrSize = canvasWidth * sizeRatio
              // 默认放在右下角，qr_x/qr_y 为百分比（0-100）
              const qrX = ((poster.qr_x ?? 85) / 100) * canvasWidth - qrSize / 2
              const qrY = ((poster.qr_y ?? 85) / 100) * canvasHeight - qrSize / 2
              drawQRCodeOnCanvas(ctx, poster.qr_link, qrX, qrY, qrSize)
            }

            // 5. 绘制文案
            // drawPosterText(ctx, poster, idx, canvasWidth, canvasHeight)

            // 6. 执行绘制并导出
            ctx.draw(false, () => {
              // 延迟一小段时间确保绘制完成
              setTimeout(() => {
                uni.canvasToTempFilePath({
                  canvasId,
                  success: (res) => resolve(res.tempFilePath),
                  fail: (err) => reject(err),
                })
              }, 300)
            })
          },
          fail: (err) => reject(err),
        })
      },
      fail: (err) => reject(err),
    })
  })
}

async function handleSaveAlbum() {
  const poster = posters.value[currentIdx.value]
  if (!poster || !poster.image_url) {
    showToast('暂无海报图片')
    return
  }

  uni.showLoading({ title: '生成海报中...' })

  try {
    const tempFilePath = await composePosterImage(poster, currentIdx.value)
    uni.saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        uni.hideLoading()
        showToast('已保存到相册')
      },
      fail: (err) => {
        uni.hideLoading()
        if (err.errMsg.includes('auth deny')) {
          showToast('请授权相册权限')
        } else {
          showToast('保存失败，请重试')
        }
      },
    })
  } catch (error) {
    uni.hideLoading()
    console.error('合成海报失败', error)
    showToast('生成海报失败，请稍后重试')
  }
}

// ==================== 分享相关（原有） ====================
function handleShareFriend() {
  shareTarget.value = 'friend'
  cardPreviewVisible.value = true
}

function handleShareMoments() {
  shareTarget.value = 'moments'
  // #ifdef MP-WEIXIN
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
.poster-page {
  min-height: 100vh;
  padding: 32px 0 190rpx;
  color: #16263c;
  background: linear-gradient(180deg, #f7faff, #edf3fd);
}

/* ===== 导航栏 ===== */
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
  color: #16263c;
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

/* ===== 标题 ===== */
.poster-heading {
  padding: 18rpx 42rpx 0;
}

.poster-heading>text:first-child {
  color: #3878df;
  font-size: 20rpx;
  font-weight: 700;
  letter-spacing: 5rpx;
}

.poster-heading>view {
  margin-top: 16rpx;
  font-size: 46rpx;
  font-weight: 800;
}

.poster-heading .subtitle {
  display: block;
  margin-top: 12rpx;
  color: #7c899d;
  font-size: 27rpx;
  letter-spacing: 0;
}

/* ===== Coverflow 轮播 ===== */
.coverflow {
  height: 742rpx;
  margin-top: 28rpx;
}

.poster-card {
  height: 668rpx;
  margin: 28rpx 18rpx 46rpx;
  position: relative;
  overflow: hidden;
  border-radius: 34rpx;
  transform: scale(.84);
  opacity: .58;
  transition: transform .3s, opacity .3s;
  box-shadow: 0 18rpx 50rpx rgba(30, 59, 96, .12);
}

.poster-card.active {
  transform: scale(.94);
  opacity: 1;
  box-shadow: 0 28rpx 64rpx rgba(24, 54, 94, .24);
}

.poster-card>image {
  width: 100%;
  height: 100%;
}

.shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(6, 22, 40, .05) 45%, rgba(8, 24, 43, .76));
}

/* 海报文案 */
.poster-copy {
  position: absolute;
  left: 34rpx;
  right: 34rpx;
  bottom: 38rpx;
  color: white;
}

.poster-copy>text:first-child {
  font-size: 22rpx;
  letter-spacing: 5rpx;
  opacity: .75;
}

.poster-copy>view {
  margin-top: 10rpx;
  font-size: 48rpx;
  font-weight: 800;
  letter-spacing: 5rpx;
}

.poster-copy>text:last-child {
  display: block;
  margin-top: 12rpx;
  font-size: 25rpx;
  letter-spacing: 2rpx;
  opacity: .88;
}

/* 二维码叠加 */
.qr-overlay {
  position: absolute;
  z-index: 5;
  border-radius: 6px;
  background: #fff;
  padding: 3px;
  border: 1.5px solid #fff;
  box-shadow: 0 3px 12px rgba(0, 0, 0, .2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.qr-img {
  width: 100%;
  height: 100%;
}

/* 空状态 */
.empty-stage {
  display: flex;
  justify-content: center;
  padding-top: 40rpx;
}

.empty-card {
  width: 60%;
  margin: 0;
  transform: none;
  opacity: 1;
}

.poster-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fff;
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

/* ===== 圆点指示器 ===== */
.dots {
  height: 24rpx;
  margin-top: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.dots text {
  width: 10rpx;
  height: 10rpx;
  border-radius: 10rpx;
  background: #bdc9da;
}

.dots text.active {
  width: 34rpx;
  background: #2f76ec;
}

/* ===== 当前海报名称 ===== */
.current-name {
  height: 44rpx;
  margin-top: 18rpx;
  padding: 0 28rpx;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 30rpx;
  font-weight: 700;
}

.current-name text {
  color: #8591a4;
  font-size: 24rpx;
  font-weight: 400;
}

/* ===== 分享操作面板（底部固定） ===== */
.surface {
  background: white;
  border-radius: 28rpx;
  box-shadow: 0 10rpx 30rpx rgba(39, 54, 75, .06);
}

.poster-actions {
  position: fixed;
  z-index: 20;
  left: 24rpx;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 20rpx);
  padding: 13rpx;
  display: flex;
  gap: 12rpx;
}

.poster-actions button {
  flex: 1;
  height: 92rpx;
  padding: 0 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: 24rpx;
  color: white;
  font-size: 23rpx;
  font-weight: 650;
  margin: 0;
}

.poster-actions button::after {
  border: none;
}

.action-emoji {
  font-size: 28rpx;
}

.save {
  background: linear-gradient(135deg, #242f48, #101829);
}

.friend {
  background: linear-gradient(135deg, #5a9dff, #2e6bec);
}

.moments {
  background: linear-gradient(135deg, #32d29f, #10a87a);
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  z-index: 100;
  bottom: 140rpx;
  left: 50%;
  max-width: 580rpx;
  padding: 16rpx 28rpx;
  border-radius: 40rpx;
  background: rgba(25, 25, 25, .88);
  opacity: 0;
  transform: translate(-50%, 24rpx);
  transition: opacity .2s ease, transform .2s ease;
}

.toast.is-visible {
  opacity: 1;
  transform: translate(-50%, 0);
}

.toast-text {
  color: #fff;
  font-size: 26rpx;
}

/* ===== 分享卡片预览弹窗 ===== */
.card-preview-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, .6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx;
}

.card-preview-box {
  position: relative;
  width: 100%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx 40rpx;
}

.card-close {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-close text {
  color: #64748b;
  font-size: 28rpx;
}

.preview-header {
  text-align: center;
  margin-bottom: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-badge {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12rpx;
}

.preview-tip-text {
  font-size: 24rpx;
  color: #94a3b8;
  line-height: 1.5;
}

.wechat-card {
  background: #f7f7f7;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 32rpx;
}

.card-row {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.card-cover {
  width: 128rpx;
  height: 128rpx;
  border-radius: 12rpx;
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
  font-size: 48rpx;
  color: #94a3b8;
}

.card-text {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 8rpx;
}

.card-source {
  font-size: 24rpx;
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
  border-radius: 16rpx;
  overflow: hidden;
  background: #e2e8f0;
  margin-bottom: 16rpx;
}

.cover-img-wide {
  width: 100%;
  height: 320rpx;
}

.moments-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 8rpx;
}

.moments-source {
  font-size: 24rpx;
  color: #94a3b8;
}

.share-params-info {
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 32rpx;
}

.param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8rpx 0;
}

.param-label {
  font-size: 24rpx;
  color: #64748b;
  flex-shrink: 0;
}

.param-value {
  font-size: 24rpx;
  color: #1e293b;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 24rpx;
}

.card-confirm-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 20rpx;
  background: #2f76ec;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-confirm-btn text {
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
