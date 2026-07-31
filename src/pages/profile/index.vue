<template>
  <!-- ===== 金色模板 F-5（模板2）个人中心 ===== -->
  <view v-if="isGoldTemplate" class="gold-profile">
    <view class="g-mine-header">
      <text class="g-page-title">我的</text>
    </view>

    <view class="g-profile-card">
      <image class="g-avatar" :src="profileAvatar" mode="aspectFill" />
      <view class="g-profile-main">
        <view class="g-profile-name-row">
          <text class="g-profile-name">{{ profile.nickname || '用户' }}</text>
          <text v-if="profile.benefit_level" class="g-benefit-badge">{{ profile.benefit_level }}</text>
          <text v-if="profile.is_leader" class="g-agent-badge">销售代理</text>
        </view>
        <text class="g-profile-phone">{{ profile.phone || '未登录' }}</text>
      </view>
      <view class="g-profile-stats">
        <view class="g-stat-item">
          <text class="g-stat-num">{{ profile.display_id || '-' }}</text>
          <text class="g-stat-label">自己的ID</text>
        </view>
        <view class="g-stat-item">
          <text class="g-stat-num">{{ profile.referrer_display_id || '无' }}</text>
          <text class="g-stat-label">推荐人的ID</text>
        </view>
        <view class="g-stat-item">
          <text class="g-stat-num">{{ profile.agent_display_id || '无' }}</text>
          <text class="g-stat-label">所属代理ID</text>
        </view>
        <view class="g-stat-item g-stat-clickable" @click="goTo('/m/balance')">
          <text class="g-stat-num">{{ (profile.balance || 0).toFixed(2) }}</text>
          <text class="g-stat-label">资金余额（元）</text>
        </view>
        <view class="g-stat-item g-stat-clickable" @click="goTo('/m/compute')">
          <text class="g-stat-num">{{ profile.compute_balance?.toLocaleString() || 0 }}</text>
          <text class="g-stat-label">算力余额</text>
        </view>
      </view>
    </view>

    <view class="g-mine-card">
      <view class="g-card-title">
        <text class="g-card-title-text">我的订单</text>
        <view class="g-card-all" @click="goOrders('')"><text>全部订单 ›</text></view>
      </view>
      <view class="g-order-grid">
        <view class="g-order-item" @click="goOrders('')">
          <image src="/static/tpl-gold/order-1.png" mode="aspectFit" />
          <text class="g-order-label">全部</text>
          <text class="g-order-badge" v-if="totalOrders">{{ totalOrders }}</text>
        </view>
        <view class="g-order-item" @click="goOrders('pending_payment')">
          <image src="/static/tpl-gold/order-2.png" mode="aspectFit" />
          <text class="g-order-label">待付款</text>
          <text class="g-order-badge" v-if="counts.pending_payment">{{ counts.pending_payment }}</text>
        </view>
        <view class="g-order-item" @click="goOrders('pending_ship')">
          <image src="/static/tpl-gold/order-3.png" mode="aspectFit" />
          <text class="g-order-label">待发货</text>
          <text class="g-order-badge" v-if="counts.pending_ship">{{ counts.pending_ship }}</text>
        </view>
        <view class="g-order-item" @click="goOrders('pending_receive')">
          <image src="/static/tpl-gold/order-4.png" mode="aspectFit" />
          <text class="g-order-label">待收货</text>
          <text class="g-order-badge" v-if="counts.pending_receive">{{ counts.pending_receive }}</text>
        </view>
        <view class="g-order-item" @click="goOrders('completed')">
          <image src="/static/tpl-gold/order-5.png" mode="aspectFit" />
          <text class="g-order-label">已完成</text>
        </view>
      </view>
    </view>

    <view class="g-mine-card g-card-key-panel">
      <view class="g-card-title"><text class="g-card-title-text">卡密服务</text></view>
      <view class="g-card-key-actions">
        <view class="g-key-action" @click="goTo('/m/activate')">
          <image src="/static/tpl-gold/feature-3.png" mode="aspectFit" />
          <view class="g-key-info"><text class="g-key-title">卡密激活</text><text class="g-key-desc">输入卡密，立即激活权益</text>
          </view>
          <text class="g-key-arrow">›</text>
        </view>
        <view class="g-key-action" @click="goTo('/m/cards')">
          <image src="/static/tpl-gold/feature-3.png" mode="aspectFit" />
          <view class="g-key-info"><text class="g-key-title">我的卡密</text><text class="g-key-desc">查看卡密与使用状态</text></view>
          <text class="g-key-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="g-mine-card g-feature-card">
      <view class="g-card-title"><text class="g-card-title-text">常用功能</text></view>
      <view class="g-feature-grid">
        <view class="g-feature-item" @click="goTo('/m/contacts')">
          <image src="/static/tpl-gold/feature-4.png" mode="aspectFit" /><text>联系客服</text>
        </view>
        <view class="g-feature-item" @click="goTo('/m/payments')">
          <image src="/static/tpl-gold/feature-1.png" mode="aspectFit" /><text>支付记录</text>
        </view>
        <view class="g-feature-item" @click="goTo('/m/addresses')">
          <image src="/static/tpl-gold/feature-5.png" mode="aspectFit" /><text>地址管理</text>
        </view>
        <view class="g-feature-item" @click="goTo('/m/privacy')">
          <image src="/static/tpl-gold/feature-7.png" mode="aspectFit" /><text>隐私协议</text>
        </view>
        <view class="g-feature-item" @click="goTo('/m/agent-workbench')">
          <image src="/static/tpl-gold/feature-2.png" mode="aspectFit" /><text>代理工作台</text>
        </view>
        <view class="g-feature-item" @click="goTo('/m/referrals')">
          <image src="/static/tpl-gold/feature-6.png" mode="aspectFit" /><text>我的推荐</text>
        </view>
      </view>
    </view>

    <view class="g-invite-banner" @click="goTo('/m/share')">
      <view class="g-invite-copy">
        <text class="g-invite-title">邀请好友 一起带货</text>
        <text class="g-invite-btn">立即邀请 ›</text>
      </view>
      <image src="/static/tpl-gold/invite-banner.png" mode="aspectFit" />
    </view>
  </view>

  <!-- ===== 紫色模板（模板1）个人中心 ===== -->
  <view v-else class="profile-page">
    <view class="page-header">
      <text class="eyebrow">账户与服务</text>
      <text class="page-title">个人中心</text>
    </view>

    <view class="profile-card">
      <view class="profile-top">
        <view class="avatar"><text class="avatar-text">{{ profile.nickname ? profile.nickname[0] : 'U' }}</text></view>
        <view class="profile-name">
          <view class="name-row">
            <text class="name-text">{{ profile.nickname || '用户' }}</text>
            <text class="benefit-tag">权益·{{ profile.benefit_level || '普通' }}</text>
          </view>
          <text class="phone-text">{{ profile.phone || '未登录' }}</text>
        </view>
        <text class="identity">{{ roleLabel }}</text>
      </view>
      <view class="profile-stats">
        <view class="stat-item">
          <text class="stat-label">ID</text>
          <text class="stat-value">{{ profile.display_id || '-' }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">推荐人ID</text>
          <text class="stat-value">{{ profile.referrer_display_id || '无' }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-label">所属代理ID</text>
          <text class="stat-value">{{ profile.agent_display_id || '无' }}</text>
        </view>
        <view class="stat-item stat-clickable" @click="goTo('/m/compute')">
          <text class="stat-label">算力余额</text>
          <text class="stat-value">{{ profile.compute_balance?.toLocaleString() || 0 }}</text>
        </view>
        <view class="stat-item stat-clickable" @click="goTo('/m/balance')">
          <text class="stat-label">资金余额</text>
          <text class="stat-value">¥{{ (profile.balance || 0).toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <view class="order-card">
      <view class="card-title-row">
        <text class="card-title">我的订单</text>
        <view class="card-all-btn" @click="goOrders('')"><text>全部</text>
          <image class="ui-icon" src="/static/icons/common/chevron-purple.png" mode="aspectFit" />
        </view>
      </view>
      <view class="order-grid">
        <view class="order-btn" @click="goOrders('pending_payment')">
          <view class="order-icon-box">
            <image class="ui-icon" src="/static/icons/common/wallet.png" mode="aspectFit" /><text class="order-badge"
              v-if="counts.pending_payment">{{ counts.pending_payment }}</text>
          </view>
          <text class="order-label">待付款</text>
        </view>
        <view class="order-btn" @click="goOrders('pending_ship')">
          <view class="order-icon-box">
            <image class="ui-icon" src="/static/icons/common/box.png" mode="aspectFit" /><text class="order-badge"
              v-if="counts.pending_ship">{{ counts.pending_ship }}</text>
          </view>
          <text class="order-label">待发货</text>
        </view>
        <view class="order-btn" @click="goOrders('pending_receive')">
          <view class="order-icon-box">
            <image class="ui-icon" src="/static/icons/common/truck.png" mode="aspectFit" /><text class="order-badge"
              v-if="counts.pending_receive">{{ counts.pending_receive }}</text>
          </view>
          <text class="order-label">待收货</text>
        </view>
        <view class="order-btn" @click="goOrders('completed')">
          <view class="order-icon-box">
            <image class="ui-icon" src="/static/icons/common/check.png" mode="aspectFit" /><text
              class="order-badge done" v-if="counts.completed">{{ counts.completed }}</text>
          </view>
          <text class="order-label">已完成</text>
        </view>
      </view>
    </view>

    <view class="menu-group">
      <text class="menu-group-title">卡密服务</text>
      <view class="menu-row" @click="goTo('/m/activate')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/common/key.png" mode="aspectFit" />
        </view>
        <text class="menu-label">卡密激活</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-row" @click="goTo('/m/cards')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/common/card.png" mode="aspectFit" />
        </view>
        <text class="menu-label">我的卡密</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
    </view>

    <view class="menu-group">
      <text class="menu-group-title">账户服务</text>
      <view class="menu-row" @click="goTo('/m/contacts')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/common/service.png" mode="aspectFit" />
        </view>
        <text class="menu-label">联系客服</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-row" @click="goTo('/m/payments')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/common/news-empty.png" mode="aspectFit" />
        </view>
        <text class="menu-label">支付记录</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-row" @click="goTo('/m/addresses')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/common/location.png" mode="aspectFit" />
        </view>
        <text class="menu-label">地址管理</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-row" @click="goTo('/m/privacy')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/common/shield.png" mode="aspectFit" />
        </view>
        <text class="menu-label">隐私协议</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
    </view>

    <view class="menu-group">
      <text class="menu-group-title">推广业务</text>
      <view class="menu-row" @click="goTo('/m/agent-workbench')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/auth/institution.png" mode="aspectFit" />
        </view>
        <text class="menu-label">代理工作台</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-row" @click="goTo('/m/referrals')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/common/share.png" mode="aspectFit" />
        </view>
        <text class="menu-label">我的推荐</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
      <view class="menu-row" @click="goTo('/m/share')">
        <view class="menu-icon">
          <image class="ui-icon" src="/static/icons/common/share.png" mode="aspectFit" />
        </view>
        <text class="menu-label">分享好友</text>
        <image class="ui-icon menu-arrow" src="/static/icons/common/chevron.png" mode="aspectFit" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { getUserProfile, getMyMallOrders } from '@/api/miniapp'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'
import { navigator } from '@/utils'

const profile = ref<any>({})
const { isGoldTemplate, loadTemplateVariant } = useMiniappTemplate()

const profileAvatar = computed(() => profile.value.avatar_url || '/static/tpl-gold/avatar.png')
const totalOrders = computed(() =>
  counts.pending_payment + counts.pending_ship + counts.pending_receive + counts.completed
)

const counts = reactive({
  pending_payment: 0,
  pending_ship: 0,
  pending_receive: 0,
  completed: 0,
})

const roleLabel = computed(() => {
  return profile.value.is_leader ? '销售代理' : '普通用户'
})

function goTo(path: string) {
  navigator.push(path)
}

function goOrders(status: string) {
  navigator.push(status ? `/m/orders?status=${status}` : '/m/orders')
}

async function loadOrderCounts() {
  try {
    const res: any = await getMyMallOrders()
    const c = res?.data?.counts || {}
    counts.pending_payment = c.pending_payment || 0
    counts.pending_ship = c.pending_ship || 0
    counts.pending_receive = c.pending_receive || 0
    counts.completed = c.completed || 0
  } catch {
    // 未登录或加载失败
  }
}

onMounted(async () => {
  loadTemplateVariant()
  try {
    const res = await getUserProfile()
    profile.value = res.data
  } catch (e) {
    // 未登录时使用默认值
  }
  loadOrderCounts()
})
</script>

<style scoped lang="scss">
/* ===== 紫色模板 ===== */
.profile-page {
  padding: 12px 18px 0;
}

.ui-icon {
  display: block;
  flex: 0 0 auto;
}

.page-header {
  padding: 18px 2px 12px;
}

.eyebrow {
  display: block;
  color: #6658f5;
  font-size: 11px;
  font-weight: 800;
  margin-bottom: 5px;
}

.page-title {
  display: block;
  font-size: 29px;
  line-height: 1.15;
  color: #202a42;
  font-weight: 800;
}

.profile-card {
  border-radius: 26px;
  padding: 19px;
  color: #fff;
  background: linear-gradient(135deg, #594cf1, #7665f6 56%, #8f7cf8);
  box-shadow: 0 18px 42px rgba(102, 88, 245, 0.24);
  position: relative;
  overflow: hidden;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 2;
}

.avatar {
  width: 54px;
  height: 54px;
  border-radius: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.16);
  flex-shrink: 0;
}

.avatar-text {
  font-size: 25px;
  font-weight: 900;
  color: #fff;
}

.profile-name {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.name-text {
  font-size: 18px;
  color: #fff;
  font-weight: 700;
}

.benefit-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.phone-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.84);
}

.identity {
  padding: 6px 11px;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  font-size: 10px;
  flex-shrink: 0;
  color: #fff;
}

.profile-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
  position: relative;
  z-index: 2;
}

.stat-item {
  width: calc(50% - 5px);
  padding: 11px 12px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.13);
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-clickable {}

.stat-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.78);
}

