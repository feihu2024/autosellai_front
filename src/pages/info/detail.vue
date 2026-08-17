<template>
  <view class="detail-page">
    <!-- 顶部主区域：视频 / 封面 -->
    <view class="media-area" v-if="detail.video_url || detail.cover_url">
      <!-- 有视频：先显示封面，点击后播放 -->
      <template v-if="detail.video_url">
        <view v-if="!videoPlaying" class="video-cover" @click="videoPlaying = true">
          <image v-if="detail.video_cover_url" :src="detail.video_cover_url" class="cover-img" mode="aspectFill" />
          <image v-else-if="detail.cover_url" :src="detail.cover_url" class="cover-img" mode="aspectFill" />
          <view class="play-overlay">
            <view class="play-icon"><text>▶</text></view>
          </view>
        </view>
        <video v-else class="video-player" :src="detail.video_url" controls autoplay></video>
      </template>

      <!-- 无视频但有封面：仅显示封面大图 -->
      <view v-else class="cover-image">
        <image :src="detail.cover_url" class="cover-img-full" mode="widthFix" />
      </view>
    </view>

    <!-- 标题 -->
    <text class="article-title">{{ detail.title }}</text>

    <!-- 元信息行（分类） -->
    <view class="meta-row" v-if="detail.category">
      <text class="meta-tag">{{ detail.category }}</text>
    </view>

    <!-- 内容模块区：默认只展示第一条，解锁后展示全部 -->
    <view class="modules" v-if="parsedModules.length">
      <!-- 免费内容：默认只展示第一条模块 -->
      <template v-for="(mod, idx) in parsedModules.slice(0, 1)" :key="'free-' + idx">
        <!-- 富文本模块 -->
        <rich-text v-if="mod.type === 'editor'" class="module-editor" :nodes="mod.content"></rich-text>

        <!-- 可复制文本模块 -->
        <view v-else-if="mod.type === 'copytext'" class="copy-text-module">
          <view class="copy-text-head">
            <text class="copy-label" v-if="mod.label">{{ mod.label }}</text>
            <view class="copy-btn" @click="copyText(mod.content)"><text>一键复制</text></view>
          </view>
          <text class="copy-text-content">{{ mod.content }}</text>
        </view>
      </template>

      <!-- 解锁栏：未解锁且有多于1条模块时展示 -->
      <button v-if="!unlocked && parsedModules.length > 1" class="unlock-bar" @tap="unlockArticle">
        <text class="unlock-badge">限时免费</text>
        <text class="unlock-icon">赠</text>
        <view><text>点击解锁完整内容</text><text>查看全部精彩资讯。</text></view>
        <text class="unlock-arrow">›</text>
      </button>

      <!-- 解锁后的内容 -->
      <view v-if="unlocked" class="unlocked-content">
        <template v-for="(mod, idx) in parsedModules.slice(1)" :key="'lock-' + idx">
          <!-- 富文本模块 -->
          <rich-text v-if="mod.type === 'editor'" class="module-editor" :nodes="mod.content"></rich-text>

          <!-- 可复制文本模块 -->
          <view v-else-if="mod.type === 'copytext'" class="copy-text-module">
            <view class="copy-text-head">
              <text class="copy-label" v-if="mod.label">{{ mod.label }}</text>
              <view class="copy-btn" @click="copyText(mod.content)"><text>一键复制</text></view>
            </view>
            <text class="copy-text-content">{{ mod.content }}</text>
          </view>
        </template>
      </view>

      <view class="end-mark" v-if="unlocked || parsedModules.length <= 1">— END —</view>
    </view>

    <!-- 无模块时的空提示 -->
    <text class="empty-modules" v-if="!parsedModules.length && detail.title">暂无更多内容</text>

    <!-- 权限不足提示页 -->
    <view class="permission-denied" v-if="permissionDenied">
      <view class="lock-circle">
        <text class="lock-icon">🔒</text>
      </view>
      <text class="pd-title">内容已锁定</text>
      <text class="pd-desc">{{ permissionMsg }}</text>
      <text class="pd-hint">请升级权益等级后查看完整内容</text>
      <view class="pd-btn" @click="goBack"><text>返回列表</text></view>
    </view>

    <!-- 底部分享栏 -->
    <view class="share-bar" v-if="!permissionDenied">
      <view class="share-btn" @click="sharePopupVisible = true">
        <text class="share-btn-icon">↗</text>
        <text>分享给好友</text>
      </view>
    </view>

    <!-- 分享弹窗 -->
    <view class="share-popup-mask" v-if="sharePopupVisible" @click="sharePopupVisible = false"></view>
    <view class="share-popup" v-if="sharePopupVisible" @click.stop>
      <text class="share-popup-title">分享至</text>
      <view class="share-options">
        <button class="share-option" open-type="share" @click="sharePopupVisible = false">
          <view class="share-option-icon wechat-icon"><text>微</text></view>
          <text class="share-option-text">微信好友</text>
        </button>
        <view class="share-option" @click="shareToTimeline">
          <view class="share-option-icon moments-icon"><text>圈</text></view>
          <text class="share-option-text">朋友圈</text>
        </view>
      </view>
      <view class="share-popup-cancel" @click="sharePopupVisible = false">取消</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getInfoDetail, getMiniappConfig } from '@/api/miniapp'
