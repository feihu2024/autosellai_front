<template>
  <!-- ===== 金色模板 F-4（模板2） ===== -->
  <view v-if="isGoldTemplate" class="gold-auth">
    <text class="g-auth-title">授权管理</text>
    <view class="g-auth-hero">
      <image
        src="https://mlcfjihuaqn.yxiaozhu.com/saas/989eb5ea3d6445deb07491b14316c12b.png?e=1786247386&token=8HYKX7kOi_0yI5lbCm9L15PD17ROW4bDVRCIXtCA:JYHZsW0qP3cQizGgx6vM5L4pGGU="
        mode="widthFix" />
    </view>

    <!-- 授权状态卡 -->
    <view class="g-auth-status" v-if="mcnOpen && authStatus.status !== 'none'">
      <view class="g-auth-status-row">
        <text class="g-auth-status-label">带货机构授权</text>
        <text class="g-auth-status-tag" :class="authStatusClass">{{ authStatusText }}</text>
      </view>
      <text class="g-auth-status-meta" v-if="authStatus.authorized_at">授权时间：{{ authStatus.authorized_at }}</text>
      <text class="g-auth-status-meta" v-else-if="authStatus.status === 'pending'">授权进行中，请在弹出的页面完成授权</text>
    </view>

    <view class="g-auth-grid" v-if="visibleCards.length">
      <!-- 公众号 -->
      <view class="g-auth-card" v-if="tutorialVisible.mp">
        <image class="g-auth-badge" src="/static/tpl-gold/auth-public.png" mode="aspectFill" />
        <text class="g-card-h2">公众号授权</text>
        <text class="g-card-p">授权公众号，获取内容管理、用户触达等能力。</text>
        <view class="g-prerequisite">
          <image src="/static/tpl-gold/icon-shield-gold.png" mode="aspectFit" />
          <text class="g-prereq-text">前置条件：公众号已完成注册</text>
        </view>
        <view class="g-auth-actions">
          <view class="g-outline" @click="openTutorial('mp', '公众号开通教程')"><text>开通教程</text></view>
          <view @click="onStaticClick('公众号授权')"><text>去授权</text></view>
        </view>
      </view>

      <!-- 视频号 -->
      <view class="g-auth-card" v-if="tutorialVisible.channels">
        <image class="g-auth-badge" src="/static/tpl-gold/auth-video.png" mode="aspectFill" />
        <text class="g-card-h2">视频号授权</text>
        <text class="g-card-p">授权视频号，获取带货权限及数据分析等能力。</text>
        <view class="g-prerequisite">
          <image src="/static/tpl-gold/icon-shield-gold.png" mode="aspectFit" />
          <text class="g-prereq-text">前置条件：视频号已实名并开通基础权限</text>
        </view>
        <view class="g-auth-actions">
          <view class="g-outline" @click="openTutorial('channels', '视频号开通教程')"><text>开通教程</text></view>
          <view @click="onStaticClick('视频号授权')"><text>去授权</text></view>
        </view>
      </view>

      <!-- 机构绑定 -->
      <view class="g-auth-card" v-if="tutorialVisible.mcn">
        <image class="g-auth-badge" src="/static/tpl-gold/auth-agency.png" mode="aspectFill" />
        <text class="g-card-h2">机构绑定</text>
        <text class="g-card-p">绑定机构信息，便于统一管理与结算对账。</text>
        <view class="g-prerequisite">
          <image src="/static/tpl-gold/icon-shield-gold.png" mode="aspectFit" />
          <text class="g-prereq-text">前置条件：需具备可绑定的机构信息</text>
        </view>
        <view class="g-auth-actions">
          <view class="g-outline" @click="openTutorial('mcn', '橱窗与带货机构开通教程')"><text>开通教程</text></view>
          <view :class="{ 'g-btn-disabled': binding }" @click="onBindMcn">
            <text>{{ binding ? '生成链接...' : (authStatus.status === 'authorized' ? '重新绑定' : '去绑定') }}</text>
          </view>
        </view>
      </view>

      <!-- 橱窗开通 -->
      <view class="g-auth-card" v-if="tutorialVisible.window">
        <image class="g-auth-badge" src="/static/tpl-gold/auth-window.png" mode="aspectFill" />
        <text class="g-card-h2">橱窗开通</text>
        <text class="g-card-p">开通带货橱窗，展示并销售商品获取收益。</text>
        <view class="g-prerequisite">
          <image src="/static/tpl-gold/icon-shield-gold.png" mode="aspectFit" />
          <text class="g-prereq-text">前置条件：账号满足橱窗开通要求</text>
        </view>
        <view class="g-auth-actions">
          <view class="g-outline" @click="openTutorial('window', '橱窗开通教程')"><text>开通教程</text></view>
          <view @click="onStaticClick('橱窗开通')"><text>去开通</text></view>
        </view>
      </view>
    </view>

    <!-- 状态提示 -->
    <view class="g-auth-notice" v-if="!mcnOpen">
      <image src="/static/tpl-gold/auth-bell.png" mode="aspectFit" />
      <view class="g-notice-body">
        <text class="g-notice-title">状态提示</text>
        <text class="g-notice-desc">当前企业暂未开通视频号带货机构功能</text>
      </view>
    </view>
  </view>

  <!-- ===== 紫色模板（模板1） ===== -->
  <view v-else class="page-shell auth-page">
    <!-- Hero -->
    <view class="feature-hero surface">
      <view>
        <text class="eyebrow">一站式授权中心</text>
        <view class="hero-title">快速开通<text>核心授权</text></view>
        <view class="hero-sub">按步骤完成绑定，立即开始使用</view>
        <!-- <view class="benefits">✓ 简单高效　✓ 安全可靠　✓ 快速生效</view> -->
      </view>
      <image src="/static/icons/common/shield.png" mode="aspectFit" />
    </view>

    <view class="section-title">授权列表</view>

    <!-- 授权状态 -->
    <view class="auth-status-card surface" v-if="mcnOpen && authStatus.status !== 'none'">
      <view class="auth-status-row">
        <text class="auth-status-label">带货机构授权</text>
        <text class="auth-status-tag" :class="authStatusClass">{{ authStatusText }}</text>
      </view>
      <text class="auth-status-meta" v-if="authStatus.authorized_at">授权时间：{{ authStatus.authorized_at }}</text>
      <text class="auth-status-meta" v-else-if="authStatus.status === 'pending'">授权进行中，请在弹出的页面完成授权</text>
    </view>

    <!-- 功能列表 -->
    <view class="feature-list surface" v-if="visibleCards.length">
      <!-- 公众号 -->
      <view class="feature" v-if="tutorialVisible.mp">
        <image src="/static/icons/auth/official-account.png" mode="aspectFit" />
        <view class="feature-copy">
          <view class="feature-name">公众号授权<text v-if="authStatus.status === 'authorized'">已授权</text></view>
          <view class="feature-desc">授权并绑定公众号账号，获取内容管理能力</view>
        </view>
        <view class="feature-actions">
          <button class="ghost" @tap="openTutorial('mp', '公众号开通教程')">教程</button>
          <button class="primary" @tap="onStaticClick('公众号授权')">去授权</button>
        </view>
      </view>

      <!-- 视频号 -->
      <view class="feature" v-if="tutorialVisible.channels">
        <image src="/static/icons/auth/video-account.png" mode="aspectFit" />
        <view class="feature-copy">
          <view class="feature-name">视频号授权<text v-if="authStatus.status === 'authorized'">已授权</text></view>
          <view class="feature-desc">授权视频号，获取带货权限及数据分析能力</view>
        </view>
        <view class="feature-actions">
          <button class="ghost" @tap="openTutorial('channels', '视频号开通教程')">教程</button>
          <button class="primary" @tap="onStaticClick('视频号授权')">去授权</button>
        </view>
      </view>

      <!-- 机构绑定 -->
      <view class="feature" v-if="tutorialVisible.mcn">
        <image src="/static/icons/auth/institution.png" mode="aspectFit" />
        <view class="feature-copy">
          <view class="feature-name">机构绑定<text v-if="authStatus.status === 'authorized'">已绑定</text></view>
          <view class="feature-desc">绑定带货机构，进入带货合作流程</view>
        </view>
        <view class="feature-actions">
          <button class="ghost" @tap="openTutorial('mcn', '橱窗与带货机构开通教程')">教程</button>
          <button :class="['primary', { done: binding }]" @tap="onBindMcn">{{ binding ? '生成中' : '去绑定' }}</button>
        </view>
      </view>

      <!-- 橱窗开通 -->
      <view class="feature" v-if="tutorialVisible.window">
        <image src="/static/icons/auth/showcase.png" mode="aspectFit" />
        <view class="feature-copy">
          <view class="feature-name">橱窗开通</view>
          <view class="feature-desc">开通商品橱窗，解锁带货能力</view>
        </view>
        <view class="feature-actions">
          <button class="ghost" @tap="openTutorial('window', '橱窗开通教程')">教程</button>
          <button class="primary" @tap="onStaticClick('橱窗开通')">去开通</button>
        </view>
      </view>
    </view>

    <!-- 状态提示 -->
    <view class="status-note" v-if="!mcnOpen">
      <view class="note-dot"></view>
      <text class="status-note-text">当前企业暂未开启视频号带货机构功能</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getMcnStatus, getMcnAuthorization, bindMcn } from '@/api/miniapp'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'