.stat-value {
  font-size: 17px;
  color: #fff;
  font-weight: 700;
}

.order-card {
  margin-top: 14px;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #e5eaf4;
  box-shadow: 0 8px 24px rgba(57, 70, 112, 0.07);
  padding: 15px;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 16px;
  color: #202a42;
  font-weight: 700;
}

.card-all-btn {
  display: flex;
  align-items: center;
  color: #6658f5;
  font-size: 11px;
}

.card-all-btn .ui-icon {
  width: 13px;
  height: 13px;
  margin-left: 2px;
}

.order-grid {
  display: flex;
  gap: 6px;
  margin-top: 16px;
}

.order-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  position: relative;
  padding: 4px 0;
}

.order-icon-box {
  width: 42px;
  height: 42px;
  border-radius: 15px;
  background: #f5f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.order-icon-box .ui-icon {
  width: 22px;
  height: 22px;
}

.order-label {
  font-size: 11px;
  color: #202a42;
}

.order-badge {
  position: absolute;
  right: -4px;
  top: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #ff5359;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  z-index: 2;
}

.order-badge.done {
  background: #32b67a;
}

.menu-group {
  margin-top: 14px;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #e5eaf4;
  box-shadow: 0 8px 24px rgba(57, 70, 112, 0.07);
  overflow: hidden;
  padding-top: 10px;
  padding-bottom: 4px;
}

