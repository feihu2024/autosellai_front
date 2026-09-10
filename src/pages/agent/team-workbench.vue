<template>
  <view class="page">
    <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header-inner">
        <view class="header-btn" @click="goBack">
          <text class="header-btn-icon">‹</text>
        </view>
        <text class="header-title">团队管理</text>
        <view class="header-btn" @click="toggleSearch">
          <text class="header-search-icon">⌕</text>
        </view>
      </view>
    </view>

    <view v-if="isSearching" class="search-bar">
      <text class="search-prefix">⌕</text>
      <input class="search-input" v-model="searchQuery" type="text" confirm-type="search"
        placeholder="搜索成员姓名、手机号或ID..." />
      <view v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
        <text>×</text>
      </view>
    </view>

    <!-- 个人信息 -->
    <view class="hero">
      <view class="hero-glow"></view>
      <view class="hero-row">
        <view class="hero-avatar-wrap">
          <view class="hero-avatar">
            <image v-if="currentUser.avatarUrl" class="hero-avatar-img" :src="currentUser.avatarUrl"
              mode="aspectFill" />
            <text v-else>{{ currentUser.avatar }}</text>
          </view>
          <view class="hero-crown">
            <text>♛</text>
          </view>
        </view>
        <view class="hero-meta">
          <view class="hero-name-row">
            <text class="hero-name">{{ currentUser.name }}</text>
            <view class="hero-level">
              <view class="hero-level-dot"></view>
              <text>{{ currentUser.level }}</text>
            </view>
          </view>
          <view class="hero-sub">
            <view class="hero-id" @click="copyText(currentUser.id, 'ID')">
              <text>ID: {{ currentUser.id }}</text>
              <text class="hero-copy">复制</text>
            </view>
            <view class="hero-phone">
              <text>{{ currentUser.phone }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 成长阶段 -->
    <view class="card">
      <view class="card-head">
        <view class="card-head-left">
          <view class="card-bar"></view>
          <text class="card-title">成长阶段</text>
        </view>
        <view class="card-rule" @click="showToast('成长值规则：推荐新成员或完成月度业绩目标')">
          <text>规则说明</text>
        </view>
      </view>
      <view class="growth-box">
        <view class="growth-row">
          <view class="growth-now">
            <text class="growth-label">当前身份:</text>
            <text class="growth-level">{{ currentUser.level }}</text>
          </view>
          <view class="growth-next">
            <text>距离 </text>
            <text class="growth-next-name">{{ currentUser.nextLevel }}</text>
            <text> 还差 </text>
            <text class="growth-need">{{ currentUser.neededVal }}</text>
            <text> 成长值</text>
          </view>
        </view>
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: growthPercentage + '%' }"></view>
        </view>
      </view>
    </view>

    <!-- 基础数据 -->
    <view class="card">
      <view class="card-head">
        <view class="card-head-left">
          <view class="card-bar"></view>
          <text class="card-title">基础数据</text>
        </view>
      </view>
      <view class="metric-grid">
        <view class="metric metric-blue">
          <view class="metric-top">
            <text>直推人数</text>
            <view class="metric-icon metric-icon-blue"><text>+</text></view>
          </view>
          <view class="metric-num-row">
            <text class="metric-num">{{ metrics.directCount }}</text>
            <text class="metric-unit">人</text>
          </view>
        </view>
        <view class="metric metric-indigo">
          <view class="metric-top">
            <text>团队总人数</text>
            <view class="metric-icon metric-icon-indigo"><text>人</text></view>
          </view>
          <view class="metric-num-row">
            <text class="metric-num">{{ metrics.teamCount }}</text>
            <text class="metric-unit">人</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 筛选 + 成员列表 -->
    <view class="tab-grid">
      <view v-for="tab in tabs" :key="tab.id ?? 'all'" class="tab-btn" :class="{ active: isTabActive(tab) }"
        @click="activeTabId = tab.id">
        <image v-if="tab.badge_url" class="tab-badge" :src="tab.badge_url" mode="aspectFit" />
        <text>{{ tab.name }}</text>
        <text class="tab-count">{{ tab.count }}</text>
      </view>
    </view>

    <view class="member-list">
      <view v-for="member in filteredMembers" :key="member.id" class="member-card">
        <view class="member-avatar" :class="'avatar-' + member.theme">
          <image v-if="member.avatarUrl" class="member-avatar-img" :src="member.avatarUrl" mode="aspectFill" />
          <text v-else>{{ member.avatar }}</text>
        </view>
        <view class="member-main">
          <view class="member-name-row">
            <text class="member-name">{{ member.name }}</text>
            <text class="member-badge" :class="'badge-' + member.theme">{{ member.level }}</text>
          </view>
          <view class="member-sub">
            <text>ID:{{ member.displayId }}</text>
            <text class="member-dot">•</text>
            <text>{{ member.phone }}</text>
          </view>
        </view>
        <view class="member-progress">
          <view class="member-progress-label">
            <text>{{ member.nextLevel || member.level }} </text>
            <text class="member-progress-val">{{ member.progress }}%</text>
          </view>
          <view class="mini-track">
            <view class="mini-fill" :style="{ width: member.progress + '%' }"></view>
          </view>
        </view>
      </view>

      <view v-if="filteredMembers.length === 0" class="empty">
        <view class="empty-icon"><text>—</text></view>
        <text>暂无匹配的团队成员</text>
      </view>
    </view>

    <!-- 成员详情抽屉（暂时关闭点击弹窗）
    <view v-if="selectedMember" class="drawer-mask" @click="closeMemberDetail" @touchmove.stop.prevent>
      <view class="drawer" @click.stop>
        <view class="drawer-handle"></view>
        <view class="drawer-head">
          <view class="drawer-user">
            <view class="drawer-avatar">
              <image v-if="selectedMember.avatarUrl" class="drawer-avatar-img" :src="selectedMember.avatarUrl" mode="aspectFill" />
              <text v-else>{{ selectedMember.avatar }}</text>
            </view>
            <view>
              <text class="drawer-name">{{ selectedMember.name }}</text>
              <text class="drawer-desc">ID: {{ selectedMember.displayId }} | 手机号: {{ selectedMember.phone }}</text>
            </view>
          </view>
          <view class="drawer-close" @click="closeMemberDetail"><text>×</text></view>
        </view>
        <view class="drawer-stats">
          <view class="drawer-stat">
            <text class="drawer-stat-label">当前等级</text>
            <text class="drawer-stat-val">{{ selectedMember.level }}</text>
          </view>
          <view class="drawer-stat">
            <text class="drawer-stat-label">升级进度</text>
            <text class="drawer-stat-val drawer-stat-blue">{{ selectedMember.progress }}%</text>
          </view>
        </view>
        <view class="drawer-actions">
          <view class="drawer-btn ghost" @click="callPhone(selectedMember.phone)">
            <text>拨打电话</text>
          </view>
          <view class="drawer-btn primary" @click="showToast('团队转交与升级提醒已发送')">
            <text>发送通知</text>
          </view>
        </view>
      </view>
    </view>
    -->
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getIdentityTeam } from '@/api/miniapp'
import { navigator } from '@/utils'

