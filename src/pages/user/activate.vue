<template>
  <view class="sub-page">
    <!-- <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">卡密激活</text>
    </view> -->

    <!-- 步骤1：输入激活码 -->
    <view class="form-card">
      <text class="field-label">激活码</text>
      <view class="input-row">
        <input class="text-input" v-model="activationCode" placeholder="请输入激活码"
          :disabled="step === 'confirming' || step === 'done'" @confirm="identifyCard" />
        <view class="primary-btn" :class="{ disabled: step === 'confirming' || step === 'done' || !activationCode }"
          @click="identifyCard">
          <text>识别</text>
        </view>
      </view>
      <text class="field-hint" v-if="step === 'input'">输入卡密后点击「识别」，确认卡密信息无误后再激活。</text>
    </view>

    <!-- 识别中 -->
    <view class="result-card loading-card" v-if="loading">
      <view class="loading-dot"></view>
      <text class="loading-text">正在识别卡密...</text>
    </view>

    <!-- 识别失败 -->
    <view class="result-card error-card" v-if="step === 'input' && errorMsg">
      <view class="error-icon"><text>⚠</text></view>
      <text class="error-text">{{ errorMsg }}</text>
    </view>

    <!-- 步骤2：识别成功，展示信息 + 确认激活 -->
    <template v-if="step === 'confirming' && recognizedCard">
      <view class="result-card success-card">
        <view class="success-head">
          <text class="success-badge">✓ 识别成功</text>
          <text class="batch-tag">批次 #{{ recognizedCard.batch_id }}</text>
        </view>

        <view class="goods-title">
          <text class="goods-name">{{ recognizedCard.name }}</text>
        </view>

        <view class="benefit-row">
          <view class="benefit-item" v-if="recognizedCard.benefit_level !== '无'">
            <text class="benefit-label">赠送权益身份</text>
            <text class="benefit-value identity">{{ recognizedCard.benefit_level }}</text>
          </view>
          <view class="benefit-item" v-if="recognizedCard.compute_power > 0">
            <text class="benefit-label">赠送算力</text>
            <text class="benefit-value compute">{{ recognizedCard.compute_power.toLocaleString() }} 点</text>
          </view>
        </view>

        <view class="kv-list">
          <view class="kv"><text class="kv-label">卡密码</text><text class="kv-val code-val">{{
            activationCode.toUpperCase() }}</text></view>
          <view class="kv"><text class="kv-label">激活截止</text><text class="kv-val">{{ recognizedCard.expire_date
              }}</text></view>
          <view class="kv"><text class="kv-label">激活后权益归属</text><text class="kv-val">当前激活账户</text></view>
        </view>

        <view class="activate-warn">
          <text>💡 确认后权益将立即发放到您的账户，激活后不可撤销。</text>
        </view>

        <view class="confirm-actions">
          <view class="ghost-btn" @click="resetForm"><text>取消</text></view>
          <view class="primary-btn" :class="{ disabled: activating }" @click="confirmActivate">
            <text>{{ activating ? '激活中...' : '确认激活' }}</text>
          </view>
        </view>
      </view>
    </template>

    <!-- 步骤3：激活成功 -->
    <view class="result-card done-card" v-if="step === 'done' && recognizedCard">
      <text class="done-icon">🎉</text>
      <text class="done-title">激活成功</text>
      <text class="done-desc">卡密「{{ recognizedCard.name }}」已激活，权益已发放到您的账户</text>
      <view class="done-benefits">
        <view class="done-benefit" v-if="recognizedCard.benefit_level !== '无'">
          <text class="benefit-mini-label">权益身份</text>
          <text class="benefit-mini-val identity">{{ activatedResult?.new_benefit_level || recognizedCard.benefit_level
            }}</text>
        </view>
        <view class="done-benefit" v-if="recognizedCard.compute_power > 0">
          <text class="benefit-mini-label">算力</text>
          <text class="benefit-mini-val compute">+{{ recognizedCard.compute_power.toLocaleString() }} 点</text>
        </view>
      </view>
      <view class="balance-now" v-if="activatedResult">
        <text>当前算力余额：</text>
        <text class="balance-num">{{ activatedResult.new_compute_balance.toLocaleString() }} 点</text>
      </view>
      <view class="primary-btn wide-btn" @click="goCards"><text>查看我的卡密</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { recognizeCardCode, activateCardCode } from '@/api/miniapp'
import type { RecognizedCard } from '@/api/miniapp'
import { navigator, showToast } from '@/utils'

const activationCode = ref('')
const step = ref<'input' | 'confirming' | 'done'>('input')
const loading = ref(false)
const activating = ref(false)
const errorMsg = ref('')
const recognizedCard = ref<RecognizedCard | null>(null)
const activatedResult = ref<{
  new_benefit_level: string
  new_compute_balance: number
  compute_power: number
  name: string
} | null>(null)