import { useShare } from '@/composables/useShare'
import { useAdManager } from '@/composables/useAdManager'
import { navigator, copyToClipboard, showToast } from '@/utils'

const { shouldShowAdByScene, initFromConfig } = useAdManager()

const infoId = ref(0)

// 激励视频广告实例（场景ID 10）
let rewardedVideoAd: any = null

// ===== 一天只看一次广告 =====
const AD_WATCH_DATE_KEY = 'infoAdWatchDate'

/** 检查今天是否已看过广告 */
function checkTodayAdWatched(): boolean {
  const today = new Date().toDateString()
  return uni.getStorageSync(AD_WATCH_DATE_KEY) === today
}

/** 记录今天已看过广告 */
function setTodayAdWatched() {
  const today = new Date().toDateString()
  uni.setStorageSync(AD_WATCH_DATE_KEY, today)
}

// 注册信息分享：分享当前信息详情 + 自动携带邀请参数
useShare(() => ({
  title: detail.value?.title || '快来看看这篇资讯',
  path: '/pages/info/detail',
  pathParams: { id: infoId.value },
  imageUrl: detail.value?.cover_url,
}))

const detail = ref<any>({
  title: '',
  cover_url: '',
  video_url: '',
  video_cover_url: '',
  content_modules: [],
  category: '',
  view_count: 0,
})

const videoPlaying = ref(false)
const permissionDenied = ref(false)
const permissionMsg = ref('')
const unlocked = ref(false)
const sharePopupVisible = ref(false)

const parsedModules = computed(() => {
  const mods = detail.value.content_modules
  if (!Array.isArray(mods)) return []
  return mods
})

function goBack() {
  navigator.back()
}

function unlockArticle() {
  // 当天已看过广告，直接解锁
  if (checkTodayAdWatched()) {
    unlocked.value = true
    showToast('内容已解锁', 'success')
    return
  }

  // 没有广告实例，直接解锁
  if (!rewardedVideoAd) {
    unlocked.value = true
    showToast('内容已解锁', 'success')
    return
  }

  // 未看过，弹窗提示用户观看广告
  uni.showModal({
    title: '温馨提示',
    content: '亲，当天查看资讯仅看一次广告，感谢您的支持，谢谢！',
    confirmText: '观看广告',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 用户点击确认，播放广告
        showRewardedAdAndUnlock()
      }
    }
  })
}

// 显示激励视频广告，看完后解锁全部内容
function showRewardedAdAndUnlock() {
  // 显示激励视频广告
  rewardedVideoAd.show().catch(() => {
    // 失败重试
    uni.showLoading({ title: '广告加载中...' })
    rewardedVideoAd.load()
      .then(() => {
        uni.hideLoading()
        return rewardedVideoAd.show()
      })
      .catch((err: any) => {
        uni.hideLoading()
        console.error('资讯详情页激励视频广告显示失败', err)
        // 广告显示失败，直接解锁
        unlocked.value = true
        showToast('内容已解锁', 'success')
      })
  })
}

function copyText(text: string) {
  if (!text) return
  copyToClipboard(text)
}

// 朋友圈分享（微信小程序无 open-type 支持，引导用户使用右上角菜单）
function shareToTimeline() {
  sharePopupVisible.value = false
  showToast('请点击右上角···选择「分享到朋友圈」', 'none')
}

