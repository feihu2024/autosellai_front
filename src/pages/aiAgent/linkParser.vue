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
        <text class="title-text">视频链接解析</text>
      </view>
    </view>

    <view class="content-section">
      <view class="input-wrapper">
        <view class="input-container">
          <textarea v-model="inputValue" placeholder="请输入视频链接" class="input-textarea" />
        </view>
      </view>

      <view class="button-group">
        <view v-if="inputValue" @click="inputValue = ''" class="action-btn clear-btn">
          <view class="btn-icon-circle clear-icon-circle">
            <text class="icon-text">×</text>
          </view>
          <text class="btn-text clear-text">清空内容</text>
        </view>
        <view v-else @click="handlePaste" class="action-btn paste-btn">
          <view class="btn-icon-circle paste-icon-circle">
            <text class="icon-text">📋</text>
          </view>
          <text class="btn-text paste-text">粘贴链接</text>
        </view>

        <view @click="!loading && parseVideo()"
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

      <!-- 模板广告 -->
      <view v-if="templateAdUnit" class="ad-container">
        <ad-custom :unit-id="templateAdUnit.ad_unit_id" @load="onAdLoad" @error="onAdError"
          @close="onAdClose"></ad-custom>
      </view>

      <view class="instructions-card">
        <view class="instructions-header">
          <view class="instructions-icon-wrapper">
            <image src="/static/icons/common/clock.png" class="calendar-icon" mode="aspectFit" />
          </view>
          <text class="instructions-title">使用须知</text>
        </view>
        <view class="instructions-list">
          <view v-for="(text, index) in instructions" :key="index" class="instruction-item">
            <view class="instruction-dot"></view>
            <text class="instruction-text">{{ text }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { postParseVideo, getMiniappConfig } from '@/api/miniapp'
import { navigator } from '@/utils/navigator'
import { useAdManager } from '@/composables/useAdManager'

const { shouldShowAdByScene, initFromConfig } = useAdManager()

// 模板广告配置（场景ID 11）
const templateAdUnit = ref<any>(null)

// 激励视频广告实例（场景ID 7）
let rewardedVideoAd: any = null
// 待解析的URL（看完广告后解析）
const pendingUrl = ref('')

const inputValue = ref('')
const loading = ref(false)

// 粘贴功能
const handlePaste = async () => {
  try {
    const res = await uni.getClipboardData({
      success: (res) => {
        if (res.data) {
          inputValue.value = res.data
          uni.showToast({ title: '粘贴成功', icon: 'success' })
        } else {
          uni.showToast({ title: '剪贴板为空', icon: 'none' })
        }
      },
      fail: () => {
        uni.showToast({ title: '粘贴失败', icon: 'none' })
      }
    })
  } catch (e) {
    uni.showToast({ title: '粘贴失败', icon: 'none' })
  }
}

const instructions = [
  '视频版权归平台及作者所有，本程序不存储任何内容',
]

const showToast = (msg: string) => {
  uni.showToast({
    title: msg,
    icon: 'none',
    duration: 3000
  })
}

const goBack = () => {
  uni.navigateBack()
}

// 广告事件处理
function onAdLoad() {
  console.log('链接解析页模板广告加载成功')
}

function onAdError(e: any) {
  console.error('链接解析页模板广告加载失败', e)
}

function onAdClose() {
  console.log('链接解析页模板广告关闭')
}

onMounted(async () => {
  // 获取广告配置
  try {
    // 先获取配置并初始化
    const configRes = await getMiniappConfig()
    const configData = configRes.data || {}
    initFromConfig(configData)

    // 模板广告配置（场景ID 11）
    const templateAd = shouldShowAdByScene(11)
    if (templateAd && templateAd.ad_type === 'SLOT_ID_WEAPP_TEMPLATE') {
      templateAdUnit.value = templateAd
      console.log('链接解析页模板广告配置:', templateAd)
    }

    // 激励视频广告配置（场景ID 7）
    const rewardedAd = shouldShowAdByScene(7)
    if (rewardedAd && rewardedAd.ad_type === 'SLOT_ID_WEAPP_REWARD_VIDEO' && rewardedAd.ad_unit_id) {
      // 创建激励视频广告实例
      // @ts-ignore
      if (wx.createRewardedVideoAd) {
        // @ts-ignore
        rewardedVideoAd = wx.createRewardedVideoAd({
          adUnitId: rewardedAd.ad_unit_id
        })

        rewardedVideoAd.onLoad(() => {
          console.log('链接解析页激励视频广告加载成功')
        })

        rewardedVideoAd.onError((err: any) => {
          console.error('链接解析页激励视频广告加载失败', err)
        })

        rewardedVideoAd.onClose((res: any) => {
          // 用户完整观看了广告
          if (res && res.isEnded) {
            console.log('用户完整观看了激励视频广告')
            // 解析视频
            if (pendingUrl.value) {
              parseVideoInternal(pendingUrl.value)
              pendingUrl.value = ''
            }
          } else {
            console.log('用户未完整观看广告')
            uni.showToast({ title: '请完整观看广告后继续', icon: 'none' })
          }
        })
      }
    }
  } catch (e) {
    console.error('获取广告配置失败', e)
  }
})

// 解析视频（先显示激励视频广告）
const parseVideo = async () => {
  if (loading.value) return
  if (!inputValue.value.trim()) {
    showToast('请先输入视频链接')
    return
  }

  // 如果有激励视频广告实例，先显示广告
  if (rewardedVideoAd) {
    // 保存待解析的URL
    pendingUrl.value = inputValue.value.trim()

    // 显示激励视频广告
    rewardedVideoAd.show().catch(() => {
      // 失败重试
      rewardedVideoAd.load()
        .then(() => rewardedVideoAd.show())
        .catch((err: any) => {
          console.error('链接解析页激励视频广告显示失败', err)
          // 广告显示失败，直接解析
          parseVideoInternal(inputValue.value.trim())
          pendingUrl.value = ''
        })
    })
  } else {
    // 没有广告实例，直接解析
    parseVideoInternal(inputValue.value.trim())
  }
}

// 实际解析视频的内部函数
const parseVideoInternal = async (url: string) => {
  loading.value = true
  try {
    const res: any = await postParseVideo({ url: url })
    if (res.data) {
      navigator.push(`/m/aiAgent/linkParserResult?data=${encodeURIComponent(JSON.stringify(res.data))}`)
    } else {
      showToast(res.msg || '解析失败，请检查链接是否正确')
    }
  } catch (e) {
    console.error('解析失败', e)
    showToast('解析失败，请稍后重试')
  } finally {
    loading.value = false
  }
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

.input-wrapper {
  border-radius: 24px;
  padding: 10px;
  border: 1px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
}

.input-container {
  background: transparent;
  border-radius: 20px;
  border: 1px solid #F3F4F6;
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  min-height: 120px;
  gap: 12px;
}

.input-textarea {
  flex: 1;
  background: transparent;
  outline: none;
  font-size: 17px;
  color: #374151;
  width: 100%;
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

.icon-text {
  font-size: 16px;
  line-height: 1;
}

.check-icon {
  width: 14px;
  height: 14px;
}

.calendar-icon {
  width: 16px;
  height: 16px;
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

/* 广告容器 */
.ad-container {
  margin: 24px 0;
}

.instructions-card {
  margin-top: 32px;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
}

.instructions-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.instructions-icon-wrapper {
  width: 32px;
  height: 32px;
  background: #E8EDFF;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.instructions-title {
  font-size: 18px;
  font-weight: bold;
  color: #1A1A1A;
}

.instructions-list {
  margin-top: 8px;
}

.instruction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #F9FAFB;
}

.instruction-item:last-child {
  border-bottom: none;
}

.instruction-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #8FA4FF;
  flex-shrink: 0;
}

.instruction-text {
  font-size: 14px;
  color: #6B7280;
  font-weight: 500;
}
</style>