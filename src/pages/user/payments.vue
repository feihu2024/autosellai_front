<template>
  <view class="sub-page">
    <!-- <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">支付记录</text>
    </view> -->

    <view class="pay-list">
      <view class="pay-item" v-for="item in payments" :key="item.id">
        <view class="pay-main">
          <view class="line1">
            <text v-if="item.order_type === 'cardkey'" class="cardkey-tag">卡密激活</text>
            <text class="pay-name">{{ item.package_name || item.title }}</text>
            <text class="status-tag" :class="'st-' + (item.status || 'pending')">{{ item.status_text ||
              statusText(item.status) }}</text>
          </view>
          <text class="orderno">订单号 {{ item.out_trade_no || item.order_no }}</text>
          <text class="compute" v-if="item.compute_amount">算力 +{{ item.compute_amount }} 点</text>
        </view>
        <view class="pay-right">
          <text class="pay-amount">¥{{ Number(item.amount || 0).toFixed(2) }}</text>
          <text class="pay-time">{{ item.paid_at || item.created_at }}</text>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!payments.length"><text>暂无支付记录</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getPayments } from '@/api/miniapp'
import { navigator } from '@/utils'

const payments = ref<any[]>([])

function statusText(s: string) {
  const map: Record<string, string> = {
    pending: '待支付',
    paid: '已支付',
    cancelled: '已取消',
  }
  return map[s] || s
}

function goBack() {
  navigator.back()
}

onLoad(async () => {
  try {
    const res = await getPayments() as any
    payments.value = res.data || []
  } catch {
    payments.value = []
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

.pay-list {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(211, 224, 241, 0.5);
}

.pay-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(211, 224, 241, 0.3);
}

.pay-item:last-child {
  border-bottom: none;
}

.pay-main {
  flex: 1;
  min-width: 0;
}

.line1 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.pay-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.orderno {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.compute {
  display: block;
  font-size: 11px;
  color: #8b5cf6;
}

.status-tag {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 4px;
  font-weight: 500;
}

.cardkey-tag {
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 4px;
  font-weight: 500;
  background: #f3e8ff;
  color: #7c3aed;
}

.st-paid {
  background: #dcfce7;
  color: #16a34a;
}

.st-pending {
  background: #fef3c7;
  color: #d97706;
}

.st-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.pay-right {
  text-align: right;
  flex-shrink: 0;
  padding-left: 10px;
}

.pay-amount {
  display: block;
  font-size: 16px;
  color: #1e293b;
  font-weight: 700;
  margin-bottom: 2px;
}

.pay-time {
  font-size: 11px;
  color: #94a3b8;
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
