<template>
  <view class="assistant-page">
    <!-- ===== Sticky Header ===== -->
    <view class="detail-sticky-head" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="head-back" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="head-title">{{ agentInfo?.name || '智能体' }}</text>
      <view class="head-favorite" :class="{ active: isFavorite }" @click="toggleFavorite">
        <text class="star-icon">{{ isFavorite ? '★' : '☆' }}</text>
      </view>
    </view>

    <scroll-view class="content" scroll-y :scroll-into-view="scrollTarget" :scroll-with-animation="true">
      <!-- Agent Profile Card -->
      <view class="profile surface">
        <image v-if="agentInfo?.icon_url || agentInfo?.icon" :src="getImageUrl(agentInfo.icon_url || agentInfo.icon)"
          mode="aspectFill" />
        <image v-else src="/static/icons/common/robot.png" mode="aspectFit" />
        <view class="profile-copy">
          <view class="name-row">
            <text class="agent-name">{{ agentInfo?.name || '智能体' }}</text>
            <text class="online">● 在线</text>
          </view>
          <view class="agent-desc">{{ agentInfo?.description || '智能创作助手' }}</view>
          <view class="tags" v-if="agentInfo?.category">
            <text>{{ agentInfo.category }}</text>
          </view>
        </view>
      </view>

      <!-- Sample Videos -->
      <view class="samples surface" v-if="sampleVideos.length">
        <view class="sample-head">
          <text>样例视频</text>
          <!-- <text class="more" @tap="showMoreSamples">查看更多 ›</text> -->
        </view>
        <view class="sample-list">
          <view v-for="(sample, idx) in sampleVideos" :key="idx" class="sample" @tap="playSample(sample)">
            <image v-if="sample.cover" :src="getImageUrl(sample.cover)" mode="aspectFill" />
            <view v-else class="sample-placeholder" :class="sample.colorClass"></view>
            <view class="play">▶</view>
          </view>
        </view>
      </view>

      <!-- Chat Messages -->
      <view class="chat surface"
        v-if="messages.length > 0 || isTyping || dynamicGreeting || greetingLoading || agentInfo?.greeting">
        <text class="time">实时对话</text>

        <!-- Dynamic greeting -->
        <view v-if="messages.length === 0 && dynamicGreeting" class="message-row bot">
          <image class="avatar" src="/static/icons/common/robot.png" mode="aspectFit" />
          <view class="message-body response">
            <view class="bubble">{{ dynamicGreeting }}</view>
            <view class="reply-actions">
              <button @tap="copyText(dynamicGreeting)">▣ 复制</button>
            </view>
          </view>
        </view>

        <!-- Greeting loading -->
        <view v-if="messages.length === 0 && !dynamicGreeting && greetingLoading" class="message-row bot">
          <image class="avatar" src="/static/icons/common/robot.png" mode="aspectFit" />
          <view class="typing"><text></text><text></text><text></text></view>
        </view>

        <!-- Fallback static greeting -->
        <view v-if="messages.length === 0 && !dynamicGreeting && !greetingLoading && agentInfo?.greeting"
          class="message-row bot">
          <image class="avatar" src="/static/icons/common/robot.png" mode="aspectFit" />
          <view class="message-body response">
            <view class="bubble">{{ agentInfo.greeting }}</view>
            <view class="reply-actions">
              <button @tap="copyText(agentInfo.greeting)">▣ 复制</button>
            </view>
          </view>
        </view>

        <!-- Real messages -->
        <template v-for="(msg, idx) in messages" :key="'msg-' + idx">
          <view :class="['message-row', msg.role === 'user' ? 'user' : 'bot']">
            <image v-if="msg.role === 'ai'" class="avatar" src="/static/icons/common/robot.png" mode="aspectFit" />
            <view class="message-body" :class="{ response: msg.role === 'ai' }">
              <view class="bubble">
                <view v-if="msg.images && msg.images.length" class="bubble-images">
                  <image v-for="(img, i) in msg.images" :key="i" :src="getImageUrl(img)" mode="aspectFill"
                    @tap="previewChatImage(msg, i)" />
                </view>
                <text v-if="msg.content" class="bubble-text">{{ msg.content }}</text>
              </view>
              <view v-if="msg.role === 'ai' && msg.content" class="reply-actions">
                <button @tap="copyText(msg.content)">▣ 复制</button>
                <!-- <button :class="{ favorited: msg.favorited }" @tap="toggleMessageFavorite(msg)">
                  {{ msg.favorited ? '★ 已收藏' : '☆ 收藏' }}</button> -->
              </view>
            </view>
            <view v-if="msg.role === 'user'" class="user-avatar">你</view>
          </view>
        </template>

        <!-- AI typing indicator -->
        <view v-if="isTyping" class="message-row bot">
          <image class="avatar" src="/static/icons/common/robot.png" mode="aspectFit" />
          <view class="typing"><text></text><text></text><text></text></view>
        </view>

        <view id="chat-bottom" class="msg-end"></view>
      </view>
    </scroll-view>

    <!-- ===== Composer ===== -->
    <view class="composer surface">
      <!-- 待发送图片回显区（输入框上方） -->
      <view v-if="pendingImages.length > 0 || uploadingImage" class="pending-images">
        <view v-for="(img, idx) in pendingImages" :key="idx" class="pending-item">
          <image class="pending-thumb" :src="img.preview" mode="aspectFill" @tap="previewPendingImage(idx)" />
          <view class="pending-delete" @tap.stop="removePendingImage(idx)">
            <text class="pending-delete-icon">×</text>
          </view>
        </view>
        <view v-if="uploadingImage" class="pending-uploading">
          <text>上传中</text>
        </view>
      </view>
      <view class="composer-row">
        <button class="upload-btn" :class="{ disabled: uploadingImage }" @tap="chooseImage">
          <text class="upload-icon">📷</text>
        </button>
        <textarea v-model="inputText" class="chat-input" placeholder="请输入你的问题..." :maxlength="-1" auto-height
          :show-confirm-bar="false" :adjust-position="true" :cursor-spacing="24" confirm-type="send"
          @confirm="sendMessage" />
        <button :class="['send', { ready: (inputText.trim() || pendingImages.length > 0) && !isTyping }]"
          @tap="sendMessage">发送</button>
      </view>
    </view>

    <!-- 套餐支付弹窗 -->
    <PaySheet :visible="paySheetVisible" @close="paySheetVisible = false" @paid="handlePaid" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMiniappAgentDetail, chatWithAgentStream, getAgentGreeting, getMiniappConfig, reportRewardVideo, uploadChatImage } from '@/api/miniapp'