import { navigator, showToast } from '@/utils'

const { isGoldTemplate, loadTemplateVariant } = useMiniappTemplate()

const mcnOpen = ref(false)
const binding = ref(false)
const authStatus = ref<any>({ status: 'none' })
const tutorialVisible = ref({
  mp: true,
  channels: true,
  mcn: true,
  window: true,
})
const visibleCards = computed(() => {
  return Object.values(tutorialVisible.value).filter(v => v)
})

const authStatusText = computed(() => {
  const map: Record<string, string> = {
    none: '未发起',
    pending: '授权中',
    authorized: '已授权',
    unauthorized: '已取消',
  }
  return map[authStatus.value.status] || '未发起'
})

const authStatusClass = computed(() => {
  const map: Record<string, string> = {
    authorized: 'green',
    pending: 'orange',
    unauthorized: 'red',
    none: 'gray',
  }
  return map[authStatus.value.status] || 'gray'
})

async function loadStatus() {
  try {
    const [statusRes, authRes]: any = await Promise.all([
      getMcnStatus(),
      getMcnAuthorization(),
    ])
    const d = statusRes.data || {}
    mcnOpen.value = !!(d.mcn_enabled && d.has_mcn_credential && d.bind_entry_visible)
    tutorialVisible.value = {
      mp: d.tutorial_mp_visible ?? true,
      channels: d.tutorial_channels_visible ?? true,
      mcn: d.tutorial_mcn_visible ?? true,
      window: d.tutorial_window_visible ?? true,
    }
    authStatus.value = authRes.data || { status: 'none' }
  } catch (e) {
    // 忽略
  }
}

