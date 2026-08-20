<template>
  <view class="sub-page">
    <!-- <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">联系客服</text>
    </view> -->

    <view class="contact-card" v-for="item in contacts" :key="item.id">
      <view class="contact-top">
        <!-- <view class="contact-avatar"><text>{{ item.name[0] }}</text></view> -->
        <view class="contact-info">
          <text class="contact-name">{{ item.nickname }}</text>
          <!-- <text class="contact-time">工作时间：{{ item.work_time }}</text> -->
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

    <view class="empty" v-if="!contacts.length"><text>暂无客服信息</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getCustomerServices } from '@/api/miniapp'
import { navigator, copyToClipboard, makePhoneCall, showToast } from '@/utils'

const contacts = ref<any[]>([])

async function onCopy(text: string) {
  await copyToClipboard(text)
  showToast('已复制：' + text, 'success')
}

function onCall(phone: string) {
  makePhoneCall(phone)
}

function goBack() {
  navigator.back()
}

onLoad(async () => {
  try {
    const res = await getCustomerServices() as any
    contacts.value = res.data.list || []
    console.log(contacts.value)
  } catch {
    contacts.value = []
  }
})
</script>

<style scoped lang="scss">
.sub-page {
  min-height: 100vh;
  background: #f4f7fc;
  padding: 0 16px 80px;
}

.page-head {
  display: flex;
  align-items: center;
  min-height: 50px;
  gap: 8px;
}

.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back text {
  font-size: 22px;
  color: #1e293b;
}

.page-title {
  font-size: 18px;
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

.contact-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.contact-avatar text {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
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

.contact-time {
  font-size: 11px;
  color: #94a3b8;
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
