<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">资金详情</text>
    </view>

    <view class="balance-overview">
      <view class="balance-info">
        <text class="balance-label">当前余额</text>
        <text class="balance-amount">¥{{ balance.toFixed(2) }}</text>
      </view>
      <view class="primary-btn" @click="goWithdraw"><text>提现</text></view>
    </view>

    <view class="amount-list">
      <view class="amount-item" v-for="item in records" :key="item.id">
        <view class="line-row">
          <view class="title-wrap">
            <text class="item-title">{{ item.type_text || typeText(item.type) }}</text>
          </view>
          <text class="positive">+¥{{ formatAmount(item.amount) }}</text>
        </view>
        <view class="sub-row" v-if="item.out_trade_no || item.revenue_date">
          <text v-if="item.out_trade_no" class="sub-text">订单 {{ item.out_trade_no }}</text>
          <text v-if="item.revenue_date" class="sub-text">收益日期 {{ item.revenue_date }}</text>
        </view>
        <text v-if="item.remark" class="remark-text">{{ item.remark }}</text>
        <text class="time-text">{{ item.created_at }}</text>
      </view>
    </view>

    <view class="empty" v-if="!records.length"><text>暂无记录</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getBalanceRecords, getUserProfile } from '@/api/miniapp'
import { navigator } from '@/utils'

const balance = ref(0)
const records = ref<any[]>([])

function typeText(t: string) {
  const map: Record<string, string> = {
    package_direct: '直推佣金',
    package_indirect: '间推佣金',
    package_leader: '代理抽成',
    package_leader_indirect: '代理间推抽成',
    leader_commission: '销售代理分润',
    promoter_commission: '推广员分润',
    member_share: '成员分润',
    recharge: '充值',
    consume: '消费',
    reward: '奖励',
    withdraw: '提现',
  }
  return map[t] || t
}

function formatAmount(n: number) {
  return Number(n || 0).toFixed(2)
}

function goWithdraw() {
  navigator.push('/m/withdraw')
}

function goBack() {
  navigator.back()
}

onLoad(async () => {
  try {
    const [profileRes, recordsRes] = await Promise.all([getUserProfile(), getBalanceRecords()]) as any[]
    if (profileRes.code === 200) balance.value = profileRes.data?.balance || 0
    if (recordsRes.code === 200) records.value = recordsRes.data || []
  } catch {
    // 错误已在拦截器提示
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
.balance-overview {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.balance-info {
  display: flex;
  flex-direction: column;
}
.balance-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
}
.balance-amount {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
}
.primary-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.primary-btn text {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
.amount-list {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(211, 224, 241, 0.5);
}
.amount-item {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(211, 224, 241, 0.3);
}
.amount-item:last-child {
  border-bottom: none;
}
.line-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.item-title {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}
.positive {
  color: #10b981;
  font-weight: 600;
  font-size: 14px;
}
.sub-row {
  display: flex;
  gap: 12px;
  margin-top: 2px;
  flex-wrap: wrap;
}
.sub-text {
  font-size: 11px;
  color: #94a3b8;
}
.remark-text {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.time-text {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
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
