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

  <!-- ===== 紫色模板（模板1，原授权页） ===== -->
  <view v-else class="auth-page">
    <view class="page-header">
      <text class="eyebrow">账号与带货授权</text>
      <text class="page-title">授权管理</text>
      <text class="page-desc">统一管理账号授权、机构绑定与橱窗开通</text>
    </view>

    <view class="notice-card">
      <view class="notice-icon">
        <image class="ui-icon" src="/static/icons/common/shield.png" mode="aspectFit" />
      </view>
      <text class="notice-text">授权或绑定前，请先确保对应账号或功能已完成开通，并处于正常可用状态；尚未开通可先查看开通教程。</text>
    </view>

    <view class="auth-status-card" v-if="mcnOpen && authStatus.status !== 'none'">
      <view class="auth-status-row">
        <text class="auth-status-label">带货机构授权</text>
        <text class="auth-status-tag" :class="authStatusClass">{{ authStatusText }}</text>
      </view>
      <text class="auth-status-meta" v-if="authStatus.authorized_at">授权时间：{{ authStatus.authorized_at }}</text>
      <text class="auth-status-meta" v-else-if="authStatus.status === 'pending'">授权进行中，请在弹出的页面完成授权</text>
    </view>

    <view class="auth-grid" v-if="visibleCards.length">
      <view class="auth-card" v-if="tutorialVisible.mp">
        <view class="auth-title">
          <view class="auth-icon-box">
            <image class="ui-icon" src="/static/icons/auth/official-account.png" mode="aspectFit" />
          </view>
          <view class="auth-title-text">
            <text class="auth-sub">公众号</text>
            <text class="auth-h3">公众号授权</text>
          </view>
        </view>
        <text class="auth-card-desc">授权并绑定公众号账号。</text>
        <view class="prerequisite">
          <text class="prereq-label">前置条件</text>
          <text class="prereq-text">公众号需已完成注册并可正常使用。</text>
        </view>
        <view class="dual-actions">
          <view class="tutorial-btn" @click="openTutorial('mp', '公众号开通教程')"><text>开通教程</text></view>
          <view class="auth-main-btn" @click="onStaticClick('公众号授权')"><text>去授权</text></view>
        </view>
      </view>

      <view class="auth-card" v-if="tutorialVisible.channels">
        <view class="auth-title">
          <view class="auth-icon-box">
            <image class="ui-icon" src="/static/icons/auth/video-account.png" mode="aspectFit" />
          </view>
          <view class="auth-title-text">
            <text class="auth-sub">视频号</text>
            <text class="auth-h3">视频号授权</text>
          </view>
        </view>
        <text class="auth-card-desc">授权当前微信账号下的视频号。</text>
        <view class="prerequisite">
          <text class="prereq-label">前置条件</text>
          <text class="prereq-text">视频号需已完成开通并可正常使用。</text>
        </view>
        <view class="dual-actions">
          <view class="tutorial-btn" @click="openTutorial('channels', '视频号开通教程')"><text>开通教程</text></view>
          <view class="auth-main-btn" @click="onStaticClick('视频号授权')"><text>去授权</text></view>
        </view>
      </view>

      <view class="auth-card" v-if="tutorialVisible.mcn">
        <view class="auth-title">
          <view class="auth-icon-box">
            <image class="ui-icon" src="/static/icons/auth/institution.png" mode="aspectFit" />
          </view>
          <view class="auth-title-text">
            <text class="auth-sub">机构</text>
            <text class="auth-h3">带货机构绑定</text>
          </view>
        </view>
        <text class="auth-card-desc">绑定对应带货机构，进入带货合作流程。</text>
        <view class="prerequisite">
          <text class="prereq-label">前置条件</text>
          <text class="prereq-text">请先确保橱窗已开通并处于正常状态。</text>
        </view>
        <view class="dual-actions">
          <view class="tutorial-btn" @click="openTutorial('mcn', '橱窗与带货机构开通教程')"><text>开通教程</text></view>
          <view class="auth-main-btn" :class="{ disabled: binding }" @click="onBindMcn">
            <text>{{ binding ? '生成链接...' : (authStatus.status === 'authorized' ? '重新绑定' : '去绑定') }}</text>
          </view>
        </view>
      </view>

      <view class="auth-card" v-if="tutorialVisible.window">
        <view class="auth-title">
          <view class="auth-icon-box">
            <image class="ui-icon" src="/static/icons/auth/showcase.png" mode="aspectFit" />
          </view>
          <view class="auth-title-text">
            <text class="auth-sub">橱窗</text>
            <text class="auth-h3">橱窗开通</text>
          </view>
        </view>
        <text class="auth-card-desc">尚未开通橱窗时，可以在这里进入开通流程。</text>
        <view class="prerequisite">
          <text class="prereq-label">前置条件</text>
          <text class="prereq-text">需完成视频号实名认证。</text>
        </view>
        <view class="dual-actions">
          <view class="tutorial-btn" @click="openTutorial('window', '橱窗开通教程')"><text>开通教程</text></view>
          <view class="auth-main-btn secondary" @click="onStaticClick('橱窗开通')"><text>去开通</text></view>
        </view>
      </view>
    </view>

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

