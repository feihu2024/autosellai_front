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
    <swiper
      v-if="posters.length > 0"
      class="coverflow"
      :current="currentIdx"
      circular
      previous-margin="112rpx"
      next-margin="112rpx"
      @change="onSwiperChange"
    >
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

// swiper 切换
function onSwiperChange(e: any) {
  currentIdx.value = e.detail.current
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
.poster-page { min-height: 100vh; padding: 0 0 190rpx; color: #16263c; background: linear-gradient(180deg, #f7faff, #edf3fd); }

/* ===== 导航栏 ===== */
.nav-bar { position: relative; z-index: 4; display: flex; align-items: center; justify-content: center; height: 50px; }
.nav-title { font-size: 17px; font-weight: 700; letter-spacing: 0.5px; color: #16263c; }
.icon-button { position: absolute; left: 17px; display: flex; width: 28px; height: 28px; align-items: center; justify-content: center; }
.back-arrow { width: 11px; height: 11px; border-bottom: 2.5px solid #111; border-left: 2.5px solid #111; border-radius: 1px; transform: rotate(45deg); }

/* ===== 标题 ===== */
.poster-heading { padding: 18rpx 42rpx 0; }
.poster-heading > text:first-child { color: #3878df; font-size: 20rpx; font-weight: 700; letter-spacing: 5rpx; }
.poster-heading > view { margin-top: 16rpx; font-size: 46rpx; font-weight: 800; }
.poster-heading .subtitle { display: block; margin-top: 12rpx; color: #7c899d; font-size: 27rpx; letter-spacing: 0; }

/* ===== Coverflow 轮播 ===== */
.coverflow { height: 742rpx; margin-top: 28rpx; }
.poster-card { height: 668rpx; margin: 28rpx 18rpx 46rpx; position: relative; overflow: hidden; border-radius: 34rpx; transform: scale(.84); opacity: .58; transition: transform .3s, opacity .3s; box-shadow: 0 18rpx 50rpx rgba(30,59,96,.12); }
.poster-card.active { transform: scale(.94); opacity: 1; box-shadow: 0 28rpx 64rpx rgba(24,54,94,.24); }
.poster-card > image { width: 100%; height: 100%; }
.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(6,22,40,.05) 45%, rgba(8,24,43,.76)); }

/* 海报文案 */
.poster-copy { position: absolute; left: 34rpx; right: 34rpx; bottom: 38rpx; color: white; }
.poster-copy > text:first-child { font-size: 22rpx; letter-spacing: 5rpx; opacity: .75; }
.poster-copy > view { margin-top: 10rpx; font-size: 48rpx; font-weight: 800; letter-spacing: 5rpx; }
.poster-copy > text:last-child { display: block; margin-top: 12rpx; font-size: 25rpx; letter-spacing: 2rpx; opacity: .88; }

/* 二维码叠加 */
.qr-overlay { position: absolute; z-index: 5; border-radius: 6px; background: #fff; padding: 3px; border: 1.5px solid #fff; box-shadow: 0 3px 12px rgba(0,0,0,.2); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.qr-img { width: 100%; height: 100%; }

/* 空状态 */
.empty-stage { display: flex; justify-content: center; padding-top: 40rpx; }
.empty-card { width: 60%; margin: 0; transform: none; opacity: 1; }
.poster-empty { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fff; }
.empty-icon-big { font-size: 40px; opacity: 0.4; }
.empty-small { font-size: 12px; color: #94a3b8; margin-top: 4px; }

/* ===== 圆点指示器 ===== */
.dots { height: 24rpx; margin-top: 18rpx; display: flex; align-items: center; justify-content: center; gap: 12rpx; }
.dots text { width: 10rpx; height: 10rpx; border-radius: 10rpx; background: #bdc9da; }
.dots text.active { width: 34rpx; background: #2f76ec; }

/* ===== 当前海报名称 ===== */
.current-name { height: 44rpx; margin-top: 18rpx; padding: 0 28rpx; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 30rpx; font-weight: 700; }
.current-name text { color: #8591a4; font-size: 24rpx; font-weight: 400; }

/* ===== 分享操作面板（底部固定） ===== */
.surface { background: white; border-radius: 28rpx; box-shadow: 0 10rpx 30rpx rgba(39,54,75,.06); }
.poster-actions { position: fixed; z-index: 20; left: 24rpx; right: 24rpx; bottom: calc(env(safe-area-inset-bottom) + 20rpx); padding: 13rpx; display: flex; gap: 12rpx; }
.poster-actions button { flex: 1; height: 92rpx; padding: 0 8rpx; display: flex; align-items: center; justify-content: center; gap: 8rpx; border-radius: 24rpx; color: white; font-size: 23rpx; font-weight: 650; margin: 0; }
.poster-actions button::after { border: none; }
.action-emoji { font-size: 28rpx; }
.save { background: linear-gradient(135deg, #242f48, #101829); }
.friend { background: linear-gradient(135deg, #5a9dff, #2e6bec); }
.moments { background: linear-gradient(135deg, #32d29f, #10a87a); }

/* ===== Toast ===== */
.toast { position: fixed; z-index: 100; bottom: 140rpx; left: 50%; max-width: 580rpx; padding: 16rpx 28rpx; border-radius: 40rpx; background: rgba(25,25,25,.88); opacity: 0; transform: translate(-50%, 24rpx); transition: opacity .2s ease, transform .2s ease; }
.toast.is-visible { opacity: 1; transform: translate(-50%, 0); }
.toast-text { color: #fff; font-size: 26rpx; }

/* ===== 分享卡片预览弹窗 ===== */
.card-preview-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,.6); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 48rpx; }
.card-preview-box { position: relative; width: 100%; max-width: 640rpx; background: #fff; border-radius: 32rpx; padding: 48rpx 40rpx 40rpx; }
.card-close { position: absolute; top: 24rpx; right: 24rpx; width: 56rpx; height: 56rpx; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
.card-close text { color: #64748b; font-size: 28rpx; }
.preview-header { text-align: center; margin-bottom: 40rpx; display: flex; flex-direction: column; align-items: center; }
.preview-badge { font-size: 30rpx; font-weight: 700; color: #1e293b; margin-bottom: 12rpx; }
.preview-tip-text { font-size: 24rpx; color: #94a3b8; line-height: 1.5; }
.wechat-card { background: #f7f7f7; border-radius: 16rpx; padding: 24rpx; margin-bottom: 32rpx; }
.card-row { display: flex; gap: 20rpx; align-items: center; }
.card-cover { width: 128rpx; height: 128rpx; border-radius: 12rpx; overflow: hidden; background: #e2e8f0; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.cover-img { width: 100%; height: 100%; }
.card-cover-placeholder { font-size: 48rpx; color: #94a3b8; }
.card-text { flex: 1; min-width: 0; }
.card-title { font-size: 28rpx; font-weight: 500; color: #1e293b; margin-bottom: 8rpx; }
.card-source { font-size: 24rpx; color: #94a3b8; }
.moments-card { text-align: center; display: flex; flex-direction: column; align-items: center; }
.moments-cover { width: 100%; border-radius: 16rpx; overflow: hidden; background: #e2e8f0; margin-bottom: 16rpx; }
.cover-img-wide { width: 100%; height: 320rpx; }
.moments-title { font-size: 28rpx; font-weight: 500; color: #1e293b; margin-bottom: 8rpx; }
.moments-source { font-size: 24rpx; color: #94a3b8; }
.share-params-info { background: #f8fafc; border-radius: 16rpx; padding: 20rpx 24rpx; margin-bottom: 32rpx; }
.param-row { display: flex; justify-content: space-between; align-items: center; padding: 8rpx 0; }
.param-label { font-size: 24rpx; color: #64748b; flex-shrink: 0; }
.param-value { font-size: 24rpx; color: #1e293b; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-left: 24rpx; }
.card-confirm-btn { width: 100%; height: 88rpx; border-radius: 20rpx; background: #2f76ec; display: flex; align-items: center; justify-content: center; }
.card-confirm-btn text { color: #fff; font-size: 30rpx; font-weight: 600; }
</style>
