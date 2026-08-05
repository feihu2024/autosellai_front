<template>
  <view class="page-container">
    <view class="page-gradient-bg"></view>

    <view class="header-section">
      <view @click="goBack" class="back-btn">
        <image src="/static/icons/common/back.png" class="back-icon" mode="aspectFit" />
      </view>
    </view>

    <view class="title-section">
      <view class="title-wrapper">
        <text class="title-text">文案提取</text>
      </view>
    </view>

    <view class="content-section">
      <!-- 链接输入区 -->
      <view class="link-input-card">
        <view class="card-header">
          <text class="card-icon-emoji">🔗</text>
          <text class="card-title">文案链接</text>
        </view>
        <view class="input-container">
          <textarea v-model="linkInput" placeholder="在此粘贴视频或文章链接..." class="input-textarea" />
        </view>
      </view>

      <!-- 操作按钮区 -->
      <view class="button-group">
        <view v-if="linkInput" @click="linkInput = ''" class="action-btn clear-btn">
          <view class="btn-icon-circle clear-icon-circle">
            <text class="icon-text">×</text>
          </view>
          <text class="btn-text clear-text">清空内容</text>
        </view>
        <view v-else @click="handlePasteLink" class="action-btn paste-btn">
          <view class="btn-icon-circle paste-icon-circle">
            <text class="icon-text">📋</text>
          </view>
          <text class="btn-text paste-text">粘贴链接</text>
        </view>

        <view @click="!loading && handleExtract()"
          :class="['action-btn', 'confirm-btn', { 'confirm-btn-loading': loading }]">
          <view v-if="loading" class="loading-wrapper">
            <view class="loading-spinner"></view>
          </view>
          <template v-else>
            <view class="btn-icon-circle confirm-icon-circle">
              <image src="/static/icons/common/check.png" class="check-icon" mode="aspectFit" />
            </view>
            <text class="btn-text confirm-text">确认</text>
          </template>
        </view>
      </view>

      <!-- 动态排序区域 -->
      <view class="result-area">
        <!-- 提取结果区（提取成功时显示在上方） -->
        <view v-if="extracted" class="result-card animate-slide-up">
          <view class="result-header">
            <view class="card-header">
              <text class="card-icon-emoji">📄</text>
              <text class="card-title">提取结果</text>
            </view>
            <view @click="copyText" class="copy-btn">
              <text class="copy-icon-emoji">📋</text>
              <text class="copy-btn-text">一键复制</text>
            </view>
          </view>
          <view class="result-container">
            <textarea v-model="textContent" placeholder="提取的文案内容将显示在这里，你也可以手动输入或修改..." class="result-textarea" />
          </view>
        </view>

        <!-- 广告位 -->
        <view class="ad-section animate-fade-in">
          <ad-custom unit-id="adunit-b8127b9177979035" @load="onAdLoad" @error="onAdError"
            @close="onAdClose"></ad-custom>
        </view>

        <!-- 提取结果区（未提取时显示在下方） -->
        <view v-if="!extracted" class="result-card">
          <view class="result-header">
            <view class="card-header">
              <text class="card-icon-emoji">📄</text>
              <text class="card-title">提取结果</text>
            </view>
            <view @click="copyText" class="copy-btn">
              <text class="copy-icon-emoji">📋</text>
              <text class="copy-btn-text">一键复制</text>
            </view>
          </view>
          <view class="result-container">
            <textarea v-model="textContent" placeholder="提取的文案内容将显示在这里，你也可以手动输入或修改..." class="result-textarea" />
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { postWenanExtract } from '@/api/miniapp'

const linkInput = ref('')
const textContent = ref('')
const loading = ref(false)
const extracted = ref(false)

const instructions = [
  '支持主流视频平台和文章链接文案提取',
  '提取结果仅供参考，请自行核实内容准确性',
  '请勿提取违规或敏感内容'
]

// 广告事件监听
const onAdLoad = () => {
  console.log('原生模板广告加载成功')
}

const onAdError = (err: any) => {
  console.error('原生模板广告加载失败', err)
}

const onAdClose = () => {
  console.log('原生模板广告关闭')
}