import { navigator, copyToClipboard, showToast, checkPhoneRequired } from '@/utils'
import { getImageUrl } from '@/utils/image'
import PaySheet from '@/components/PaySheet.vue'
import { useAdManager } from '@/composables/useAdManager'

const { shouldShowAdByScene, initFromConfig } = useAdManager()

// 激励视频广告实例
let rewardedVideoAd: any = null
// 待发送的消息（看完广告后发送）
const pendingMessage = ref('')

// 激励视频上报场景码（用于领取免费算力，优先取广告配置 trigger_key）
let rewardSceneCode: any = 'zntjl'

// ===== 一天只看一次广告（领取免费算力） =====
const AD_WATCH_DATE_KEY = 'agentChatAdWatchDate'

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

const agentId = ref(0)
const agentInfo = ref<any>(null)
const messages = ref<{ role: string; content: string; favorited?: boolean; images?: string[] }[]>([])
const inputText = ref('')
const isTyping = ref(false)
const isFavorite = ref(false)
const dynamicGreeting = ref<string | null>(null)
const greetingLoading = ref(false)
const paySheetVisible = ref(false)
const lastMessage = ref('')
// 算力不足时记录的最近一次发送内容（文字 + 图片），支付成功后重发
const lastImages = ref<string[]>([])
const scrollTarget = ref('')
const statusBarHeight = ref(0)