function openTutorial(type: string, title: string) {
  navigator.push(`/m/mcn-tutorial?type=${type}&title=${encodeURIComponent(title)}`)
}

function onStaticClick(name: string) {
  showToast(`${name}功能开发中，敬请期待`)
}

async function onBindMcn() {
  if (!mcnOpen.value) {
    showToast('当前企业暂未开启视频号带货机构功能')
    return
  }
  binding.value = true
  try {
    const res: any = await bindMcn()
    const data = res.data || {}
    if (data.already_authorized) {
      showToast('您已授权过该带货机构，无需重复绑定')
      return
    }
    if (!data.auth_url) {
      showToast('授权链接生成失败，请稍后重试')
      return
    }
    navigator.push(`/m/mcn-auth-webview?url=${encodeURIComponent(data.auth_url)}`)
  } catch (e: any) {
    showToast(e.message || '发起绑定失败，请稍后重试')
  } finally {
    binding.value = false
  }
}

onMounted(() => {
  loadTemplateVariant()
  loadStatus()
})
</script>

<style scoped lang="scss">
.ui-icon {
  display: block;
  flex: 0 0 auto;
}

/* ===== 紫色模板（对齐 features 风格） ===== */
.auth-page {
  padding: 18rpx 24rpx 0;
  box-sizing: border-box;
}