type Member = {
  id: string
  displayId: string
  name: string
  level: string
  identityId: number | null
  phone: string
  progress: number
  avatar: string
  avatarUrl: string
  theme: string
  nextLevel: string
}

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20

type IdentityTab = {
  id: number | null
  name: string
  count: number
  badge_url: string
}

const isSearching = ref(false)
const searchQuery = ref('')
const activeTabId = ref<number | null>(null)
// const selectedMember = ref<Member | null>(null)

const currentUser = ref({
  avatarUrl: '',
  avatar: '',
  name: '',
  level: '',
  id: '',
  phone: '',
  neededVal: 0,
  nextLevel: '',
})

const growthPercentage = ref(0)

const metrics = ref({
  directCount: 0,
  teamCount: 0,
})

const tabs = ref<IdentityTab[]>([])

const members = ref<Member[]>([])

const filteredMembers = computed(() => {
  const currentTab = tabs.value.find((tab) => tab.id === activeTabId.value)
  return members.value.filter((m) => {
    const matchesTab =
      !currentTab ||
      currentTab.id == null ||
      m.identityId === currentTab.id ||
      m.level === currentTab.name
    const query = searchQuery.value.trim().toLowerCase()
    const matchesSearch =
      !query ||
      m.name.toLowerCase().includes(query) ||
      m.displayId.includes(query) ||
      m.phone.includes(query)
    return matchesTab && matchesSearch
  })
})