// ===== 图片上传 =====
// 待发送图片：preview 为本地预览地址（或服务器地址），url 为上传后的服务器地址
const pendingImages = ref<{ preview: string; url: string }[]>([])
const uploadingImage = ref(false)
// 单次最多可携带的图片数
const MAX_IMAGES = 9

// 获取状态栏高度
const sysInfo = uni.getSystemInfoSync()
statusBarHeight.value = sysInfo.statusBarHeight || 0

// 静态样例视频数据
const sampleVideos = ref([
  {
    title: '产品介绍样例',
    meta: '15秒 · 口播视频',
    cover: '',
    isArt: false,
    colorClass: '',
  },
  {
    title: '爆款开场样例',
    meta: '10秒 · 强钩子',
    isArt: true,
    artText: '3秒<br/>抓住注意力',
    colorClass: 'sample-purple',
  },
  {
    title: '场景种草样例',
    meta: '20秒 · 图文混剪',
    isArt: true,
    artIcon: true,
    colorClass: 'sample-blue',
  },
  {
    title: '成交转化样例',
    meta: '30秒 · 带货脚本',
    isArt: true,
    artText: '卖点<br/>转化脚本',
    colorClass: 'sample-orange',
  },
])

// 静态示例对话（预留，当前模板未使用）
// const exampleConversations = ref([...])

function goBack() {
  navigator.back()
}

function toggleFavorite() {
  isFavorite.value = !isFavorite.value
}

function playSample(_sample: any) {
  showToast('正在播放样例', 'none')
}

function showMoreSamples() {
  showToast('更多样例持续更新中', 'none')
}

function toggleMessageFavorite(msg: any) {
  msg.favorited = !msg.favorited
  showToast(msg.favorited ? '已收藏' : '已取消收藏', 'none')
}

function scrollToBottom() {
  // 先清除再设置，确保触发滚动
  scrollTarget.value = ''
  setTimeout(() => {
    scrollTarget.value = 'chat-bottom'
  }, 50)
}

async function copyText(text: string) {
  await copyToClipboard(text)
  showToast('已复制', 'success')
}

// ===== 图片上传与预览 =====

/** 点击上传按钮：选择图片并上传 */
function chooseImage() {
  if (uploadingImage.value) {
    showToast('图片上传中，请稍候', 'none')
    return
  }
  const remaining = MAX_IMAGES - pendingImages.value.length
  if (remaining <= 0) {
    showToast(`最多上传${MAX_IMAGES}张图片`, 'none')
    return
  }
  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res: any) => {
      uploadImages(res.tempFilePaths as string[])
    },
    fail: () => {
      // 用户取消选择，无需提示
    }
  })
}

/** 批量上传图片，成功后加入待发送回显区 */
async function uploadImages(filePaths: string[]) {
  if (!filePaths || filePaths.length === 0) return
  uploadingImage.value = true
  uni.showToast({ title: '正在上传...', icon: 'loading', duration: 30000 })
  try {
    const urls = await Promise.all(filePaths.map((p) => uploadChatImage(p)))
    urls.forEach((url, i) => {
      pendingImages.value.push({ preview: filePaths[i], url })
    })
    uni.hideToast()
    showToast('图片上传成功', 'success')
  } catch (err: any) {
    console.error('图片上传失败', err)
    uni.hideToast()
    showToast(err?.message || '图片上传失败', 'none')
  } finally {
    uploadingImage.value = false
  }
}

/** 删除待发送图片 */
function removePendingImage(idx: number) {
  pendingImages.value.splice(idx, 1)
}

/** 预览待发送图片 */
function previewPendingImage(idx: number) {
  const urls = pendingImages.value.map((item) => item.preview)
  uni.previewImage({ current: urls[idx], urls })
}

/** 预览聊天消息中的图片 */
function previewChatImage(msg: { images?: string[] }, idx: number) {
  if (!msg.images || msg.images.length === 0) return
  const urls = msg.images.map((u) => getImageUrl(u))
  uni.previewImage({ current: urls[idx], urls })
}