onLoad(async (options: any) => {
  const id = Number(options?.id)
  infoId.value = id
  if (!id) return

  // 当天已看过广告，直接全部展示（不显示解锁按钮）
  if (checkTodayAdWatched()) {
    unlocked.value = true
  }

  // 加载详情数据
  try {
    const res: any = await getInfoDetail(id)
    if (res.data) {
      detail.value = res.data
    }
  } catch (err: any) {
    // 权限不足时展示锁定提示页
    if (err?.message && err.message.includes('身份')) {
      permissionMsg.value = err.message
      permissionDenied.value = true
    }
  }

  // 初始化广告配置并创建激励视频广告实例（场景ID 10）
  try {
    const configRes = await getMiniappConfig()
    const configData = configRes.data || {}
    initFromConfig(configData)

    // 激励视频广告配置（场景ID 10）
    const rewardedAd = shouldShowAdByScene(10)
    if (rewardedAd && rewardedAd.ad_type === 'SLOT_ID_WEAPP_REWARD_VIDEO' && rewardedAd.ad_unit_id) {
      // 创建激励视频广告实例
      // @ts-ignore
      if (wx.createRewardedVideoAd) {
        // @ts-ignore
        rewardedVideoAd = wx.createRewardedVideoAd({
          adUnitId: rewardedAd.ad_unit_id
        })

        rewardedVideoAd.onLoad(() => {
          console.log('资讯详情页激励视频广告加载成功')
        })

        rewardedVideoAd.onError((err: any) => {
          console.error('资讯详情页激励视频广告加载失败', err)
        })

        rewardedVideoAd.onClose((res: any) => {
          // 用户完整观看了广告
          if (res && res.isEnded) {
            console.log('用户完整观看了激励视频广告')
            // 记录今天已看过广告（当天不再提示）
            setTodayAdWatched()
            // 解锁全部内容
            unlocked.value = true
            showToast('内容已解锁', 'success')
          } else {
            console.log('用户未完整观看广告')
            showToast('请完整观看广告后继续', 'none')
          }
          // 无论是否完整观看，都重新加载广告
          rewardedVideoAd.load().catch(() => {
            console.log('广告预加载失败')
          })
        })
      }
    }
  } catch (e) {
    console.error('获取广告配置失败', e)
  }
})
</script>

<style scoped>
.detail-page {
  padding: 18px 16px 70px;
}

/* ===== 顶部主区域 ===== */
.media-area {
  margin-bottom: 16px;
}

.video-cover {
  position: relative;
  width: 100%;
  height: 210px;
  border-radius: 20px;
  overflow: hidden;
  background: #172a48;
  box-shadow: 0 10px 30px rgba(60, 119, 196, 0.12);
}

.cover-img {
  width: 100%;
  height: 100%;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.28);
}

.play-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-icon text {
  color: #287be9;
  font-size: 26px;
}

.video-player {
  width: 100%;
  height: 210px;
  border-radius: 20px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 10px 30px rgba(60, 119, 196, 0.12);
}

.cover-image {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(60, 119, 196, 0.1);
}

.cover-img-full {
  width: 100%;
  display: block;
}

/* ===== 标题 ===== */
.article-title {
  font-size: 22px;
  line-height: 1.45;
  margin: 8px 0 10px;
  font-weight: 700;
  color: #1e293b;
}

/* ===== 元信息行 ===== */
.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  margin-bottom: 4px;
  border-bottom: 1px solid #e8eef7;
}

.meta-tag {
  font-size: 12px;
  color: #287be9;
  background: #eaf4ff;
  border-radius: 7px;
  padding: 3px 9px;
}

/* ===== 内容模块 ===== */
.modules {
  padding-top: 6px;
}

.module-editor {
  color: #36465c;
  font-size: 15px;
  line-height: 1.8;
}

/* 可复制文本模块 */
.copy-text-module {
  margin: 14px 0;
  background: #fff;
  border: 1px solid #dfeaf7;
  border-radius: 16px;
  padding: 13px;
  box-shadow: 0 7px 20px rgba(75, 111, 150, 0.045);
}

.copy-text-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
}

.copy-label {
  font-size: 13px;
  color: #1e293b;
  font-weight: 600;
}