/* surface 卡片通用背景 */
.surface {
  background: white;
  border-radius: 28rpx;
  box-shadow: 0 10rpx 30rpx rgba(39, 54, 75, 0.06);
}

/* Hero */
.feature-hero {
  min-height: 330rpx;
  padding: 42rpx;
  display: flex;
  align-items: center;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fbff, #e2edff);
}

.feature-hero>view {
  width: 68%;
  z-index: 2;
}

.eyebrow {
  color: #3277e9;
  font-size: 23rpx;
}

.hero-title {
  margin-top: 20rpx;
  font-size: 50rpx;
  font-weight: 800;
}

.hero-title text {
  margin-left: 8rpx;
  color: #2f70ed;
}

.hero-sub {
  margin-top: 22rpx;
  color: #718096;
  font-size: 30rpx;
}

.benefits {
  margin-top: 25rpx;
  color: #6e7c91;
  font-size: 22rpx;
}

.feature-hero image {
  width: 230rpx;
  height: 230rpx;
  margin-right: -75rpx;
  border-radius: 50%;
}

/* 区块标题 */
.section-title {
  margin: 34rpx 4rpx 20rpx;
  padding-left: 16rpx;
  border-left: 8rpx solid #2f7df3;
  font-size: 38rpx;
  font-weight: 800;
}

/* 功能列表 */
.feature-list {
  padding: 0 24rpx;
}

.feature {
  min-height: 220rpx;
  padding: 30rpx 0;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid #e8edf5;
}

.feature:last-child {
  border-bottom: 0;
}

.feature>image {
  width: 110rpx;
  height: 110rpx;
  flex: 0 0 auto;
  border-radius: 26rpx;
  background: #eaf2ff;
}

.feature-copy {
  flex: 1;
  min-width: 0;
  margin-left: 22rpx;
}

.feature-name {
  font-size: 35rpx;
  font-weight: 750;
}

.feature-name text {
  margin-left: 10rpx;
  color: #15a574;
  font-size: 21rpx;
}

.feature-desc {
  margin-top: 17rpx;
  color: #748197;
  font-size: 27rpx;
  line-height: 1.5;
}

.feature-actions {
  width: 112rpx;
  margin-left: 10rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.feature-actions button {
  width: 112rpx;
  height: 60rpx;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  font-size: 24rpx;
}

.feature-actions button::after {
  border: none;
}

.ghost {
  color: #3377ed;
  background: white;
  border: 2rpx solid #6b9bff;
}

.primary {
  color: white;
  background: #337bef;
}

.primary.done {
  color: #738198;
  background: #eff3f8;
}

/* 授权状态卡 */
.auth-status-card {
  padding: 22rpx 24rpx;
  margin-bottom: 20rpx;
}

.auth-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auth-status-label {
  font-size: 30rpx;
  color: #202a42;
  font-weight: 600;
}

.auth-status-tag {
  padding: 6rpx 16rpx;
  border-radius: 10rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.auth-status-tag.green {
  background: #ecfdf5;
  color: #027a57;
}

.auth-status-tag.orange {
  background: #fffbeb;
  color: #b54708;
}

.auth-status-tag.red {
  background: #fef3f2;
  color: #b42318;
}

.auth-status-tag.gray {
  background: #f2f4f7;
  color: #64748b;
}

.auth-status-meta {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #64748b;
}

/* 状态提示 */
.status-note {
  min-height: 100rpx;
  margin-top: 20rpx;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.58);
}

.note-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #b9c2d3;
}