async function fetchAgentDetail() {
  try {
    const res = await getMiniappAgentDetail(agentId.value)
    const data = res.data
    if (data) {
      agentInfo.value = data
      if (data.is_favorite !== undefined) {
        isFavorite.value = !!data.is_favorite
      }
      // 如果有真实视频，替换样例
      if (data.videos && data.videos.length > 0) {
        sampleVideos.value = data.videos.map((v: any) => ({
          title: v.title || '样例视频',
          meta: v.meta || '',
          cover: v.cover || v.cover_url || '',
          isArt: false,
          colorClass: '',
        }))
      }
    }
  } catch {
    // ignore
  }
}

async function fetchGreeting() {
  greetingLoading.value = true
  try {
    const res: any = await getAgentGreeting(agentId.value)
    if (res.code === 200 && res.data?.greeting) {
      dynamicGreeting.value = res.data.greeting
    }
  } catch {
    // 静默降级
  } finally {
    greetingLoading.value = false
  }
}

// 发送消息（当天首次需看广告领取免费算力）
async function sendMessage() {
  // 检查用户是否已绑定手机号
  if (!checkPhoneRequired()) {
    navigator.push(`/m/login/index`)
    return
  }

  const text = inputText.value.trim()
  const images = pendingImages.value.map((item) => item.url)
  if ((!text && images.length === 0) || isTyping.value) return

  // 当天已看过广告，直接发送消息
  if (checkTodayAdWatched()) {
    sendMessageInternal(text, images)
    return
  }

  // 没有广告实例，直接发送消息
  if (!rewardedVideoAd) {
    sendMessageInternal(text, images)
    return
  }

  // 未看过，保存待发送内容并弹窗提示观看广告领取免费算力
  // （图片保留在回显区，看完广告后随文字一起发送）
  pendingMessage.value = text
  inputText.value = ''

  uni.showModal({
    title: '温馨提示',
    content: '亲，每天可看广告免费领取30点算力，感谢您的支持，谢谢！',
    confirmText: '观看广告',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        // 用户点击确认，播放广告
        showRewardedAdAndSend()
      } else {
        // 用户取消，恢复输入内容（图片仍在回显区）
        inputText.value = pendingMessage.value
        pendingMessage.value = ''
      }
    }
  })
}

// 显示激励视频广告，看完后上报领取免费算力并发送消息
function showRewardedAdAndSend() {
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
        console.error('激励视频广告显示失败', err)
        // 广告显示失败，直接发送消息（文字 + 图片）
        if (pendingMessage.value || pendingImages.value.length > 0) {
          const text = pendingMessage.value
          const images = pendingImages.value.map((item) => item.url)
          pendingMessage.value = ''
          sendMessageInternal(text, images)
        }
      })
  })
}

// 实际发送消息的内部函数（文字 + 图片一起发送）
async function sendMessageInternal(text: string, images: string[] = []) {
  if ((!text && images.length === 0) || isTyping.value) return

  messages.value.push({
    role: 'user',
    content: text,
    images: images.length > 0 ? images : undefined,
  })
  // 清空输入框与待发送图片回显区
  inputText.value = ''
  pendingImages.value = []
  scrollToBottom()

  const aiMsgIndex = messages.value.length
  messages.value.push({ role: 'ai', content: '' })

  isTyping.value = true
  scrollToBottom()

  try {
    await chatWithAgentStream(
      agentId.value,
      text,
      (chunk) => {
        messages.value[aiMsgIndex].content += chunk
        scrollToBottom()
      },
      () => {
        // done
      },
      (err) => {
        console.log(err);

        if (err.message === 'COMPUTE_INSUFFICIENT') {
          messages.value[aiMsgIndex].content = '您的算力余额不足，请购买套餐后继续使用。'
          lastMessage.value = text
          lastImages.value = images
          paySheetVisible.value = true
        } else if (err.message === 'ENTERPRISE_COMPUTE_INSUFFICIENT') {
          messages.value[aiMsgIndex].content = '所在企业的算力已耗尽，请联系企业管理员补充算力后继续使用。'
        } else {
          messages.value[aiMsgIndex].content = '网络异常，请稍后重试。'
        }
      },
      images,
    )
    if (!messages.value[aiMsgIndex].content) {
      messages.value[aiMsgIndex].content = '抱歉，暂时无法回复。'
    }
  } catch {
    messages.value[aiMsgIndex].content = '网络异常，请稍后重试。'
  } finally {
    isTyping.value = false
    scrollToBottom()
  }
}

