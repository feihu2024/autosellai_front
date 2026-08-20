<template>
  <view class="sub-page">
    <!-- <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">提现</text>
    </view> -->

    <view class="withdraw-card">
      <text class="withdraw-label">可提现金额</text>
      <text class="withdraw-amount">¥{{ balance.toFixed(2) }}</text>
      <text class="frozen-tip" v-if="frozenBalance > 0">冻结中 ¥{{ frozenBalance.toFixed(2) }}（审核中/处理中）</text>
    </view>

    <!-- 授权状态提示 -->
    <view class="auth-banner" v-if="!wxAuthorized">
      <view class="auth-info">
        <text class="auth-title">⚠️ 首次提现需授权</text>
        <text class="auth-desc">为保障资金安全，首次提现前需完成微信免确认收款授权，授权后后续提现自动到账</text>
      </view>
      <view class="auth-btn" :class="{ disabled: authorizing }" @click="handleAuthorize">
        <text>{{ authorizing ? '授权中...' : '去授权' }}</text>
      </view>
    </view>

    <view class="form-section">
      <text class="field-label">提现金额</text>
      <view class="input-wrap">
        <text class="yen">¥</text>
        <input type="number" class="amount-input" v-model="amount" placeholder="请输入提现金额" />
      </view>
      <view class="limit-tips">
        <text>单笔 {{ params.min_amount }}-{{ params.max_amount }} 元</text>
        <text>每日最多 {{ params.daily_limit }} 次</text>
        <text>手续费 {{ feePercent }}%</text>
      </view>
      <view class="fee-preview" v-if="amount && amount > 0">
        <text class="fee-label">手续费 ¥{{ calcFee().toFixed(2) }}</text>
        <text class="fee-actual">实际到账 ¥{{ (Number(amount) - calcFee()).toFixed(2) }}</text>
      </view>
      <view class="primary-btn wide-btn" :class="{ disabled: !canWithdraw }" @click="handleWithdraw">
        <text>{{ submitting ? '提交中...' : '确认提现' }}</text>
      </view>
    </view>

    <text class="section-title">提现记录</text>
    <view class="record-list">
      <view class="record-item" v-for="item in records" :key="item.id">
        <view class="record-left">
          <text class="record-amount">¥{{ Number(item.amount).toFixed(2) }}</text>
          <text class="record-actual">到账 ¥{{ Number(item.actual_amount || item.amount).toFixed(2) }}</text>
          <text class="record-time">{{ item.created_at }}</text>
        </view>
        <view class="record-right">
          <text :class="'status-' + item.status">{{ item.status_text || statusText(item.status) }}</text>
          <view class="reason-text"
            v-if="(item.status === 'rejected' || item.status === 'transfer_failed') && (item.reject_reason || item.reason)">
            <text>{{ item.reject_reason || item.reason }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!records.length"><text>暂无提现记录</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getUserProfile, getWithdrawRecords, requestWithdraw, initiateTransferAuthorization } from '@/api/miniapp'
import { navigator, showToast } from '@/utils'

const balance = ref(0)
const frozenBalance = ref(0)
const wxAuthorized = ref(false)
const amount = ref<string | number>('')
const records = ref<any[]>([])
const submitting = ref(false)
const authorizing = ref(false)

const params = ref({
  min_amount: 10,
  max_amount: 200,
  daily_limit: 10,
  fee_rate: 0.1,
})

const feePercent = ref(10)

function statusText(s: string) {
  const map: Record<string, string> = {
    pending: '审核中',
    approved: '已通过',
    transferring: '转账中',
    success: '已到账',
    rejected: '已驳回',
    transfer_failed: '转账失败',
  }
  return map[s] || s
}

function calcFee(): number {
  const amt = Number(amount.value) || 0
  return Math.round(amt * params.value.fee_rate * 100) / 100
}

const canWithdraw = computed(() => {
  const amt = Number(amount.value) || 0
  return amt > 0 && amt <= balance.value && !submitting.value && wxAuthorized.value
})

async function handleAuthorize() {
  authorizing.value = true
  try {
    const res = await initiateTransferAuthorization() as any
    const data = res.data || {}
    if (data.authorized) {
      wxAuthorized.value = true
    } else if (data.package_info) {
      // #ifdef MP-WEIXIN
      const wx = (globalThis as any).wx
      if (wx && wx.requestMerchantTransfer) {
        wx.requestMerchantTransfer({
          package: data.package_info,
          success: () => { wxAuthorized.value = true },
          fail: () => { showToast('授权已取消') },
        })
      } else {
        showToast('请在微信小程序中完成授权')
      }
      // #endif
      // #ifndef MP-WEIXIN
      showToast('授权页面已生成，请在微信小程序中完成授权')
      // #endif
    }
  } catch {
    showToast('授权失败，请重试')
  } finally {
    authorizing.value = false
  }
}

async function handleWithdraw() {
  if (!wxAuthorized.value) {
    showToast('请先完成提现授权')
    return
  }
  const amt = Number(amount.value)
  if (!amt || amt <= 0) return
  if (amt < params.value.min_amount) {
    showToast(`单笔最低提现 ${params.value.min_amount} 元`)
    return
  }
  if (amt > params.value.max_amount) {
    showToast(`单笔最高提现 ${params.value.max_amount} 元`)
    return
  }
  if (amt > balance.value) {
    showToast('余额不足')
    return
  }
  submitting.value = true
  try {
    const res = await requestWithdraw({ amount: amt }) as any
    if (res.code === 200) {
      showToast('提现申请已提交', 'success')
      amount.value = ''
      await loadData()
    } else {
      showToast(res.message || '提交失败')
    }
  } catch (e: any) {
    const msg = e?.message || '提交失败'
    showToast(msg)
  } finally {
    submitting.value = false
  }
}

async function loadData() {
  try {
    const [profileRes, recordsRes] = await Promise.all([getUserProfile(), getWithdrawRecords()]) as any[]
    if (profileRes.code === 200 && profileRes.data) {
      balance.value = Number(profileRes.data.balance) || 0
      frozenBalance.value = Number(profileRes.data.frozen_balance) || 0
      wxAuthorized.value = !!profileRes.data.wx_transfer_authorized
    }
    if (recordsRes.code === 200) {
      records.value = Array.isArray(recordsRes.data) ? recordsRes.data : []
    }
  } catch {
    // 错误已在拦截器提示
  }
}

function goBack() {
  navigator.back()
}

onLoad(loadData)
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

.withdraw-card {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 16px;
  padding: 24px 20px;
  text-align: center;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.withdraw-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8px;
}

.withdraw-amount {
  font-size: 30px;
  font-weight: 700;
  color: #fff;
}

.frozen-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8px;
}