// 粘贴链接
const handlePasteLink = async () => {
  try {
    const res = await uni.getClipboardData()
    if (res.data) {
      linkInput.value = res.data
      uni.showToast({ title: '粘贴成功', icon: 'success' })
    } else {
      uni.showToast({ title: '剪贴板为空', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '粘贴失败', icon: 'none' })
  }
}

// 提取文案
const handleExtract = async () => {
  if (!linkInput.value.trim()) {
    uni.showToast({ title: '请先输入链接', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const res: any = await postWenanExtract({
      url: linkInput.value.trim()
    })

    if (res.data && res.data.text) {
      textContent.value = res.data.text
      extracted.value = true
      uni.showToast({ title: '提取成功', icon: 'success' })
    } else {
      uni.showToast({ title: res.msg || '提取失败，请检查链接', icon: 'none' })
    }
  } catch (e) {
    console.error('提取失败', e)
    uni.showToast({ title: '提取失败，请稍后重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 复制文案
const copyText = () => {
  if (!textContent.value.trim()) {
    uni.showToast({ title: '暂无内容可复制', icon: 'none' })
    return
  }
  uni.setClipboardData({
    data: textContent.value,
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' })
    }
  })
}

const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page-container {
  min-height: 100vh;
  background: #F7F9FE;
  position: relative;
  overflow: hidden;
}

.page-gradient-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 256px;
  background: linear-gradient(to bottom, #E6EAFC, transparent);
  opacity: 0.8;
  pointer-events: none;
}

.header-section {
  padding: 48px 24px 8px;
  position: relative;
  z-index: 10;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
}

.back-icon {
  width: 20px;
  height: 20px;
}

.title-section {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 24px 16px;
  position: relative;
  z-index: 10;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-text {
  font-size: 18px;
  font-weight: bold;
  color: #1A1A1A;
}

.content-section {
  padding: 0 20px;
  position: relative;
  z-index: 10;
}

.link-input-card {
  border-radius: 24px;
  padding: 10px;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 0 16px;
  padding-top: 8px;
}

.card-icon-emoji {
  font-size: 16px;
  line-height: 1;
}

.card-title {
  font-size: 14px;
  font-weight: bold;
  color: #1E293B;
}

.input-container {
  background: transparent;
  border-radius: 20px;
  border: 1px solid #F3F4F6;
  padding: 16px 20px;
  min-height: 100px;
}

.input-textarea {
  width: 100%;
  background: transparent;
  outline: none;
  font-size: 15px;
  color: #374151;
  min-height: 80px;
}

.button-group {
  margin-top: 24px;
  display: flex;
  gap: 16px;
}

.action-btn {
  flex: 1;
  border-radius: 16px;
  padding: 16px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.action-btn:active {
  transform: scale(0.95);
}

.clear-btn {
  background: #FFF4F4;
  border: 1px solid #FFE0E0;
}

.paste-btn {
  background: #F0F4FF;
  border: 1px solid #DDE4FF;
}

.confirm-btn {
  background: linear-gradient(to right, #7B8BFF, #5165FF);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.confirm-btn-loading {
  background: #D1D5DB;
}

.btn-icon-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-icon-circle {
  background: #FFE5E5;
}

.paste-icon-circle {
  background: #E8EDFF;
}

.confirm-icon-circle {
  background: white;
}

.icon-text {
  font-size: 16px;
  line-height: 1;
}

.check-icon {
  width: 14px;
  height: 14px;
}

.btn-text {
  font-weight: 600;
  font-size: 15px;
}

.clear-text {
  color: #FF5A5A;
}

.paste-text {
  color: #5A75FF;
}

.confirm-text {
  color: white;
}

.loading-wrapper {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.result-area {
  margin-top: 24px;
}

.result-card {
  border-radius: 24px;
  padding: 10px;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 16px;
  padding-top: 8px;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6366F1;
  font-weight: bold;
  background: #EEF2FF;
  padding: 6px 12px;
  border-radius: 8px;
  transition: transform 0.2s;
}

.copy-btn:active {
  transform: scale(0.95);
}

.copy-icon-emoji {
  font-size: 14px;
  line-height: 1;
}

.copy-btn-text {
  font-size: 12px;
}

.result-container {
  background: transparent;
  border-radius: 20px;
  border: 1px solid #F3F4F6;
  padding: 16px 20px;
  min-height: 200px;
}

.result-textarea {
  width: 100%;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: #334155;
  line-height: 1.6;
  min-height: 180px;
}

.ad-section {
  margin-top: 24px;
}

.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>