// 激励视频观看完成：上报领取免费算力后发送消息
async function handleRewardedVideoComplete() {
  // 上报激励视频观看，服务端据此发放30点免费算力（仅当天生效）
  try {
    await reportRewardVideo({ scene_code: rewardSceneCode })
    setTodayAdWatched()
    // showToast('已领取30点免费算力', 'success')
    // uni.showToast({
    //   title: '已领取30点免费算力',
    //   icon: 'none',
    //   duration: 3000
    // })
  } catch (err: any) {
    console.error('领取免费算力失败', err)
    // 上报失败也记录今天已看过，避免重复弹窗打扰用户
    setTodayAdWatched()
  }
  // 发送待发送的消息（文字 + 图片）
  if (pendingMessage.value || pendingImages.value.length > 0) {
    const text = pendingMessage.value
    const images = pendingImages.value.map((item) => item.url)
    pendingMessage.value = ''
    sendMessageInternal(text, images)
  }
}

onLoad(async (options: any) => {
  agentId.value = Number(options?.id || 0)
  if (!agentId.value) return

  // 初始化广告配置并创建激励视频广告实例（场景ID 6）
  try {
    const configRes = await getMiniappConfig()
    const configData = configRes.data || {}
    initFromConfig(configData)

    // 获取激励视频广告配置
    const ad = shouldShowAdByScene(6)
    console.log(ad);

    if (ad && ad.ad_type === 'SLOT_ID_WEAPP_REWARD_VIDEO' && ad.ad_unit_id) {
      // 创建激励视频广告实例
      // @ts-ignore
      if (wx.createRewardedVideoAd) {
        // @ts-ignore
        rewardedVideoAd = wx.createRewardedVideoAd({
          adUnitId: ad.ad_unit_id
        })

        rewardedVideoAd.onLoad(() => {
          console.log('智能体对话页激励视频广告加载成功')
        })

        rewardedVideoAd.onError((err: any) => {
          console.error('智能体对话页激励视频广告加载失败', err)
        })

        rewardedVideoAd.onClose((res: any) => {
          // 用户完整观看了广告
          if (res && res.isEnded) {
            console.log('用户完整观看了激励视频广告')
            // 上报领取免费算力并发送消息
            handleRewardedVideoComplete()
          } else {
            console.log('用户未完整观看广告')
            showToast('请完整观看广告后继续', 'none')
            // 恢复输入内容
            if (pendingMessage.value) {
              inputText.value = pendingMessage.value
              pendingMessage.value = ''
            }
          }
          // 无论是否完整观看，都重新加载广告
          rewardedVideoAd.load().catch(() => {
            console.log('广告预加载失败')
          })
        })
      }
    }
  } catch (e) {
    console.error('初始化广告配置失败', e)
  }

  fetchAgentDetail()
  fetchGreeting()
})

async function handlePaid(_data: { compute_balance: number }) {
  paySheetVisible.value = false
  if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'ai') {
    messages.value.pop()
  }
  if (lastMessage.value || lastImages.value.length > 0) {
    inputText.value = lastMessage.value
    lastMessage.value = ''
    // 恢复待发送图片到回显区（本地临时文件已失效，用服务器地址预览）
    pendingImages.value = lastImages.value.map((url) => ({ preview: getImageUrl(url), url }))
    lastImages.value = []
    sendMessage()
  }
}
</script>

