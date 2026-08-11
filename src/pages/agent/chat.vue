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
              <view class="bubble">{{ msg.content }}</view>
              <view v-if="msg.role === 'ai' && msg.content" class="reply-actions">
                <button @tap="copyText(msg.content)">▣ 复制</button>
                <button :class="{ favorited: msg.favorited }" @tap="toggleMessageFavorite(msg)">
                  {{ msg.favorited ? '★ 已收藏' : '☆ 收藏' }}</button>
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
      <!-- <button class="voice" @tap="voiceHint">◉</button> -->
      <textarea v-model="inputText" class="chat-input" placeholder="请输入你的问题..." :maxlength="-1" auto-height
        :show-confirm-bar="false" :adjust-position="true" :cursor-spacing="24" confirm-type="send"
        @confirm="sendMessage" />
      <button :class="['send', { ready: inputText.trim() && !isTyping }]" @tap="sendMessage">发送</button>
    </view>

    <!-- 套餐支付弹窗 -->
    <PaySheet :visible="paySheetVisible" @close="paySheetVisible = false" @paid="handlePaid" />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMiniappAgentDetail, chatWithAgentStream, getAgentGreeting } from '@/api/miniapp'
import { navigator, copyToClipboard, showToast, checkPhoneRequired } from '@/utils'
import { getImageUrl } from '@/utils/image'
import PaySheet from '@/components/PaySheet.vue'

const agentId = ref(0)
const agentInfo = ref<any>(null)
const messages = ref<{ role: string; content: string; favorited?: boolean }[]>([])
const inputText = ref('')
const isTyping = ref(false)
const isFavorite = ref(false)
const dynamicGreeting = ref<string | null>(null)
const greetingLoading = ref(false)
const paySheetVisible = ref(false)
const lastMessage = ref('')
const scrollTarget = ref('')
const statusBarHeight = ref(0)

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

function voiceHint() {
  showToast('按住说话功能开发中', 'none')
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

async function sendMessage() {
  // 检查用户是否已绑定手机号
  if (!checkPhoneRequired()) {
    navigator.push(`/m/login/index`)
    return
  }

  const text = inputText.value.trim()
  if (!text || isTyping.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
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
          paySheetVisible.value = true
        } else if (err.message === 'ENTERPRISE_COMPUTE_INSUFFICIENT') {
          messages.value[aiMsgIndex].content = '所在企业的算力已耗尽，请联系企业管理员补充算力后继续使用。'
        } else {
          messages.value[aiMsgIndex].content = '网络异常，请稍后重试。'
        }
      },
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

onLoad((options: any) => {
  agentId.value = Number(options?.id || 0)
  if (!agentId.value) return
  fetchAgentDetail()
  fetchGreeting()
})

async function handlePaid(_data: { compute_balance: number }) {
  paySheetVisible.value = false
  if (messages.value.length > 0 && messages.value[messages.value.length - 1].role === 'ai') {
    messages.value.pop()
  }
  if (lastMessage.value) {
    inputText.value = lastMessage.value
    lastMessage.value = ''
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
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #dfe5f0;
  box-shadow: 0 -12rpx 32rpx rgba(40, 52, 89, 0.1);
}

.voice {
  width: 64rpx;
  height: 70rpx;
  padding: 0;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #26374d;
  background: transparent;
  font-size: 36rpx;
}

.voice::after {
  border: none;
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