function isTabActive(tab: IdentityTab) {
  return tab.id === activeTabId.value
}

function toggleSearch() {
  isSearching.value = !isSearching.value
  if (!isSearching.value) searchQuery.value = ''
}

// function openMemberDetail(member: Member) {
//   selectedMember.value = member
// }

// function closeMemberDetail() {
//   selectedMember.value = null
// }

function goBack() {
  navigator.back()
}

function showToast(message: string) {
  uni.showToast({ title: message, icon: 'none', duration: 2200 })
}

function copyText(text: string, label: string) {
  uni.setClipboardData({
    data: String(text),
    success: () => showToast(`${label}已成功复制: ${text}`),
  })
}

function calcProgress(item: any) {
  const targetVal = Number(item?.target?.target || 0)
  const progressVal = Number(item?.target_progress || 0)
  const neededVal = Math.max(0, targetVal - progressVal)
  const percent = targetVal > 0
    ? Math.min(100, Math.round((progressVal / targetVal) * 100))
    : (item?.target_reached ? 100 : 0)
  return { neededVal, percent }
}

function identityTheme(name: string) {
  if (name.includes('省')) return 'rose'
  if (name.includes('市')) return 'purple'
  if (name.includes('区')) return 'blue'
  if (name.includes('大队长')) return 'emerald'
  if (name.includes('队长')) return 'amber'
  return 'blue'
}

function mapMember(item: any): Member {
  const nickname = item?.nickname || '用户'
  const { percent } = calcProgress(item)
  const level = item?.second_identity_name || item?.benefit_level || ''
  return {
    id: String(item?.id ?? ''),
    displayId: String(item?.display_id ?? item?.id ?? ''),
    name: nickname,
    level,
    identityId: item?.second_identity_id ?? null,
    phone: item?.phone || '',
    progress: percent,
    avatar: nickname.slice(0, 1),
    avatarUrl: item?.avatar || '',
    theme: identityTheme(level),
    nextLevel: item?.target?.level_name || '',
  }
}

function applyRoot(root: any) {
  const nickname = root?.nickname || '用户'
  const { neededVal, percent } = calcProgress(root)

  currentUser.value = {
    avatarUrl: root?.avatar || '',
    avatar: nickname.slice(0, 1),
    name: nickname,
    level: root?.second_identity_name || '',
    id: String(root?.display_id ?? root?.id ?? ''),
    phone: root?.phone || '',
    neededVal,
    nextLevel: root?.target?.level_name || '',
  }
  growthPercentage.value = percent
  metrics.value = {
    directCount: Number(root?.direct_referral_count || 0),
    teamCount: Number(root?.team_total_count || 0),
  }
}

function applyList(list: any[]) {
  members.value = Array.isArray(list) ? list.map(mapMember) : []
}

// function callPhone(phone: string) {
//   if (!phone) {
//     showToast('暂无手机号')
//     return
//   }
//   uni.makePhoneCall({
//     phoneNumber: phone,
//     fail: () => showToast(`正在发起拨号: ${phone}`),
//   })
// }