<style scoped>
.assistant-page {
  min-height: 100vh;
  padding: 22rpx 24rpx 0;
  background: #f4f8fe;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
}

/* ===== Sticky Header ===== */
.detail-sticky-head {
  flex-shrink: 0;
  z-index: 35;
  min-height: 44px;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 10px;
  margin: 0 -24rpx;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid rgba(225, 231, 242, 0.92);
}

.head-back {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f6fb;
}

.back-icon {
  color: #202a42;
  font-size: 24px;
  font-weight: 300;
}

.head-title {
  font-size: 19px;
  font-weight: 800;
  color: #202a42;
}

.head-favorite {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #edf3ff;
}

.star-icon {
  color: #8190a7;
  font-size: 20px;
}

.head-favorite.active .star-icon {
  color: #f5a623;
}

/* ===== Scroll Area ===== */
.content {
  flex: 1;
  height: 0;
  padding-bottom: 24rpx;
}

/* ===== Surface 卡片通用背景 ===== */
.surface {
  background: white;
  border-radius: 28rpx;
  box-shadow: 0 10rpx 30rpx rgba(39, 54, 75, 0.06);
}

/* ===== Profile Card ===== */
.profile {
  padding: 28rpx;
  display: flex;
  align-items: center;
}

.profile>image {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  background: #eaf2ff;
}

.profile-copy {
  min-width: 0;
  flex: 1;
  margin-left: 28rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.agent-name {
  font-size: 38rpx;
  font-weight: 800;
  color: #243142;
}

.online {
  padding: 7rpx 13rpx;
  border-radius: 10rpx;
  color: #18a974;
  background: #edf8f4;
  font-size: 22rpx;
}

.agent-desc {
  margin-top: 14rpx;
  color: #7e899b;
  font-size: 27rpx;
}

.tags {
  display: flex;
  gap: 14rpx;
  margin-top: 16rpx;
}

.tags text {
  padding: 8rpx 18rpx;
  border-radius: 10rpx;
  color: #3c79e5;
  background: #edf4ff;
  font-size: 23rpx;
}

/* ===== Sample Videos ===== */
.samples {
  margin-top: 20rpx;
  padding: 24rpx;
}

.sample-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 32rpx;
  font-weight: 750;
  color: #243142;
}

.more {
  color: #8b96a8;
  font-size: 25rpx;
  font-weight: 400;
}

.sample-list {
  display: flex;
  gap: 14rpx;
  margin-top: 20rpx;
}

.sample {
  width: 33.33%;
  height: 160rpx;
  position: relative;
  overflow: hidden;
  border-radius: 22rpx;
  background: #eaf2ff;
}

.sample image {
  width: 100%;
  height: 100%;
}

.sample-placeholder {
  width: 100%;
  height: 100%;
}