.auth-banner {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.auth-info {
  flex: 1;
}

.auth-title {
  display: block;
  font-size: 13px;
  color: #c2410c;
  margin-bottom: 4px;
  font-weight: 600;
}

.auth-desc {
  display: block;
  font-size: 11px;
  color: #9a3412;
  line-height: 1.4;
}

.auth-btn {
  flex-shrink: 0;
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
  background: #f97316;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-btn text {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.auth-btn.disabled {
  opacity: 0.6;
}

.form-section {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(211, 224, 241, 0.5);
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 10px;
}

.input-wrap {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  padding: 0 14px;
  margin-bottom: 10px;
}

.yen {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin-right: 8px;
}

.amount-input {
  flex: 1;
  height: 48px;
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
}

.limit-tips {
  display: flex;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.limit-tips text {
  font-size: 11px;
  color: #94a3b8;
}

.fee-preview {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fee-label {
  font-size: 12px;
  color: #64748b;
}

.fee-actual {
  font-size: 16px;
  color: #10b981;
  font-weight: 700;
}

.primary-btn {
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-btn text {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

.primary-btn.disabled {
  opacity: 0.5;
}

.wide-btn {
  width: 100%;
}

.section-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
}

.record-list {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(211, 224, 241, 0.5);
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(211, 224, 241, 0.3);
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  flex-direction: column;
}

.record-amount {
  font-size: 16px;
  color: #1e293b;
  font-weight: 700;
}

.record-actual {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.record-time {
  font-size: 11px;
  color: #cbd5e1;
  margin-top: 2px;
}

.record-right {
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.reason-text {
  margin-top: 4px;
  max-width: 140px;
}

.reason-text text {
  font-size: 10px;
  color: #ef4444;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-approved {
  background: #dbeafe;
  color: #2563eb;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-transferring {
  background: #dbeafe;
  color: #2563eb;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-success {
  background: #dcfce7;
  color: #16a34a;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-rejected {
  background: #fee2e2;
  color: #dc2626;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.status-transfer_failed {
  background: #fef2f2;
  color: #dc2626;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #fecaca;
}

.empty {
  text-align: center;
  padding: 40px 0;
}

.empty text {
  color: #94a3b8;
  font-size: 14px;
}
</style>