onLoad(async () => {
  try {
    const res = await getIdentityTeam()
    applyRoot(res?.data?.root)
    tabs.value = Array.isArray(res?.data?.tabs) ? res.data.tabs : []
    activeTabId.value = tabs.value[0]?.id ?? null
    applyList(res?.data?.list)
  } catch (e) {
    console.error('[identity-tean] request failed', e)
  }
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 0 32rpx 64rpx;
  background: #f8fafc;
  color: #334155;
}

.header {
  position: sticky;
  top: 0;
  z-index: 30;
  margin: 0 -32rpx;
  padding-left: 32rpx;
  padding-right: 32rpx;
  background: rgba(248, 250, 252, 0.92);
  border-bottom: 1rpx solid #f1f5f9;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88rpx;
  padding: 12rpx 0 20rpx;
}

.header-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-btn:active {
  background: rgba(226, 232, 240, 0.6);
}

.header-btn-icon {
  color: #334155;
  font-size: 44rpx;
  line-height: 1;
}

.header-search-icon {
  color: #475569;
  font-size: 36rpx;
  line-height: 1;
}

.header-title {
  color: #1e293b;
  font-size: 32rpx;
  font-weight: 700;
}

.search-bar {
  margin-top: 16rpx;
  margin-bottom: 8rpx;
  padding: 16rpx 20rpx;
  display: flex;
  align-items: center;
  border: 1rpx solid rgba(226, 232, 240, 0.9);
  border-radius: 32rpx;
  background: #fff;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
}

.search-prefix {
  margin-right: 12rpx;
  color: #94a3b8;
  font-size: 28rpx;
}

.search-input {
  flex: 1;
  color: #1e293b;
  font-size: 24rpx;
}

.search-clear {
  padding: 0 8rpx;
  color: #94a3b8;
  font-size: 32rpx;
}

.hero {
  position: relative;
  overflow: hidden;
  margin-top: 24rpx;
  padding: 40rpx;
  border-radius: 48rpx;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #4f46e5 100%);
  box-shadow: 0 16rpx 50rpx -10rpx rgba(37, 99, 235, 0.25);
}

.hero-glow {
  position: absolute;
  right: -48rpx;
  bottom: -48rpx;
  width: 256rpx;
  height: 256rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  pointer-events: none;
}

.hero-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
}

.hero-avatar-wrap {
  position: relative;
  margin-right: 32rpx;
  flex-shrink: 0;
}

.hero-avatar {
  width: 128rpx;
  height: 128rpx;
  overflow: hidden;
  border: 2rpx solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to top right, rgba(244, 114, 182, 0.7), rgba(253, 164, 175, 0.55));
}

.hero-avatar-img {
  width: 100%;
  height: 100%;
}

.hero-avatar text {
  color: #fff;
  font-size: 48rpx;
  font-weight: 800;
}

.hero-crown {
  position: absolute;
  right: -4rpx;
  bottom: -4rpx;
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 8rpx;
  border: 4rpx solid #2563eb;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fbbf24;
}

.hero-crown text {
  color: #0f172a;
  font-size: 18rpx;
  line-height: 1;
}

.hero-meta {
  flex: 1;
  min-width: 0;
}

.hero-name-row {
  display: flex;
  align-items: center;
}

