<template>
  <view class="agent-detail-page">
    <!-- ===== Sticky Header ===== -->
    <view class="detail-sticky-head" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="head-back" @click="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="head-title">智能体</text>
      <view class="head-favorite" :class="{ active: isFavorite }" @click="toggleFavorite">
        <text class="star-icon">{{ isFavorite ? '★' : '☆' }}</text>
      </view>
    </view>

    <!-- ===== Scrollable Content ===== -->
    <scroll-view class="page-scroll" scroll-y :scroll-into-view="scrollTarget" :scroll-with-animation="true">
      <!-- Agent Identity Card -->
      <view class="agent-identity-card">
        <image v-if="agentInfo?.icon_url || agentInfo?.icon" class="identity-img"
          :src="getImageUrl(agentInfo.icon_url || agentInfo.icon)" mode="aspectFill" />
        <view v-else class="identity-icon-placeholder">
          <text class="bot-icon">AI</text>
        </view>
        <text class="identity-name">{{ agentInfo?.name || '智能体' }}</text>
        <text class="identity-desc">{{ agentInfo?.description || '智能创作助手' }}</text>
      </view>

      <view class="page-inner">
        <!-- Sample Video Module -->
        <view class="detail-section module-card sample-module-card">
          <scroll-view scroll-x class="sample-video-scroll">
            <view v-for="(sample, idx) in sampleVideos" :key="idx" class="sample-video-card" :class="sample.colorClass"
              @click="playSample(sample)">
              <view class="sample-square" :class="{ 'sample-art': sample.isArt }">
                <image v-if="sample.cover" class="sample-cover" :src="getImageUrl(sample.cover)" mode="aspectFill" />
                <view v-if="sample.artText" class="sample-art-text">
                  <rich-text :nodes="sample.artText"></rich-text>
                </view>
                <view v-if="sample.artIcon" class="sample-art-icon-box">
                  <text class="sample-art-icon">▣</text>
                </view>
                <view class="play-overlay">
                  <text class="play-icon">▶</text>
                </view>
              </view>
              <text class="sample-title">{{ sample.title }}</text>
              <text class="sample-meta">{{ sample.meta }}</text>
            </view>
          </scroll-view>
        </view>

        <!-- Example Conversation Module -->
        <view class="detail-section conversation-section module-card">
          <view class="detail-section-title">
            <view class="title-left">
              <text class="eyebrow">快速上手</text>
              <text class="section-h2">示例对话</text>
              <text class="section-sub">复制示例后可直接修改使用</text>
            </view>
            <text class="section-hint">点击即可复制</text>
          </view>
          <view class="conversation-list">
            <view v-for="(ex, idx) in exampleConversations" :key="'ex-' + idx" class="chat-row"
              :class="ex.role === 'user' ? 'user-row' : 'ai-row'">
              <view v-if="ex.role === 'ai'" class="chat-avatar">
                <text class="avatar-text">AI</text>
              </view>
              <view class="chat-bubble">
                <view class="chat-label">
                  <text class="label-text">{{ ex.label }}</text>
                </view>
                <text class="chat-content">{{ ex.text }}</text>
                <view class="copy-message" @click="copyText(ex.text)">
                  <text class="copy-text">复制</text>
                </view>
              </view>
              <view v-if="ex.role === 'user'" class="chat-avatar user-avatar">
                <text class="avatar-text">我</text>
              </view>
            </view>
          </view>
        </view>

        <!-- Real Chat Messages -->
        <view class="detail-section conversation-section module-card"
          v-if="messages.length > 0 || isTyping || dynamicGreeting || greetingLoading">
          <view class="detail-section-title">
            <view class="title-left">
              <text class="eyebrow">实时对话</text>
              <text class="section-h2">对话记录</text>
              <text class="section-sub">与智能体的实时交流</text>
            </view>
          </view>
          <view class="conversation-list">
            <!-- Dynamic greeting -->
            <view class="chat-row ai-row" v-if="messages.length === 0 && dynamicGreeting">
              <view class="chat-avatar"><text class="avatar-text">AI</text></view>
              <view class="chat-bubble">
                <view class="chat-label"><text class="label-text">智能体招呼</text></view>
                <text class="chat-content">{{ dynamicGreeting }}</text>
                <view class="copy-message" @click="copyText(dynamicGreeting)">
                  <text class="copy-text">复制</text>
                </view>
              </view>
            </view>

            <!-- Greeting loading -->
            <view class="chat-row ai-row" v-if="messages.length === 0 && !dynamicGreeting && greetingLoading">
              <view class="chat-avatar"><text class="avatar-text">AI</text></view>
              <view class="chat-bubble">
                <view class="typing-dots">
                  <view class="dot"></view>
                  <view class="dot"></view>
                  <view class="dot"></view>
                </view>
              </view>
            </view>

            <!-- Fallback static greeting -->
            <view class="chat-row ai-row"
              v-if="messages.length === 0 && !dynamicGreeting && !greetingLoading && agentInfo?.greeting">
              <view class="chat-avatar"><text class="avatar-text">AI</text></view>
              <view class="chat-bubble">
                <view class="chat-label"><text class="label-text">智能体招呼</text></view>
                <text class="chat-content">{{ agentInfo.greeting }}</text>
                <view class="copy-message" @click="copyText(agentInfo.greeting)">
                  <text class="copy-text">复制</text>
                </view>
              </view>
            </view>

            <!-- Real messages -->
            <view v-for="(msg, idx) in messages" :key="'msg-' + idx" class="chat-row"
              :class="msg.role === 'user' ? 'user-row' : 'ai-row'">
              <view v-if="msg.role === 'ai'" class="chat-avatar"><text class="avatar-text">AI</text></view>
              <view class="chat-bubble">
                <view class="chat-label">
                  <text class="label-text">{{ msg.role === 'user' ? '我的提问' : '智能体回复' }}</text>
                </view>
                <text class="chat-content">{{ msg.content }}</text>
                <view v-if="msg.role === 'ai' && msg.content" class="copy-message" @click="copyText(msg.content)">
                  <text class="copy-text">复制</text>
                </view>
              </view>
              <view v-if="msg.role === 'user'" class="chat-avatar user-avatar">
                <text class="avatar-text">我</text>
              </view>
            </view>

            <!-- AI typing indicator -->
            <view class="chat-row ai-row" v-if="isTyping">
              <view class="chat-avatar"><text class="avatar-text">AI</text></view>
              <view class="chat-bubble">
                <view class="typing-dots">
                  <view class="dot"></view>
                  <view class="dot"></view>
                  <view class="dot"></view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- Scroll anchor -->
        <view id="chat-bottom" style="height: 1px;"></view>
      </view>
    </scroll-view>

    <!-- ===== Fixed Composer ===== -->
    <view class="agent-composer" :style="{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }">
      <view class="composer-input-wrap">
        <textarea class="composer-textarea" v-model="inputText" placeholder="请输入你的创作需求" :auto-height="true"
          :maxlength="-1" :show-confirm-bar="false" :adjust-position="false" @input="onTextInput"
          @confirm="sendMessage"></textarea>
      </view>
      <view class="composer-send" :class="{ disabled: !inputText.trim() || isTyping }" @click="sendMessage">
        <text class="send-icon">➤</text>
      </view>
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
const messages = ref<{ role: string; content: string }[]>([])
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

