<template>
  <view class="sub-page">
    <view class="section" v-if="groups.length">
      <text class="section-title">客服微信群</text>
      <view class="group-card" v-for="item in groups" :key="item.id">
        <view class="group-main">
          <view class="group-icon">
            <text>群</text>
          </view>
          <view class="group-info">
            <text class="group-name">{{ item.group_name }}</text>
            <text class="group-hint">长按二维码识别，加入群聊</text>
          </view>
        </view>

        <view class="qr-wrap" v-if="qrImages[item.id]">
          <image class="qr-image" :src="qrImages[item.id]" mode="aspectFit" show-menu-by-longpress />
          <text class="qr-tip">长按识别二维码入群</text>
        </view>
        <view class="qr-wrap" v-else>
          <text class="qr-tip">二维码生成中…</text>
        </view>

        <!-- #ifdef MP-WEIXIN -->
        <cell :url="pluginUrl(item)" :contactText="item.group_name || '加入群聊'" :contactTextBlod="true"
          @startmessage="onStartMessage" @completemessage="onCompleteMessage" />
        <!-- #endif -->
      </view>
    </view>

    <view class="section" v-if="contacts.length">
      <text class="section-title">客服联系方式</text>
      <view class="contact-card" v-for="item in contacts" :key="item.id">
        <view class="contact-top">
          <view class="contact-info">
            <text class="contact-name">{{ item.nickname }}</text>
          </view>
        </view>
        <view class="contact-row">
          <text class="row-label">微信号</text>
          <view class="contact-value-row">
            <text class="row-value">{{ item.wechat }}</text>
            <view class="copy-btn" @click="onCopy(item.wechat)"><text>复制</text></view>
          </view>
        </view>
        <view class="contact-row">
          <text class="row-label">电话</text>
          <view class="contact-value-row">
            <text class="row-value">{{ item.phone }}</text>
            <view class="call-btn" @click="onCall(item.phone)"><text>拨打</text></view>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!groups.length && !contacts.length">
      <text>暂无客服信息</text>
    </view>

    <canvas canvas-id="groupQrCanvas" class="hidden-qr-canvas"
      style="position: fixed; left: -9999px; width: 400px; height: 400px;"></canvas>
  </view>
</template>

<script setup lang="ts">
import { getCurrentInstance, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import QRCode from 'qrcode-generator'
import { getCustomerServices, getCustomerServiceDetail } from '@/api/miniapp'
import { copyToClipboard, makePhoneCall, showToast } from '@/utils'

const contacts = ref<any[]>([])
const groups = ref<any[]>([])
const qrImages = ref<Record<string, string>>({})
const instance = getCurrentInstance()?.proxy

async function onCopy(text: string) {
  await copyToClipboard(text)
  showToast('已复制：' + text, 'success')
}

function onCall(phone: string) {
  makePhoneCall(phone)
}

function pluginUrl(item: any) {
  return item?.qr_code || item?.group_url || ''
}

function isImageUrl(url: string) {
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url) || /qpic\.cn|qrtag|qrcode/i.test(url)
}

function onStartMessage() {
  // 插件开始处理入群
}

function onCompleteMessage(e: any) {
  const detail = e?.detail || e || {}
  const errcode = Number(detail.errcode)
  const messages: Record<number, string> = {
    0: '已发送入群邀请',
    '-3002': '获取入群配置失败',
    '-3004': '用户信息授权失败',
    '-3005': '消息发送失败',
    '-3006': '你已在群聊中',
    '-3009': '群聊已满员',
    '-3010': '群聊已解散',
    '-3011': '无法加入该群聊',
    '-3012': '你已在群中且群已满员',
  }
  showToast(messages[errcode] || '请长按二维码识别入群', errcode === 0 ? 'success' : 'none')
}

function drawQrOnCanvas(content: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvasId = 'groupQrCanvas'
    const size = 400
    const ctx = uni.createCanvasContext(canvasId, instance)

    try {
      const qr = QRCode(0, 'M')
      qr.addData(content)
      qr.make()
      const moduleCount = qr.getModuleCount()
      const margin = 16
      const cellSize = (size - margin * 2) / moduleCount

      ctx.setFillStyle('#ffffff')
      ctx.fillRect(0, 0, size, size)
      ctx.setFillStyle('#111111')
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            ctx.fillRect(margin + col * cellSize, margin + row * cellSize, cellSize, cellSize)
          }
        }
      }
    } catch (err) {
      reject(err)
      return
    }

    ctx.draw(false, () => {
      setTimeout(() => {
        uni.canvasToTempFilePath({
          canvasId,
          destWidth: size,
          destHeight: size,
          success: (res) => resolve(res.tempFilePath),
          fail: reject,
        }, instance)
      }, 200)
    })
  })
}

async function generateGroupQrs() {
  const next: Record<string, string> = {}
  for (const item of groups.value) {
    const url = pluginUrl(item)
    if (!url) continue
    if (isImageUrl(url)) {
      next[item.id] = url
      continue
    }
    try {
      next[item.id] = await drawQrOnCanvas(url)
    } catch {
      next[item.id] = ''
    }
  }
  qrImages.value = next
}

async function fetchContacts() {
  try {
    const res = await getCustomerServices() as any
    contacts.value = res.data?.list || []
  } catch {
    contacts.value = []
  }
}

async function fetchGroups() {
  try {
    const res = await getCustomerServiceDetail() as any
    groups.value = res.data?.list || []
    await generateGroupQrs()
  } catch {
    groups.value = []
  }
}

onLoad(() => {
  fetchContacts()
  fetchGroups()
})
</script>

<style scoped lang="scss">
.sub-page {
  min-height: 100vh;
  background: #f4f7fc;
  padding: 16px 16px 80px;
}

.section {
  margin-bottom: 8px;
}

.section-title {
  display: block;
  margin: 4px 4px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.4px;
}

.group-card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px rgba(7, 193, 96, 0.08);
  border: 1px solid rgba(7, 193, 96, 0.12);
}

.group-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.group-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #07c160, #06ad56);
}

.group-icon text {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.group-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.group-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
}

.group-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0 16px;
}

.qr-image {
  width: 220px;
  height: 220px;
  background: #fff;
}

.qr-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}

.contact-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(67, 109, 157, 0.05);
  border: 1px solid rgba(211, 224, 241, 0.5);
}

.contact-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.contact-name {
  font-size: 15px;
  color: #1e293b;
  margin-bottom: 2px;
  font-weight: 600;
}

.contact-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.row-label {
  font-size: 13px;
  color: #64748b;
}

.contact-value-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-value {
  font-size: 14px;
  color: #1e293b;
}

.copy-btn {
  background: #6366f1;
  border-radius: 6px;
  padding: 4px 10px;
}

.copy-btn text {
  color: #fff;
  font-size: 11px;
}

.call-btn {
  background: #10b981;
  border-radius: 6px;
  padding: 4px 10px;
}

.call-btn text {
  color: #fff;
  font-size: 11px;
}

.empty {
  text-align: center;
  padding: 60px 0;
}

.empty text {
  color: #94a3b8;
  font-size: 14px;
}

.hidden-qr-canvas {
  pointer-events: none;
  opacity: 0;
}
</style>