.sample-placeholder.sample-purple {
  background: linear-gradient(145deg, #6a5af2, #a176f8);
}

.sample-placeholder.sample-blue {
  background: linear-gradient(145deg, #4f8df7, #77c2ff);
}

.sample-placeholder.sample-orange {
  background: linear-gradient(145deg, #ff9b5e, #ff6f6f);
}

.sample .play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 38rpx;
  text-shadow: 0 3rpx 10rpx rgba(0, 0, 0, .45);
}

/* ===== Chat Messages ===== */
.chat {
  margin-top: 20rpx;
  padding: 26rpx 20rpx;
}

.time {
  display: block;
  text-align: center;
  color: #8e98a8;
  font-size: 23rpx;
}

.message-row {
  margin: 26rpx 0;
  display: flex;
  align-items: flex-start;
}

.message-row.user {
  justify-content: flex-end;
}

.avatar,
.user-avatar {
  width: 62rpx;
  height: 62rpx;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #eaf2ff;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: #347bed;
  font-size: 22rpx;
}

.message-body {
  max-width: 78%;
  margin: 0 14rpx;
}

.bubble {
  padding: 20rpx 23rpx;
  border: 1rpx solid #e5ebf4;
  border-radius: 10rpx 27rpx 27rpx 27rpx;
  color: #243142;
  background: white;
  white-space: pre-wrap;
  font-size: 27rpx;
  line-height: 1.6;
  box-shadow: 0 8rpx 20rpx rgba(50, 76, 111, .08);
}

.user .bubble {
  color: white;
  border: 0;
  border-radius: 27rpx 10rpx 27rpx 27rpx;
  background: linear-gradient(135deg, #3b91ff, #2269ef);
}

/* 气泡内图片 */
.bubble-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 10rpx;
}

.bubble-images image {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  background: #f3f6fa;
}

.reply-actions {
  display: flex;
  gap: 12rpx;
  margin-top: 10rpx;
}

.reply-actions button {
  margin: 0;
  height: 54rpx;
  padding: 0 18rpx;
  display: flex;
  align-items: center;
  border: 1rpx solid #dfe7f2;
  border-radius: 27rpx;
  color: #718098;
  background: rgba(255, 255, 255, .9);
  font-size: 23rpx;
}

.reply-actions button::after {
  border: none;
}

.reply-actions button.favorited {
  color: #e69b23;
  border-color: #f3d39b;
  background: #fff8e9;
}

/* ===== Typing Indicator ===== */
.typing {
  margin-left: 14rpx;
  padding: 22rpx;
  display: flex;
  gap: 8rpx;
  border-radius: 10rpx 26rpx 26rpx 26rpx;
  background: white;
}

.typing text {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #6e8fbd;
  animation: typing-bounce 1.2s infinite;
}

.typing text:nth-child(2) {
  animation-delay: 0.2s;
}

.typing text:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {

  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.msg-end {
  height: 8rpx;
}

/* ===== Composer ===== */
.composer {
  flex-shrink: 0;
  z-index: 20;
  margin: 0 -24rpx;
  min-height: 116rpx;
  padding: 12rpx 24rpx;
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #dfe5f0;
  box-shadow: 0 -12rpx 32rpx rgba(40, 52, 89, 0.1);
}

/* 输入行：上传按钮 + 输入框 + 发送按钮 */
.composer-row {
  display: flex;
  align-items: flex-end;
  width: 100%;
}

/* 待发送图片回显区（输入框上方） */
.pending-images {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18rpx;
  padding: 6rpx 6rpx 14rpx;
  width: 100%;
}

.pending-item {
  position: relative;
  width: 120rpx;
  height: 120rpx;
}

.pending-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 14rpx;
  background: #f3f6fa;
}

.pending-delete {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(32, 42, 66, 0.82);
  border: 2rpx solid #ffffff;
}

.pending-delete-icon {
  color: #ffffff;
  font-size: 26rpx;
  line-height: 1;
  font-weight: 600;
}

.pending-uploading {
  width: 120rpx;
  height: 120rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #718098;
  background: #f3f6fa;
  font-size: 23rpx;
}

/* 上传按钮（输入框左侧） */
.upload-btn {
  width: 70rpx;
  height: 70rpx;
  margin: 0 12rpx 0 0;
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 35rpx;
  background: #f3f6fa;
  line-height: 1;
}

.upload-btn::after {
  border: none;
}

.upload-btn.disabled {
  opacity: 0.5;
}

.upload-icon {
  font-size: 34rpx;
  line-height: 1;
}

.chat-input {
  flex: 1;
  width: auto;
  min-height: 70rpx;
  max-height: 190rpx;
  padding: 16rpx 20rpx;
  border-radius: 32rpx;
  color: #1b2a3d;
  background: #f3f6fa;
  font-size: 27rpx;
  line-height: 39rpx;
  overflow-y: auto;
}

.send {
  width: 108rpx;
  height: 70rpx;
  margin: 0 0 0 8rpx;
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 35rpx;
  color: white;
  background: #a9c9fa;
  font-size: 27rpx;
}

.send::after {
  border: none;
}

.send.ready {
  background: linear-gradient(135deg, #3e93ff, #2168ef);
}
</style>