.menu-group-title {
  display: block;
  font-size: 11px;
  color: #9aa4b8;
  padding: 0 15px 8px;
}

.menu-row {
  width: 100%;
  min-height: 56px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #202a42;
  position: relative;
  border-top: 1px solid #f0f3f8;
}

.menu-row:first-of-type {
  border-top: 0;
}

.menu-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #f5f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.menu-icon .ui-icon {
  width: 18px;
  height: 18px;
}

.menu-label {
  font-size: 13px;
  font-weight: 600;
  flex: 1;
  color: #202a42;
}

.menu-arrow {
  width: 16px;
  height: 16px;
}

/* ===== 金色模板 F-5 ===== */
.gold-profile {
  padding: 0 15px 30px;
  background: #fffaf2;
}

.g-page-title {
  display: block;
  margin-bottom: 14px;
  font-size: 22px;
  font-weight: 800;
  color: #15171b;
  padding-top: 14px;
}

.g-profile-card {
  border: 1px solid #f4d16e;
  border-radius: 15px;
  background: radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.72), transparent 22%), linear-gradient(120deg, #fff9df, #ffe58b);
  box-shadow: 0 4px 12px rgba(255, 184, 34, 0.1);
  padding: 14px;
}

.g-avatar {
  width: 59px;
  height: 59px;
  border: 3px solid #fff;
  border-radius: 50%;
}

