<template>
  <view class="sub-page">
    <view class="section" v-if="groups.length">
      <text class="section-title">客服微信群</text>
      <view class="group-card" v-for="item in groups" :key="item.id">
        <!-- #ifdef MP-WEIXIN -->
        <cell
          :url="pluginUrl(item)"
          :contactText="item.group_name || '加入群聊'"
          :contactTextBlod="true"
          @startmessage="onStartMessage"
          @completemessage="onCompleteMessage"
        />
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <text class="group-name">{{ item.group_name }}</text>
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
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getCustomerServices, getCustomerServiceDetail } from '@/api/miniapp'
import { copyToClipboard, makePhoneCall, showToast } from '@/utils'

const contacts = ref<any[]>([])
const groups = ref<any[]>([])

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
  showToast(messages[errcode] || '加入群聊失败', errcode === 0 ? 'success' : 'none')
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
  padding: 8px 4px;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px rgba(7, 193, 96, 0.08);
  border: 1px solid rgba(7, 193, 96, 0.12);
  overflow: hidden;
}

.group-name {
  display: block;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
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
</style>
