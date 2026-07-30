<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">算力积分详情</text>
    </view>

    <!-- 当前算力展示 -->
    <view class="compute-overview">
      <text class="overview-label">当前可用算力</text>
      <text class="overview-amount">{{ Math.floor(summary.current_balance).toLocaleString() }}<text class="unit"> 点</text></text>
      <text class="overview-hint">1元 = 100点算力</text>
    </view>

    <!-- 汇总统计 -->
    <view class="summary-row">
      <view class="summary-item">
        <text class="summary-label">累计充值</text>
        <text class="summary-val text-green">+{{ Math.floor(summary.total_recharged).toLocaleString() }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">累计消耗</text>
        <text class="summary-val text-red">-{{ Math.floor(summary.total_consumed).toLocaleString() }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">免费次数</text>
        <text class="summary-val text-blue">{{ summary.total_free_calls }}</text>
      </view>
    </view>

    <!-- 记录列表 -->
    <view class="section-title">
      <text class="section-name">变动记录</text>
      <text class="section-count" v-if="total">共 {{ total }} 条</text>
    </view>

    <view class="record-list" v-if="records.length">
      <view class="record-item" v-for="item in records" :key="item.id">
        <view class="record-left">
          <view class="record-icon" :class="item.type">
            <text>{{ iconText(item.type) }}</text>
          </view>
          <view class="record-info">
            <text class="record-title">{{ item.title }}</text>
            <text class="record-time">{{ item.created_at }}</text>
          </view>
        </view>
        <view class="record-right">
          <text class="amount" :class="amountClass(item.type)">{{ formatChange(item) }}</text>
          <text class="balance-after" v-if="item.balance_after !== null && item.balance_after !== undefined">余额 {{ Math.floor(item.balance_after).toLocaleString() }}</text>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="records.length < total" @click="loadMore">
      <text v-if="!loadingMore">加载更多</text>
      <text v-else>加载中...</text>
    </view>

    <view class="empty" v-if="!records.length && !loading">
      <text>暂无记录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getComputeRecords } from '@/api/miniapp'
import { navigator } from '@/utils'

interface ComputeRecord {
  id: string
  title: string
  type: string
  compute_used: number
  balance_after: number | null
  created_at: string
}

const records = ref<ComputeRecord[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const loadingMore = ref(false)

const summary = reactive({
  total_consumed: 0,
  total_recharged: 0,
  total_free_calls: 0,
  current_balance: 0,
})

async function loadRecords(append = false) {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const res = await getComputeRecords({ page: page.value, page_size: pageSize.value }) as any
    const data = res.data?.data || res.data || {}
    if (append) {
      records.value = [...records.value, ...(data.items || [])]
    } else {
      records.value = data.items || []
    }
    total.value = data.total || 0
    if (data.summary) {
      summary.total_consumed = data.summary.total_consumed || 0
      summary.total_recharged = data.summary.total_recharged || 0
      summary.total_free_calls = data.summary.total_free_calls || 0
      summary.current_balance = data.summary.current_balance || 0
    }
  } catch {
    if (!append) records.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  if (records.value.length >= total.value) return
  page.value++
  loadRecords(true)
}

function iconText(type: string) {
  if (type === 'recharge') return '充'
  if (type === 'free') return '免'
  return '消'
}

function amountClass(type: string) {
  if (type === 'recharge') return 'positive'
  if (type === 'free') return 'free'
  return 'negative'
}

function formatChange(item: ComputeRecord) {
  if (item.type === 'free') return '免费'
  if (item.type === 'recharge') return `+${Math.floor(item.compute_used).toLocaleString()}`
  return `-${Math.floor(item.compute_used).toLocaleString()}`
}

function goBack() {
  navigator.back()
}

onLoad(() => {
  loadRecords()
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

.compute-overview {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  border-radius: 16px;
  padding: 28px 20px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.overview-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 10px;
}
.overview-amount {
  font-size: 36px;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
}
.overview-amount .unit {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.85;
}
.overview-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 16px 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(211, 224, 241, 0.5);
}
.summary-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.summary-label {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 6px;
}
.summary-val {
  font-size: 16px;
  font-weight: 700;
}
.text-green { color: #10b981; }
.text-red { color: #ef4444; }
.text-blue { color: #3b82f6; }
.summary-divider {
  width: 1px;
  height: 32px;
  background: rgba(211, 224, 241, 0.6);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.section-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}
.section-count {
  font-size: 12px;
  color: #94a3b8;
}

.record-list {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(211, 224, 241, 0.5);
}
.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(211, 224, 241, 0.3);
}
.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}
.record-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.record-icon text {
  font-size: 14px;
  font-weight: 700;
}
.record-icon.free text { color: #059669; }
.record-icon.free { background: #d1fae5; }
.record-icon.consume text { color: #d97706; }
.record-icon.consume { background: #fef3c7; }
.record-icon.recharge text { color: #2563eb; }
.record-icon.recharge { background: #dbeafe; }

.record-info {
  flex: 1;
  min-width: 0;
}
.record-title {
  font-size: 14px;
  color: #1e293b;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.record-time {
  font-size: 11px;
  color: #94a3b8;
}

.record-right {
  text-align: right;
  flex-shrink: 0;
}
.record-right .amount {
  font-size: 14px;
  font-weight: 700;
  display: block;
}
.record-right .amount.positive { color: #10b981; }
.record-right .amount.negative { color: #ef4444; }
.record-right .amount.free { color: #059669; }
.balance-after {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  display: block;
}

.load-more {
  text-align: center;
  padding: 16px;
}
.load-more text {
  color: #3b82f6;
  font-size: 13px;
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