.hero-name {
  max-width: 280rpx;
  margin-right: 16rpx;
  overflow: hidden;
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.hero-level {
  padding: 4rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
}

.hero-level-dot {
  width: 12rpx;
  height: 12rpx;
  margin-right: 8rpx;
  border-radius: 50%;
  background: #34d399;
}

.hero-level text {
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
}

.hero-sub {
  margin-top: 16rpx;
  display: flex;
  flex-wrap: wrap;
}

.hero-id,
.hero-phone {
  margin-right: 16rpx;
  margin-bottom: 8rpx;
  display: flex;
  align-items: center;
  color: rgba(219, 234, 254, 0.92);
  font-size: 24rpx;
  font-weight: 500;
}

.hero-id {
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
  background: rgba(0, 0, 0, 0.12);
}

.hero-copy {
  margin-left: 8rpx;
  font-size: 20rpx;
  opacity: 0.75;
}

.card {
  margin-top: 24rpx;
  padding: 32rpx;
  border: 1rpx solid rgba(241, 245, 249, 0.9);
  border-radius: 48rpx;
  background: #fff;
  box-shadow: 0 8rpx 40rpx -4rpx rgba(0, 0, 0, 0.05);
}

.card-head {
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-head-left {
  display: flex;
  align-items: center;
}

.card-bar {
  width: 12rpx;
  height: 32rpx;
  margin-right: 16rpx;
  border-radius: 999rpx;
  background: #2563eb;
}

.card-title {
  color: #1e293b;
  font-size: 28rpx;
  font-weight: 700;
}

.card-rule {
  color: #94a3b8;
  font-size: 24rpx;
}

.growth-box {
  padding: 28rpx;
  border: 1rpx solid rgba(241, 245, 249, 0.9);
  border-radius: 32rpx;
  background: #f8fafc;
}

.growth-row {
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}

.growth-now {
  display: flex;
  align-items: center;
}

.growth-label {
  color: #64748b;
  font-size: 24rpx;
}

.growth-level {
  margin-left: 8rpx;
  color: #2563eb;
  font-size: 28rpx;
  font-weight: 700;
}

.growth-next {
  color: #475569;
  font-size: 24rpx;
  font-weight: 500;
}

.growth-next-name {
  color: #4f46e5;
  font-weight: 700;
}

.growth-need {
  margin: 0 6rpx;
  padding: 4rpx 12rpx;
  border: 1rpx solid rgba(191, 219, 254, 0.7);
  border-radius: 12rpx;
  color: #1d4ed8;
  font-size: 24rpx;
  font-weight: 700;
  background: #dbeafe;
}

.progress-track {
  height: 20rpx;
  overflow: hidden;
  padding: 4rpx;
  border-radius: 999rpx;
  background: rgba(226, 232, 240, 0.7);
}

.progress-fill,
.mini-fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(to right, #3b82f6, #4f46e5);
}

.metric-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.metric {
  position: relative;
  overflow: hidden;
  padding: 28rpx;
  border-radius: 32rpx;
}

.metric-blue {
  border: 1rpx solid rgba(219, 234, 254, 0.7);
  background: linear-gradient(to bottom right, rgba(239, 246, 255, 0.85), rgba(248, 250, 252, 0.6));
}

.metric-indigo {
  border: 1rpx solid rgba(224, 231, 255, 0.7);
  background: linear-gradient(to bottom right, rgba(238, 242, 255, 0.85), rgba(248, 250, 252, 0.6));
}

.metric-top {
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-top text {
  color: #64748b;
  font-size: 24rpx;
  font-weight: 500;
}

.metric-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 700;
}

.metric-icon-blue {
  color: #2563eb;
  background: rgba(59, 130, 246, 0.1);
}

.metric-icon-indigo {
  color: #4f46e5;
  background: rgba(99, 102, 241, 0.1);
}

.metric-num-row {
  display: flex;
  align-items: baseline;
}

.metric-num {
  margin-right: 8rpx;
  color: #1e293b;
  font-size: 48rpx;
  font-weight: 800;
}

.metric-unit {
  color: #64748b;
  font-size: 24rpx;
}

.tab-grid {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16rpx;
}

.tab-btn {
  padding: 16rpx 8rpx;
  border: 1rpx solid rgba(226, 232, 240, 0.7);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  color: #475569;
  font-size: 24rpx;
  font-weight: 700;
}

.tab-badge {
  width: 28rpx;
  height: 28rpx;
  margin-right: 6rpx;
  flex-shrink: 0;
}

.tab-btn.active {
  border-color: transparent;
  color: #fff;
  background: #2563eb;
  box-shadow: 0 8rpx 20rpx rgba(59, 130, 246, 0.2);
}

.tab-count {
  margin-left: 8rpx;
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  background: #f1f5f9;
  color: #64748b;
}

.tab-btn.active .tab-count {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

.member-list {
  margin-top: 20rpx;
}

.member-card {
  margin-top: 20rpx;
  padding: 28rpx;
  border: 1rpx solid #f1f5f9;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  background: #fff;
  box-shadow: 0 8rpx 40rpx -4rpx rgba(0, 0, 0, 0.05);
}

.member-card:active {
  transform: scale(0.99);
}

.member-avatar {
  width: 96rpx;
  height: 96rpx;
  margin-right: 24rpx;
  overflow: hidden;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-avatar-img {
  width: 100%;
  height: 100%;
}

.member-avatar text {
  color: #1e293b;
  font-size: 32rpx;
  font-weight: 700;
}

.avatar-amber {
  background: linear-gradient(to top right, #fbbf24, #f97316);
}

.avatar-emerald {
  background: linear-gradient(to top right, #34d399, #14b8a6);
}

.avatar-blue {
  background: linear-gradient(to top right, #3b82f6, #4f46e5);
}

.avatar-purple {
  background: linear-gradient(to top right, #a855f7, #7c3aed);
}

.avatar-rose {
  background: linear-gradient(to top right, #f43f5e, #db2777);
}

.avatar-amber text,
.avatar-emerald text,
.avatar-blue text,
.avatar-purple text,
.avatar-rose text {
  color: #fff;
}

.member-main {
  flex: 1;
  min-width: 0;
}

.member-name-row {
  display: flex;
  align-items: center;
}

.member-name {
  margin-right: 12rpx;
  overflow: hidden;
  color: #1e293b;
  font-size: 28rpx;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.member-badge {
  padding: 4rpx 12rpx;
  border-width: 1rpx;
  border-style: solid;
  border-radius: 10rpx;
  font-size: 20rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.badge-amber {
  color: #b45309;
  background: #fffbeb;
  border-color: #fde68a;
}

.badge-emerald {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.badge-blue {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #bfdbfe;
}

.badge-purple {
  color: #6d28d9;
  background: #f5f3ff;
  border-color: #ddd6fe;
}

.badge-rose {
  color: #be123c;
  background: #fff1f2;
  border-color: #fecdd3;
}

.member-sub {
  margin-top: 8rpx;
  display: flex;
  align-items: center;
  color: #94a3b8;
  font-size: 22rpx;
}

.member-dot {
  margin: 0 8rpx;
}

.member-progress {
  min-width: 160rpx;
  margin-left: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex-shrink: 0;
}

.member-progress-label {
  margin-bottom: 8rpx;
  color: #64748b;
  font-size: 22rpx;
  font-weight: 600;
}

.member-progress-val {
  color: #2563eb;
  font-weight: 700;
}

.mini-track {
  width: 160rpx;
  height: 12rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: #f1f5f9;
}

.empty {
  margin-top: 20rpx;
  padding: 64rpx 32rpx;
  border: 1rpx solid #f1f5f9;
  border-radius: 32rpx;
  text-align: center;
  background: #fff;
}

.empty-icon {
  width: 96rpx;
  height: 96rpx;
  margin: 0 auto 16rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  background: #f1f5f9;
}

.empty text {
  color: #64748b;
  font-size: 24rpx;
}

.drawer-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(15, 23, 42, 0.6);
}

.drawer {
  width: 100%;
  padding: 40rpx;
  border-radius: 48rpx 48rpx 0 0;
  background: #fff;
  box-shadow: 0 -16rpx 60rpx rgba(15, 23, 42, 0.12);
}

.drawer-handle {
  width: 96rpx;
  height: 8rpx;
  margin: 0 auto 32rpx;
  border-radius: 999rpx;
  background: #e2e8f0;
}

.drawer-head {
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-user {
  display: flex;
  align-items: center;
}

.drawer-avatar {
  width: 96rpx;
  height: 96rpx;
  margin-right: 24rpx;
  overflow: hidden;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
  background: #2563eb;
}

.drawer-avatar-img {
  width: 100%;
  height: 100%;
}

.drawer-name {
  display: block;
  color: #0f172a;
  font-size: 32rpx;
  font-weight: 700;
}

.drawer-desc {
  display: block;
  margin-top: 6rpx;
  color: #94a3b8;
  font-size: 22rpx;
}

.drawer-close {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 32rpx;
  background: #f1f5f9;
}

.drawer-stats {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.drawer-stat {
  padding: 24rpx;
  border: 1rpx solid #f1f5f9;
  border-radius: 24rpx;
  background: #f8fafc;
}

.drawer-stat-label {
  display: block;
  color: #94a3b8;
  font-size: 22rpx;
}

.drawer-stat-val {
  display: block;
  margin-top: 8rpx;
  color: #1e293b;
  font-size: 28rpx;
  font-weight: 700;
}

.drawer-stat-blue {
  color: #2563eb;
}

.drawer-actions {
  margin-top: 32rpx;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
}

.drawer-btn {
  height: 80rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
}

.drawer-btn.ghost {
  color: #334155;
  background: #f1f5f9;
}

.drawer-btn.primary {
  color: #fff;
  background: #2563eb;
  box-shadow: 0 8rpx 20rpx rgba(37, 99, 235, 0.2);
}
</style>