.status-note-text {
  color: #98a3b8;
  font-size: 26rpx;
}

/* ===== 金色模板 F-4 ===== */
.gold-auth {
  padding: 12px 18px 0;
  background: #fffaf2;
}

.g-auth-title {
  display: block;
  text-align: center;
  margin: 8px 0 12px;
  font-size: 20px;
  line-height: 1.35;
  letter-spacing: 0.5px;
  font-weight: 700;
  color: #15171b;
}

.g-auth-hero {
  width: 100%;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #f4d37b;
  margin-bottom: 14px;
}

.g-auth-hero image {
  width: 100%;
  display: block;
}

.g-auth-status {
  background: #fff;
  border: 1px solid #f0eee9;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(118, 94, 51, 0.08);
}

.g-auth-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.g-auth-status-label {
  font-size: 14px;
  color: #15171b;
  font-weight: 600;
}

.g-auth-status-tag {
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.g-auth-status-tag.green {
  background: #ecfdf5;
  color: #027a57;
}

.g-auth-status-tag.orange {
  background: #fffbeb;
  color: #b54708;
}

.g-auth-status-tag.red {
  background: #fef3f2;
  color: #b42318;
}

.g-auth-status-tag.gray {
  background: #f2f4f7;
  color: #64748b;
}

.g-auth-status-meta {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.g-auth-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.g-auth-card {
  position: relative;
  width: calc(50% - 5px);
  padding: 46px 10px 10px;
  border: 1px solid #efede8;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(118, 94, 51, 0.1);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.g-auth-badge {
  position: absolute;
  width: 42px;
  height: 42px;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
}

.g-card-h2 {
  margin: 4px 0 6px;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #15171b;
}

.g-card-p {
  margin: 0 0 8px;
  color: #6d7076;
  font-size: 11px;
  line-height: 1.5;
}

.g-prerequisite {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 0 0 8px;
  padding: 5px 6px;
  border-radius: 7px;
  background: #fff8e8;
}

.g-prerequisite image {
  flex: 0 0 auto;
  width: 12px;
  height: 12px;
  margin-top: 1px;
}

.g-prereq-text {
  color: #45474b;
  font-size: 10px;
  line-height: 1.45;
}

.g-auth-actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
}

.g-auth-actions view {
  flex: 1;
  min-width: 0;
  height: 32px;
  padding: 0 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3px;
  border-radius: 16px;
  color: #fff;
  background: linear-gradient(120deg, #ffb600, #ffc326);
  box-shadow: 0 3px 8px rgba(255, 177, 0, 0.18);
  font-size: 11px;
  font-weight: 700;
}

.g-auth-actions view:active {
  opacity: 0.85;
}

.g-auth-actions view.g-btn-disabled {
  opacity: 0.6;
}

.g-auth-actions .g-outline {
  color: #3d3d3d;
  border: 1px solid #ffb000;
  background: #fff;
  font-weight: 400;
  box-shadow: none;
}

.g-auth-notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 18px;
  border: 1px solid #f7d985;
  border-radius: 16px;
  background: #fffdf8;
}

.g-auth-notice>image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  flex-shrink: 0;
}

.g-notice-body {
  display: flex;
  flex-direction: column;
}

.g-notice-title {
  font-size: 15px;
  font-weight: 700;
  color: #15171b;
  margin-bottom: 4px;
}

.g-notice-desc {
  font-size: 13px;
  color: #6d7076;
}
</style>