.g-profile-main {
  padding-left: 10px;
  margin-top: 10px;
}

.g-profile-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.g-profile-name {
  font-size: 16px;
  color: #15171b;
  font-weight: 700;
}

.g-benefit-badge {
  padding: 2px 6px;
  border-radius: 7px;
  font-size: 10px;
  color: #ffe098;
  background: linear-gradient(90deg, #3b1f08, #72501b);
  font-weight: 700;
}

.g-agent-badge {
  padding: 2px 6px;
  border-radius: 7px;
  font-size: 10px;
  border: 1px solid #f2ac28;
  color: #a85c00;
  background: #fff3cf;
  font-weight: 700;
}

.g-profile-phone {
  display: block;
  margin-top: 7px;
  color: #666;
  font-size: 12px;
}

.g-profile-stats {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
}

.g-stat-item {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 10px 0;
  box-sizing: border-box;
  border-right: 1px solid rgba(255, 184, 0, 0.25);
  border-bottom: 1px solid rgba(255, 184, 0, 0.25);
  transition: all 0.2s ease;
}

/* 第三项（所属代理ID）右边框清除 */
.g-stat-item:nth-child(3) {
  border-right: 0;
}

/* 第4、5项（资金余额、算力余额）各占50% */
.g-stat-item:nth-child(4),
.g-stat-item:nth-child(5) {
  width: 50%;
}

/* 第四项（资金余额）右边框保留 */
.g-stat-item:nth-child(4) {
  border-right: 1px solid rgba(255, 184, 0, 0.25);
}

/* 第五项（算力余额）右边框清除 */
.g-stat-item:nth-child(5) {
  border-right: 0;
}

/* 可点击项样式 - 更显眼 */
.g-stat-clickable {
  cursor: pointer;
  background: linear-gradient(135deg, rgba(255, 184, 0, 0.05) 0%, rgba(255, 200, 50, 0.08) 100%);
  position: relative;
}

.g-stat-clickable:active {
  background: linear-gradient(135deg, rgba(255, 184, 0, 0.15) 0%, rgba(255, 200, 50, 0.18) 100%);
  transform: scale(0.98);
}

/* 可点击项的数字更突出 */
.g-stat-clickable .g-stat-num {
  color: #ff9500;
  text-shadow: 0 1px 2px rgba(255, 149, 0, 0.3);
}

/* 可点击项的标签更突出 */
.g-stat-clickable .g-stat-label {
  color: #ff9500;
  font-weight: 600;
}

/* 添加提示图标 */
.g-stat-clickable::after {
  content: '›';
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #ffb400;
  font-weight: bold;
  opacity: 0.6;
}

.g-stat-num {
  font-size: 14px;
  color: #15171b;
  font-weight: 700;
}

.g-stat-label {
  font-size: 11px;
  color: #858a93;
}

.g-mine-card {
  margin-top: 9px;
  padding: 9px 14px 10px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f0eee9;
  box-shadow: 0 4px 12px rgba(118, 94, 51, 0.06);
}

.g-card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.g-card-title-text {
  font-size: 14px;
  color: #15171b;
  font-weight: 700;
}

.g-card-all {
  color: #6c7078;
  font-size: 11px;
}

.g-order-grid {
  display: flex;
  margin-top: 10px;
}

.g-order-item {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.g-order-item image {
  width: 30px;
  height: 30px;
}

.g-order-label {
  font-size: 11px;
  color: #15171b;
}

.g-order-badge {
  position: absolute;
  top: -2px;
  right: 6px;
  min-width: 11px;
  height: 11px;
  padding: 0 3px;
  border-radius: 99px;
  color: #fff;
  background: #ffb400;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.g-card-key-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.g-key-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #f2d995;
  border-radius: 12px;
  background: linear-gradient(120deg, #fffdf7, #fff7dd);
  transition: all 0.2s ease;
}

.g-key-action:active {
  transform: scale(0.98);
  background: linear-gradient(120deg, #fff9e8, #fff3cc);
}

.g-key-action image {
  width: 32px;
  height: 32px;
}

.g-key-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.g-key-title {
  font-size: 15px;
  color: #15171b;
  font-weight: 700;
}

.g-key-desc {
  font-size: 12px;
  color: #8a8174;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.g-key-arrow {
  color: #e7a400;
  font-size: 20px;
  font-weight: bold;
  opacity: 0.6;
}

.g-feature-grid {
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
}

.g-feature-item {
  width: 33.33%;
  min-height: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-right: 1px dashed #ece9e4;
  border-bottom: 1px dashed #ece9e4;
  padding: 12px 8px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.g-feature-item:active {
  background: rgba(255, 184, 0, 0.05);
}

.g-feature-item:nth-child(3n) {
  border-right: 0;
}

.g-feature-item:nth-last-child(-n + 3) {
  border-bottom: 0;
}

.g-feature-item image {
  width: 32px;
  height: 32px;
}

.g-feature-item text {
  font-size: 12px;
  color: #15171b;
}

.g-invite-banner {
  position: relative;
  // width: 100%;
  min-height: 80px;
  display: flex;
  align-items: center;
  overflow: hidden;
  margin-top: 9px;
  padding: 10px 15px;
  border: 1px solid #f5d67d;
  border-radius: 12px;
  background: linear-gradient(115deg, #fff5c8 0%, #ffe080 56%, #ffd45f 100%);
}

.g-invite-copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.g-invite-title {
  color: #3b2808;
  font-size: 15px;
  font-weight: 700;
}

.g-invite-btn {
  padding: 4px 9px;
  border-radius: 11px;
  color: #fff;
  background: linear-gradient(90deg, #ffb600, #ff9700);
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
}

.g-invite-banner>image {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  width: 130px;
  height: 65px;
}
</style>