// 静态示例对话
const exampleConversations = ref([
  {
    role: 'ai',
    label: '智能体示例',
    text: '你好！请告诉我产品名称、核心卖点和目标用户，我会帮你生成一套短视频文案。',
  },
  {
    role: 'user',
    label: '用户提问',
    text: '帮我写一个15秒的产品介绍视频，开头要有吸引力。',
  },
  {
    role: 'ai',
    label: '智能体回复',
    text: '开场：还在为内容没人看发愁吗？\n中段：把产品卖点用一句话讲清楚，再配合真实使用场景。\n结尾：现在就试试，让创作更轻松。',
  },
])

function goBack() {
  navigator.back()
}

function toggleFavorite() {
  isFavorite.value = !isFavorite.value
}

function playSample(_sample: any) {
  // 样例视频点击 - 预留
}

function onTextInput(e: any) {
  inputText.value = e.detail.value
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
.agent-detail-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background:
    radial-gradient(circle at 50% -10%, rgba(128, 118, 250, 0.12), transparent 32%),
    #f4f7fc;
  color: #202a42;
}

/* ===== Sticky Header ===== */
.detail-sticky-head {
  flex-shrink: 0;
  z-index: 35;
  min-height: 44px;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: 10px;
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
  background: #f5f3ff;
}

.star-icon {
  color: #9aa4b8;
  font-size: 20px;
}

.head-favorite.active .star-icon {
  color: #f5a623;
}

/* ===== Scroll Area ===== */
.page-scroll {
  flex: 1;
  overflow: hidden;
}

/* ===== Agent Identity Card ===== */
.agent-identity-card {
  margin: 10px 18px 0;
  padding: 11px 16px 10px;
  border-radius: 21px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background:
    radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.9), transparent 34%),
    linear-gradient(145deg, #f3f1ff, #f8f9ff 58%, #eef4ff);
  border: 1px solid rgba(205, 211, 239, 0.85);
  box-shadow: 0 14px 36px rgba(70, 79, 126, 0.08);
}

