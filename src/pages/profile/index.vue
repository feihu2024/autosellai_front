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
          <text v-if="profile.benefit_level" class="g-benefit-badge">{{ profile.is_leader ? '代理' : '普通' }}</text>
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
        <view class="g-feature-item" v-if="isAgent" @click="goTo('/m/agent-workbench')">
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

  <!-- ===== 紫色模板（模板1）个人中心 - 重构为 profile.vue 风格 ===== -->
  <view v-else class="profile-page">
    <!-- 身份卡片 -->
    <view class="identity-card">
      <view class="profile-main">
        <image class="avatar" :src="profile.avatar_url || '/static/images/robot.png'" mode="aspectFill" />
        <view class="profile-copy">
          <view class="nickname">{{ profile.nickname || '用户' }}</view>
          <view class="meta-row">
            <view class="user-id">ID · {{ profile.display_id || '未设置' }}</view>
            <view class="badges"><text>{{ profile.benefit_level }}</text></view>
          </view>
        </view>
        <!-- <view class="setting" @click="goTo('/m/profile-edit')">›</view> -->
      </view>

      <view class="relation-card">
        <image src="/static/images/robot.png" mode="aspectFill" />
        <view class="relation-name">
          <text>所属代理</text>
          <view>代理ID：{{ profile.agent_display_id || '无' }}</view>
        </view>
        <view class="relation-ids">
          <text>推荐人 ID：{{ profile.referrer_display_id || '无' }}</text>
          <text>所属代理 ID：{{ profile.agent_display_id || '无' }}</text>
        </view>
      </view>

      <view class="asset-row">
        <view @click="goTo('/m/compute')">
          <text>{{ profile.compute_balance?.toLocaleString() || 0 }}</text>
          <view>算力余额</view>
        </view>
        <view @click="goTo('/m/balance')">
          <text>¥ {{ (profile.balance || 0).toFixed(2) }}</text>
          <view>资金余额</view>
        </view>
        <view @click="goTo('/m/benefit')">
          <text>{{ profile.is_leader ? '代理' : '普通' }}</text>
          <view>代理级别</view>
        </view>
      </view>
    </view>

    <!-- 邀请横幅 -->
    <view class="invite-banner" @click="goTo('/m/share')">
      <image class="invite-banner-bg"
        src="https://mlcfjihuaqn.yxiaozhu.com/saas/0115af8f240e4136ad9f49555bdb6aef.png?e=4941426146&token=8HYKX7kOi_0yI5lbCm9L15PD17ROW4bDVRCIXtCA:Ls7Vc0KT0F-8rBJLX-n7oiROnOI="
        mode="aspectFill" />
    </view>

    <!-- 我的订单 -->
    <view class="section-card surface">
      <view class="section-head">
        <text>我的订单</text>
        <text @click="goOrders('')">全部订单　›</text>
      </view>
      <view class="order-grid">
        <view @click="goOrders('')">
          <view class="service-icon blue">
            <image src="/static/images/profile-order.png" mode="aspectFit" />
            <text v-if="totalOrders">{{ totalOrders }}</text>
          </view>
          <text>我的订单</text>
        </view>
        <view @click="goOrders('pending_ship')">
          <view class="service-icon orange">
            <image src="/static/images/profile-ship.png" mode="aspectFit" />
            <text v-if="counts.pending_ship">{{ counts.pending_ship }}</text>
          </view>
          <text>待发货</text>
        </view>
        <view @click="goOrders('pending_receive')">
          <view class="service-icon green">
            <image src="/static/images/profile-receive.png" mode="aspectFit" />
            <text v-if="counts.pending_receive">{{ counts.pending_receive }}</text>
          </view>
          <text>待收货</text>
        </view>
        <view @click="goOrders('completed')">
          <view class="service-icon purple">
            <image src="/static/images/profile-complete.png" mode="aspectFit" />
          </view>
          <text>已完成</text>
        </view>
      </view>
    </view>

    <!-- 服务中心 -->
    <view class="section-card surface service-center">
      <view class="section-head"><text>服务中心</text></view>
      <view class="two-grid">
        <view @click="goTo('/m/activate')">
          <view class="wide-icon blue">
            <image src="/static/images/profile-activate.png" mode="aspectFit" />
          </view>
          <view><text>卡密激活</text><text>输入卡密兑换权益</text></view>
          <text>›</text>
        </view>
        <view @click="goTo('/m/cards')">
          <view class="wide-icon purple">
            <image src="/static/images/profile-cards.png" mode="aspectFit" />
          </view>
          <view><text>我的卡密</text><text>查看卡密与状态</text></view>
          <text>›</text>
        </view>
      </view>
      <view class="service-divider"></view>
      <view class="account-grid">
        <view @click="goTo('/m/contacts')">
          <view class="service-icon green">
            <image src="/static/images/profile-contact.png" mode="aspectFit" />
          </view>
          <text>联系客服</text>
        </view>
        <view @click="goTo('/m/payments')">
          <view class="service-icon orange">
            <image src="/static/images/profile-payment.png" mode="aspectFit" />
          </view>
          <text>支付记录</text>
        </view>
        <view @click="goTo('/m/addresses')">
          <view class="service-icon blue">
            <image src="/static/images/profile-address.png" mode="aspectFit" />
          </view>
          <text>地址管理</text>
        </view>
        <view @click="goTo('/m/privacy')">
          <view class="service-icon purple">
            <image src="/static/images/profile-privacy.png" mode="aspectFit" />
          </view>
          <text>隐私协议</text>
        </view>
      </view>
    </view>

    <!-- 业务模块 -->
    <view class="section-card surface business-section">
      <view class="section-head"><text>业务模块</text></view>
      <view class="business-list">
        <view v-if="isAgent" class="business-blue" @click="goTo('/m/agent-workbench')">
          <image src="/static/images/profile-workbench.png" mode="aspectFit" />
          <view><text>代理工作台</text><text>查看团队数据与代理收益</text></view>
          <text>›</text>
        </view>
        <view class="business-purple" @click="goTo('/m/referrals')">
          <image src="/static/images/profile-referral.png" mode="aspectFit" />
          <view><text>我的推荐</text><text>管理推荐用户与奖励记录</text></view>
          <text>›</text>
        </view>
        <view class="business-gold" @click="goTo('/m/share')">
          <image src="/static/images/profile-share.png" mode="aspectFit" />
          <view><text>分享好友</text><text>邀请好友一起解锁 AI 实战</text></view>
          <text>›</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 底部跑马灯登录条（未绑定手机号时显示） -->
  <LoginMarqueeBar />
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { getUserProfile, getMyMallOrders } from '@/api/miniapp'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'
import LoginMarqueeBar from '@/components/LoginMarqueeBar.vue'
import { navigator } from '@/utils'
import { onShow } from '@dcloudio/uni-app'

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