.copy-btn {
  background: #edf6ff;
  border-radius: 9px;
  padding: 6px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

.copy-btn text {
  color: #3384ed;
  font-size: 11px;
}

.copy-text-content {
  padding: 11px 12px;
  border-radius: 12px;
  background: #f6faff;
  color: #4d5b6e;
  font-size: 13px;
  line-height: 1.75;
}

.empty-modules {
  text-align: center;
  color: #98a4b5;
  font-size: 13px;
  padding: 30px 0;
}

/* 解锁栏 */
.unlock-bar {
  width: 100%;
  min-height: 70px;
  margin: 18px 0 22px;
  padding: 15px 14px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  border: 1px solid #efc46b;
  border-radius: 13px;
  color: #8a5200;
  background: linear-gradient(110deg, #fffaf0 0%, #fff0c8 58%, #ffe2a1 100%);
  text-align: left;
  box-shadow: 0 7px 16px rgba(185, 119, 18, 0.2);
}

.unlock-bar::after {
  border: none;
}

.unlock-badge {
  position: absolute;
  right: 0;
  top: 0;
  padding: 0px 7px;
  border-radius: 0 12px 0 8px;
  color: #fff;
  background: linear-gradient(135deg, #ffad32, #ee7c14);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.unlock-icon {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid rgba(255, 255, 255, 0.75);
  border-radius: 50%;
  color: white;
  background: linear-gradient(135deg, #ffbf42, #ec7d16);
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 4px 9px rgba(219, 121, 19, 0.25);
}

.unlock-bar>view {
  flex: 1;
  min-width: 0;
}

.unlock-bar>view text {
  display: block;
  color: #8b5200;
  font-size: 14px;
  font-weight: 850;
  line-height: 1.35;
}

.unlock-bar>view text+text {
  margin-top: 5px;
  color: #b17117;
  font-size: 11px;
  font-weight: 600;
}

.unlock-arrow {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  background: #ee8a1b;
  font-size: 20px;
  line-height: 1;
  box-shadow: 0 3px 7px rgba(207, 109, 12, 0.22);
}

.unlocked-content {
  animation: unlockIn 0.25s ease;
}

@keyframes unlockIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.end-mark {
  margin-top: 21px;
  color: #a0aabb;
  text-align: center;
  font-size: 11px;
  letter-spacing: 2.5px;
}

/* 权限不足提示页 */
.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
}

.lock-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.lock-icon {
  font-size: 32px;
}

.pd-title {
  font-size: 19px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.pd-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 4px;
}

.pd-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 22px;
}

.pd-btn {
  padding: 0 28px;
  height: 44px;
  border-radius: 13px;
  background: #6658f5;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(102, 88, 245, 0.25);
}

.pd-btn text {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

/* ===== 底部分享栏 ===== */
.share-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 6px 16px;
  padding-bottom: calc(6px + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid #e8eef7;
  box-shadow: 0 -4px 12px rgba(40, 52, 89, 0.08);
  z-index: 100;
}

.share-btn {
  flex: 1;
  height: 38px;
  border-radius: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  background: linear-gradient(135deg, #3e93ff, #2168ef);
  box-shadow: 0 4px 12px rgba(33, 104, 239, 0.3);
}

.share-btn text { color: #fff; }
.share-btn-icon { font-size: 17px; }

/* ===== 分享弹窗 ===== */
.share-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  animation: maskIn 0.2s ease;
}

@keyframes maskIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.share-popup {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 18px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 201;
  animation: popupIn 0.25s ease;
}

@keyframes popupIn {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.share-popup-title {
  display: block;
  text-align: center;
  font-size: 14px;
  color: #8a96a7;
  margin-bottom: 20px;
}

.share-options {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 0 20px 24px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  line-height: normal;
}

.share-option::after { border: none; }

.share-option-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
}

.wechat-icon {
  background: linear-gradient(135deg, #2dc100, #07c160);
}

.moments-icon {
  background: linear-gradient(135deg, #4ad06a, #2aa84a);
}

.share-option-text {
  font-size: 12px;
  color: #4d5b6e;
}

.share-popup-cancel {
  text-align: center;
  padding: 14px 0 8px;
  font-size: 16px;
  color: #64748b;
  border-top: 1px solid #f1f5f9;
}
</style>