.identity-img {
  width: 64px;
  height: 64px;
  border-radius: 17px;
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.identity-icon-placeholder {
  width: 64px;
  height: 64px;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #efedff;
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.bot-icon {
  color: #6658f5;
  font-size: 18px;
  font-weight: 800;
}

.identity-name {
  margin-top: 7px;
  font-size: 17px;
  font-weight: 800;
  color: #202a42;
}

.identity-desc {
  margin-top: 2px;
  color: #75829c;
  font-size: 11px;
}

/* ===== Page Inner ===== */
.page-inner {
  padding: 10px 18px 20px;
}

.detail-section {
  margin-top: 16px;
}

.detail-section:first-child {
  margin-top: 0;
}

/* ===== Module Card ===== */
.module-card {
  margin-top: 16px;
  padding: 18px;
  border-radius: 28px;
  background: #fff;
  border: 1px solid rgba(224, 230, 241, 0.98);
  box-shadow: 0 12px 30px rgba(57, 70, 112, 0.07);
}

/* ===== Section Title ===== */
.detail-section-title {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf0f6;
}

.title-left {
  min-width: 0;
  flex: 1;
}

.eyebrow {
  color: #6658f5;
  font-size: 10px;
  font-weight: 800;
  display: block;
}

.section-h2 {
  margin-top: 4px;
  font-size: 19px;
  font-weight: 800;
  color: #202a42;
  display: block;
}

.section-sub {
  color: #75829c;
  font-size: 11px;
  display: block;
  margin-top: 4px;
}

.section-hint {
  flex-shrink: 0;
  padding: 5px 8px;
  border-radius: 999px;
  background: #f5f6fa;
  color: #8d98ae;
  font-size: 10px;
}

/* ===== Sample Video Module ===== */
.sample-module-card {
  padding: 14px;
}

.sample-video-scroll {
  white-space: nowrap;
  padding: 1px 1px 9px;
}

.sample-video-card {
  display: inline-flex;
  flex-direction: column;
  width: 138px;
  padding: 8px;
  border-radius: 20px;
  background: #fbfcff;
  border: 1px solid #e8ecf4;
  margin-right: 12px;
  vertical-align: top;
}

.sample-square {
  width: 100%;
  aspect-ratio: 1;
  position: relative;
  overflow: hidden;
  border-radius: 15px;
  background: #eef2fb;
  border: 1px solid rgba(226, 231, 241, 0.9);
}

.sample-cover {
  width: 100%;
  height: 100%;
}

.play-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 22px rgba(31, 42, 67, 0.18);
}

.play-icon {
  color: #6658f5;
  font-size: 16px;
}

/* Sample Art */
.sample-art {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #fff;
  background: linear-gradient(145deg, #7164f6, #a692ff);
}

.sample-purple .sample-art {
  background: linear-gradient(145deg, #6a5af2, #a176f8);
}

.sample-blue .sample-art {
  background: linear-gradient(145deg, #4f8df7, #77c2ff);
}

.sample-orange .sample-art {
  background: linear-gradient(145deg, #ff9b5e, #ff6f6f);
}

.sample-art-text {
  position: relative;
  z-index: 1;
}

.sample-art-icon-box {
  position: relative;
  z-index: 1;
}

.sample-art-icon {
  font-size: 40px;
}

.sample-title {
  display: block;
  margin: 10px 3px 3px;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #202a42;
}

.sample-meta {
  display: block;
  margin: 0 3px 3px;
  color: #75829c;
  font-size: 10px;
}

/* ===== Conversation List ===== */
.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ===== Chat Row ===== */
.chat-row {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 12px;
  border-radius: 18px;
  background: #f8f9fc;
  border: 1px solid #edf0f6;
}

.user-row {
  justify-content: flex-end;
  background: #f7f4ff;
  border-color: #e7e1ff;
}

/* ===== Chat Avatar ===== */
.chat-avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #efedff;
}

.avatar-text {
  color: #6658f5;
  font-size: 12px;
  font-weight: 800;
}

.user-avatar {
  background: linear-gradient(135deg, #6658f5, #8377fb);
}

.user-avatar .avatar-text {
  color: #fff;
}

/* ===== Chat Bubble ===== */
.chat-bubble {
  max-width: calc(100% - 49px);
  flex: 1;
}

.chat-label {
  margin-bottom: 8px;
}

.label-text {
  color: #75829c;
  font-size: 10px;
  font-weight: 700;
}

.chat-content {
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.72;
  color: #34405a;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ===== Copy Button ===== */
.copy-message {
  width: max-content;
  min-height: 30px;
  margin-top: 10px;
  padding: 0 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f1efff;
  border: 1px solid rgba(102, 88, 245, 0.12);
}

.copy-text {
  color: #6658f5;
  font-size: 10px;
  font-weight: 700;
}

.user-row .copy-message {
  margin-left: auto;
}

/* ===== Typing Dots ===== */
.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #75829c;
  animation: typing-bounce 1.2s infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
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

/* ===== Composer ===== */
.agent-composer {
  flex-shrink: 0;
  z-index: 40;
  min-height: 78px;
  padding: 10px 14px;
  padding-top: 10px;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 9px;
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #dfe5f0;
  box-shadow: 0 -12px 32px rgba(40, 52, 89, 0.1);
}

.composer-input-wrap {
  flex: 1;
  min-height: 44px;
  max-height: 122px;
  padding: 10px 13px;
  border-radius: 16px;
  background: #f3f5fa;
  border: 1px solid #e7ebf3;
  overflow: hidden;
}

.composer-textarea {
  width: 100%;
  min-height: 22px;
  max-height: 100px;
  font-size: 13px;
  line-height: 1.55;
  color: #202a42;
}

.composer-send {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6658f5, #8377fb);
  box-shadow: 0 8px 18px rgba(102, 88, 245, 0.22);
  flex-shrink: 0;
}

.send-icon {
  color: #fff;
  font-size: 18px;
}

.composer-send.disabled {
  opacity: 0.5;
}
</style>