/* ===== 紫色模板 ===== */
.auth-page {
  padding: 12px 18px 0;
}

.page-header {
  padding: 20px 2px 18px;
}

.eyebrow {
  display: block;
  color: #6658f5;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.7px;
  margin-bottom: 7px;
}

.page-title {
  display: block;
  font-size: 34px;
  line-height: 1.16;
  margin-bottom: 9px;
  color: #202a42;
  font-weight: 800;
}

.page-desc {
  display: block;
  font-size: 15px;
  line-height: 1.65;
  color: #75829c;
}

.notice-card {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 16px;
  border-radius: 20px;
  background: #eef4ff;
  border: 1px solid #dce6fa;
  margin-bottom: 16px;
}

.notice-icon {
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notice-icon .ui-icon {
  width: 21px;
  height: 21px;
}

.notice-text {
  font-size: 14px;
  line-height: 1.72;
  color: #62708c;
  flex: 1;
}

.auth-status-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 15px;
  margin-bottom: 14px;
  box-shadow: 0 8px 24px rgba(57, 70, 112, 0.07);
}

.auth-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.auth-status-label {
  font-size: 14px;
  color: #202a42;
  font-weight: 600;
}

.auth-status-tag {
  padding: 4px 12px;
  border-radius: 10px;
  font-size: 12px;
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
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}

.auth-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-card {
  background: #fff;
  border: 1px solid #e5eaf4;
  border-radius: 24px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(57, 70, 112, 0.07);
  display: flex;
  flex-direction: column;
}

.auth-title {
  display: flex;
  align-items: center;
  gap: 13px;
}

.auth-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(145deg, #edf1ff, #f5efff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.auth-icon-box .ui-icon {
  width: 25px;
  height: 25px;
}

.auth-title-text {
  display: flex;
  flex-direction: column;
}

.auth-sub {
  font-size: 12px;
  color: #6658f5;
  font-weight: 800;
}

.auth-h3 {
  font-size: 19px;
  line-height: 1.35;
  margin-top: 3px;
  color: #202a42;
  font-weight: 700;
}

.auth-card-desc {
  font-size: 15px;
  color: #75829c;
  line-height: 1.65;
  margin: 15px 0 13px;
}

.prerequisite {
  border-radius: 15px;
  background: #f6f8fc;
  padding: 13px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.prereq-label {
  font-size: 13px;
  color: #6658f5;
  font-weight: 700;
}

.prereq-text {
  font-size: 14px;
  line-height: 1.62;
  color: #64718b;
}

.dual-actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.tutorial-btn {
  flex: 1;
  height: 46px;
  border-radius: 15px;
  background: #f5f3ff;
  color: #6658f5;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tutorial-btn:active {
  opacity: 0.85;
}

.auth-main-btn {
  flex: 1;
  height: 46px;
  border-radius: 15px;
  background: linear-gradient(135deg, #6658f5, #8377fb);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(102, 88, 245, 0.2);
}

.auth-main-btn:active {
  opacity: 0.85;
}

.auth-main-btn.secondary {
  background: #f0f5fb;
  color: #6658f5;
  box-shadow: none;
}

.auth-main-btn.disabled {
  opacity: 0.6;
}

.status-note {
  min-height: 54px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #98a3b8;
  font-size: 13px;
  margin-top: 16px;
  padding: 10px 14px;
  text-align: center;
}

.note-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #b9c2d3;
}

.status-note-text {
  color: #98a3b8;
  font-size: 13px;
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