const isAgent = computed(() => profile.value.is_leader)

function goTo(path: string) {
  navigator.push(path)
}

function goOrders(status: string) {
  navigator.push(status ? `/m/orders/index?status=${status}` : '/m/orders/index')
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

onShow(async () => {
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
/* ===== 紫色模板（重构为 profile.vue 风格） ===== */
.profile-page {
  min-height: 100vh;
  padding: 80rpx 26rpx 150rpx;
  background: #f3f7fd;
}

/* 身份卡片 */
.identity-card {
  padding: 30rpx 28rpx 22rpx;
  overflow: hidden;
  border: 1rpx solid #e5edf7;
  border-radius: 32rpx;
  color: #20344e;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgba(46, 76, 119, 0.08);
}

.profile-main {
  display: flex;
  align-items: center;
}

.avatar {
  width: 104rpx;
  height: 104rpx;
  flex: 0 0 auto;
  border: 5rpx solid #eaf2ff;
  border-radius: 50%;
  background: #f2f7ff;
}

.profile-copy {
  flex: 1;
  min-width: 0;
  margin-left: 22rpx;
}

.nickname {
  max-width: 100%;
  overflow: hidden;
  font-size: 34rpx;
  font-weight: 800;
  line-height: 1.35;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.meta-row {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  gap: 10rpx;
  overflow: hidden;
}

.user-id {
  flex: 0 0 auto;
  padding: 4rpx 9rpx;
  border-radius: 10rpx;
  color: #8d99aa;
  background: #f4f6f9;
  font-size: 18rpx;
  line-height: 1.35;
  font-weight: 500;
  letter-spacing: 0.3rpx;
  white-space: nowrap;
}

.badges {
  flex: 0 0 auto;
}

.badges text {
  padding: 4rpx 10rpx;
  border-radius: 14rpx;
  color: #3876df;
  background: #edf4ff;
  font-size: 19rpx;
  font-weight: 650;
}

.setting {
  width: 48rpx;
  height: 50rpx;
  margin: 0;
  padding: 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 25rpx;
  color: #7e8ca0;
  background: #f5f7fa;
  font-size: 34rpx;
  line-height: 1;
}

.relation-card {
  margin-top: 22rpx;
  padding: 20rpx 0 0;
  display: flex;
  align-items: center;
  border-top: 1rpx solid #edf1f6;
}

.relation-card image {
  width: 58rpx;
  height: 58rpx;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #eef4ff;
}

.relation-name {
  width: 240rpx;
  min-width: 0;
  margin-left: 13rpx;
}

.relation-name>text {
  display: block;
  color: #98a4b5;
  font-size: 20rpx;
}

.relation-name>view {
  margin-top: 3rpx;
  overflow: hidden;
  color: #344860;
  font-size: 25rpx;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.relation-ids {
  flex: 1;
  min-width: 0;
  margin-left: 18rpx;
  padding-left: 16rpx;
  border-left: 1rpx solid #e8edf4;
}

.relation-ids text {
  display: block;
  overflow: hidden;
  color: #7f8c9e;
  font-size: 21rpx;
  line-height: 1.65;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.asset-row {
  margin-top: 22rpx;
  padding: 18rpx 4rpx;
  display: flex;
  border-radius: 20rpx;
  background: #f6f9fd;
}

.asset-row>view {
  flex: 1;
  text-align: center;
  border-right: 1rpx solid #e5ebf3;
}

.asset-row>view:last-child {
  border-right: 0;
}

.asset-row text {
  color: #253b55;
  font-size: 29rpx;
  font-weight: 800;
}

.asset-row view view {
  margin-top: 6rpx;
  color: #8b97a8;
  font-size: 21rpx;
}

/* 邀请横幅 */
.invite-banner {
  width: 100%;
  height: 190rpx;
  margin-top: 20rpx;
  padding: 0;
  position: relative;
  overflow: hidden;
  border: 0;
  border-radius: 26rpx;
  background: #1676f3;
  color: #fff;
  text-align: left;
  box-shadow: 0 14rpx 30rpx rgba(21, 92, 208, 0.23);
}

.invite-banner::after {
  border: 0;
}

.invite-banner-bg {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

/* 通用卡片 */
.section-card {
  margin-top: 22rpx;
  padding: 26rpx 24rpx;
}

.surface {
  background: #fff;
  border-radius: 26rpx;
  border: 1rpx solid #e5edf7;
  box-shadow: 0 8rpx 24rpx rgba(57, 70, 112, 0.06);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-head>text:first-child {
  color: #1d3049;
  font-size: 33rpx;
  font-weight: 800;
}

.section-head>text:last-child {
  color: #8b97a9;
  font-size: 24rpx;
}

/* 订单网格 */
.order-grid {
  margin-top: 25rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.order-grid>view {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #45566e;
  font-size: 24rpx;
}

.service-icon {
  width: 82rpx;
  height: 82rpx;
  margin-bottom: 13rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8rpx 18rpx rgba(47, 83, 132, 0.13);
}

.service-icon image {
  width: 50rpx;
  height: 50rpx;
}

.service-icon>text {
  position: absolute;
  right: -6rpx;
  top: -8rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 7rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid #fff;
  border-radius: 18rpx;
  color: #fff;
  background: #ff5a62;
  font-size: 17rpx;
}

/* 服务图标色调 */
.blue {
  background: #dceaff;
}

.orange {
  background: #ffe5c7;
}

.green {
  background: #d6f3e9;
}

.purple {
  background: #e7dcff;
}

/* 两列网格（卡密服务） */
.two-grid {
  margin-top: 22rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.two-grid>view {
  min-width: 0;
  padding: 18rpx 14rpx;
  display: flex;
  align-items: center;
  border-radius: 20rpx;
  background: #f6f9fe;
}

.wide-icon {
  width: 72rpx;
  height: 72rpx;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 19rpx;
  border: 2rpx solid #fff;
  box-shadow: 0 7rpx 16rpx rgba(47, 83, 132, 0.12);
}

.wide-icon image {
  width: 46rpx;
  height: 46rpx;
}

.two-grid>view>view:nth-child(2) {
  flex: 1;
  min-width: 0;
  margin-left: 12rpx;
}

.two-grid>view>view:nth-child(2) text {
  display: block;
}

.two-grid>view>view:nth-child(2) text:first-child {
  color: #2c405b;
  font-size: 27rpx;
  font-weight: 700;
}

.two-grid>view>view:nth-child(2) text:last-child {
  margin-top: 5rpx;
  overflow: hidden;
  color: #8a96a7;
  font-size: 20rpx;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.two-grid>view>text {
  color: #90a0b4;
  font-size: 32rpx;
}

.service-divider {
  height: 1rpx;
  margin: 24rpx 0 22rpx;
  background: #e9eef5;
}

/* 账户服务网格（四列） */
.account-grid {
  margin-top: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}

.account-grid>view {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #45566e;
  font-size: 24rpx;
}

.account-grid .service-icon {
  width: 82rpx;
  height: 82rpx;
  margin-bottom: 13rpx;
  border: 0;
  background: transparent !important;
  box-shadow: none;
}

.account-grid .service-icon image {
  width: 76rpx;
  height: 76rpx;
}

/* 业务模块列表 */
.business-list {
  margin-top: 20rpx;
}

.business-list>view {
  min-height: 112rpx;
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
  display: flex;
  align-items: center;
  border-radius: 23rpx;
}

.business-list>view>image {
  width: 72rpx;
  height: 72rpx;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 20rpx;
  background: transparent;
  box-shadow: none;
}

.business-list>view>view {
  flex: 1;
  min-width: 0;
  margin-left: 18rpx;
}

.business-list>view>view text {
  display: block;
}

.business-list>view>view text:first-child {
  color: #213750;
  font-size: 30rpx;
  font-weight: 800;
}

.business-list>view>view text:last-child {
  margin-top: 7rpx;
  color: #73839a;
  font-size: 23rpx;
}

.business-list>view>text {
  color: #6f86a4;
  font-size: 38rpx;
}

.business-blue {
  background: linear-gradient(110deg, #edf5ff, #f8fbff);
}

.business-purple {
  background: linear-gradient(110deg, #f3efff, #fbf9ff);
}

.business-gold {
  background: linear-gradient(110deg, #fef7e6, #fffcf0);
}

/* ===== 金色模板样式（原样保留） ===== */
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

.g-stat-item:nth-child(3) {
  border-right: 0;
}

.g-stat-item:nth-child(4),
.g-stat-item:nth-child(5) {
  width: 50%;
}

.g-stat-item:nth-child(4) {
  border-right: 1px solid rgba(255, 184, 0, 0.25);
}

.g-stat-item:nth-child(5) {
  border-right: 0;
}

.g-stat-clickable {
  cursor: pointer;
  background: linear-gradient(135deg, rgba(255, 184, 0, 0.05) 0%, rgba(255, 200, 50, 0.08) 100%);
  position: relative;
}

.g-stat-clickable:active {
  background: linear-gradient(135deg, rgba(255, 184, 0, 0.15) 0%, rgba(255, 200, 50, 0.18) 100%);
  transform: scale(0.98);
}

.g-stat-clickable .g-stat-num {
  color: #ff9500;
  text-shadow: 0 1px 2px rgba(255, 149, 0, 0.3);
}

.g-stat-clickable .g-stat-label {
  color: #ff9500;
  font-weight: 600;
}

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