async function identifyCard() {
  if (!activationCode.value || loading.value) return
  loading.value = true
  errorMsg.value = ''
  recognizedCard.value = null
  try {
    const res = await recognizeCardCode(activationCode.value.trim()) as any
    const data = res.data || res
    recognizedCard.value = data
    step.value = 'confirming'
  } catch (e: any) {
    errorMsg.value = e?.message || '识别失败'
    step.value = 'input'
  } finally {
    loading.value = false
  }
}

async function confirmActivate() {
  if (!recognizedCard.value || activating.value) return
  activating.value = true
  try {
    const res = await activateCardCode(activationCode.value.trim()) as any
    const data = res.data || res
    activatedResult.value = {
      new_benefit_level: data.new_benefit_level,
      new_compute_balance: data.new_compute_balance,
      compute_power: data.compute_power,
      name: data.name,
    }
    step.value = 'done'
    showToast('激活成功', 'success')
  } catch (e: any) {
    errorMsg.value = e?.message || '激活失败'
    step.value = 'input'
  } finally {
    activating.value = false
  }
}

function resetForm() {
  activationCode.value = ''
  recognizedCard.value = null
  errorMsg.value = ''
  step.value = 'input'
}

function goCards() {
  navigator.push('/m/cards')
}

function goBack() {
  navigator.back()
}
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

/* 表单卡片 */
.form-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(67, 109, 157, 0.05);
  border: 1px solid rgba(211, 224, 241, 0.5);
  margin-bottom: 14px;
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 10px;
}

.field-hint {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 10px;
}

.input-row {
  display: flex;
  gap: 10px;
}

.text-input {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  padding: 0 14px;
  font-size: 15px;
  background: #fff;
  color: #1e293b;
}

.primary-btn {
  height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.primary-btn text {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.primary-btn.disabled {
  opacity: 0.5;
}

.wide-btn {
  width: 100%;
  margin-top: 16px;
}

.ghost-btn {
  height: 44px;
  padding: 0 20px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ghost-btn text {
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

/* 结果卡片 */
.result-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 4px 16px rgba(67, 109, 157, 0.05);
  border: 1px solid rgba(211, 224, 241, 0.5);
}

.loading-card {
  display: flex;
  align-items: center;
  gap: 10px;
}

.loading-text {
  color: #64748b;
  font-size: 14px;
}

.loading-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #e2e8f0;
  border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  border-color: #fecaca;
}

.error-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.error-icon text {
  color: #fff;
  font-size: 16px;
}

.error-text {
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;
}

.success-card {
  padding: 20px;
}

.success-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.success-badge {
  background: #dcfce7;
  color: #16a34a;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.batch-tag {
  font-size: 12px;
  color: #94a3b8;
}

.goods-title {
  margin-bottom: 14px;
}

.goods-name {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}

.benefit-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.benefit-item {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  border: 1px solid #ddd6fe;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.benefit-label {
  display: block;
  font-size: 11px;
  color: #7c3aed;
  margin-bottom: 6px;
  font-weight: 500;
}

.benefit-value {
  font-size: 16px;
  font-weight: 700;
}

.benefit-value.identity {
  color: #6d28d9;
}

.benefit-value.compute {
  color: #7c3aed;
}

.kv-list {
  background: #f8fafc;
  border-radius: 12px;
  padding: 4px 14px;
  margin-bottom: 12px;
}

.kv {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.kv:last-child {
  border-bottom: none;
}

.kv-label {
  font-size: 13px;
  color: #64748b;
}

.kv-val {
  font-size: 13px;
  color: #1e293b;
  font-weight: 600;
}

.code-val {
  color: #6366f1 !important;
}

.activate-warn {
  font-size: 12px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  padding: 10px 12px;
  border-radius: 8px;
  line-height: 1.6;
  margin-bottom: 14px;
}

.confirm-actions {
  display: flex;
  gap: 10px;
}

.confirm-actions .primary-btn,
.confirm-actions .ghost-btn {
  flex: 1;
}

.done-card {
  text-align: center;
  padding: 28px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.done-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.done-title {
  font-size: 18px;
  color: #1e293b;
  font-weight: 700;
  margin-bottom: 8px;
}

.done-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  margin-bottom: 18px;
}

.done-benefits {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 18px;
  width: 100%;
}

.done-benefit {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.benefit-mini-label {
  display: block;
  font-size: 11px;
  color: #16a34a;
  margin-bottom: 4px;
}

.benefit-mini-val {
  font-size: 15px;
  font-weight: 700;
}

.benefit-mini-val.identity {
  color: #6d28d9;
}

.benefit-mini-val.compute {
  color: #7c3aed;
}

.balance-now {
  font-size: 13px;
  color: #475569;
  padding: 10px 14px;
  background: #f1f5f9;
  border-radius: 8px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.balance-num {
  color: #6366f1;
  font-weight: 700;
  font-size: 15px;
}
</style>
