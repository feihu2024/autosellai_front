<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">代理管理</text>
    </view>

    <!-- 个人信息区 -->
    <view class="panel">
      <view class="work-profile">
        <view class="avatar">
          <text>{{ (workbench.nickname || '代').slice(0, 1) }}</text>
        </view>
        <view class="meta">
          <text class="profile-name">{{ workbench.nickname }}</text>
          <text class="profile-phone">{{ workbench.phone }}</text>
        </view>
        <view v-if="workbench.is_sales_leader" class="primary-btn" @click="goRevenue">
          <text>收益中心</text>
        </view>
      </view>
    </view>

    <!-- 4个统计卡片 -->
    <view class="stats">
      <view class="stat">
        <text class="stat-label">市场人数</text>
        <text class="stat-num">{{ workbench.market_count }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">销售人数</text>
        <text class="stat-num">{{ workbench.sales_count }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">代理人数</text>
        <text class="stat-num">{{ workbench.agent_count }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">日活</text>
        <text class="stat-num">{{ workbench.daily_active }}</text>
      </view>
    </view>

    <!-- 身份筛选 -->
    <view class="work-filter-box">
      <view class="work-filter-group">
        <text class="work-filter-title">身份筛选</text>
        <view class="work-filter-options identity">
          <view class="work-filter-btn" :class="{ active: identityFilter === item }"
            v-for="item in ['全部', '普通', '达人', '店长', '分销商']" :key="item" @click="identityFilter = item">
            <text>{{ item }}</text>
          </view>
        </view>
      </view>
      <view class="work-filter-group">
        <text class="work-filter-title">推广员筛选</text>
        <view class="work-filter-options promoter">
          <view class="work-filter-btn" :class="{ active: promoterFilter === item }"
            v-for="item in ['全部', '推广员', '非推广']" :key="item" @click="promoterFilter = item">
            <text>{{ item }}</text>
          </view>
        </view>
      </view>
      <view class="work-filter-group">
        <text class="work-filter-title">活跃度</text>
        <view class="work-filter-options promoter">
          <view class="work-filter-btn" :class="{ active: activeFilter === item }" v-for="item in ['全部', '活跃', '非活跃']"
            :key="item" @click="activeFilter = item">
            <text>{{ item }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 成员列表 -->
    <view class="member-list">
      <view class="member-item" v-for="item in filteredMembers" :key="item.id" @click="goMemberDetail(item.id)">
        <view class="avatar member-avatar">
          <text>{{ (item.name || '').slice(0, 1) }}</text>
        </view>
        <view class="member-meta">
          <text class="member-name">{{ item.name }}</text>
          <view class="member-tags">
            <text class="mini-tag">{{ item.identity }}</text>
            <text class="mini-tag" :class="item.promoter ? 'active' : 'off'">
              {{ item.promoter ? '推广员' : '非推广员' }}
            </text>
            <text class="mini-tag" :class="item.is_active ? 'active' : 'off'">
              {{ item.daily_active > 0 ? '活跃' : '非活跃' }}
            </text>
          </view>
          <text class="member-id">ID {{ item.display_id || item.id }}</text>
        </view>
        <view class="promoter-control" @click.stop>
          <text class="promoter-label">{{ item.promoter ? '推广员' : '非推广员' }}</text>
          <view class="switch" :class="{ on: item.promoter }" @click="togglePromoterAPI(item)"></view>
        </view>
        <text class="member-arrow">›</text>
      </view>
      <view class="empty" v-if="!filteredMembers.length"><text>暂无成员</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAgentWorkbench, togglePromoter } from '@/api/miniapp'
import { navigator } from '@/utils'

const workbench = ref<any>({
  nickname: '',
  phone: '',
  market_count: 0,
  sales_count: 0,
  agent_count: 0,
  daily_active: 0,
  members: [],
})

const identityFilter = ref('全部')
const promoterFilter = ref('全部')
const activeFilter = ref('全部')

async function togglePromoterAPI(item: any) {
  const oldVal = item.promoter
  item.promoter = !item.promoter
  try {
    await togglePromoter({ member_user_id: item.id, is_promoter: item.promoter })
  } catch {
    item.promoter = oldVal
  }
}

const filteredMembers = computed(() => {
  let list = workbench.value.members || []
  if (identityFilter.value !== '全部') {
    list = list.filter((m: any) => m.identity === identityFilter.value)
  }
  if (promoterFilter.value === '推广员') {
    list = list.filter((m: any) => m.promoter)
  } else if (promoterFilter.value === '非推广') {
    list = list.filter((m: any) => !m.promoter)
  }
  if (activeFilter.value === '活跃') {
    list = list.filter((m: any) => m.daily_active > 0)
  } else if (activeFilter.value === '非活跃') {
    list = list.filter((m: any) => m.daily_active === 0)
  }
  return list
})

function goBack() {
  navigator.back()
}

function goRevenue() {
  navigator.push('/m/revenue-detail')
}

function goMemberDetail(id: number) {
  navigator.push(`/m/member-detail/${id}`)
}

onLoad(async () => {
  try {
    const res = await getAgentWorkbench()
    workbench.value = res.data || workbench.value
  } catch {
    // ignore
  }
})
</script>

<style scoped>
.sub-page {
  padding: 18px 16px 42px;
  min-height: 100vh;
  background: #f4f7fc;
}

.page-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  margin-bottom: 12px;
}

.back {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back text {
  color: #283851;
  font-size: 22px;
}

.page-title {
  font-size: 20px;
  font-weight: 750;
  color: #1e293b;
}

.panel {
  background: #fff;
  border: 1px solid #e8eef7;
  border-radius: 18px;
  padding: 15px;
  box-shadow: 0 8px 22px rgba(75, 111, 150, 0.05);
}

.work-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3987ff, #91c2ff);
}

.avatar text {
  color: #fff;
  font-weight: 800;
  font-size: 18px;
}

.meta {
  flex: 1;
}

.profile-name {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  display: block;
  margin-bottom: 5px;
}

.profile-phone {
  color: #7d899d;
  font-size: 11px;
}

.primary-btn {
  background: linear-gradient(135deg, #3488ff, #65a5ff);
  border-radius: 11px;
  padding: 9px 13px;
  box-shadow: 0 6px 14px rgba(52, 136, 255, 0.18);
}

.primary-btn text {
  color: #fff;
  font-weight: 650;
  font-size: 13px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 13px;
}

.stat {
  padding: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef7;
}

.stat-label {
  display: block;
  color: #7d899d;
  font-size: 11px;
  margin-bottom: 6px;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.work-filter-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 13px 0 11px;
}

.work-filter-group {
  min-width: 0;
  padding: 8px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #e8eef7;
}

.work-filter-title {
  display: block;
  color: #8a96a8;
  font-size: 10px;
  margin: 0 2px 6px;
}

.work-filter-options {
  display: grid;
  gap: 5px;
}

.work-filter-options.identity {
  grid-template-columns: repeat(4, 1fr);
}

.work-filter-options.promoter {
  grid-template-columns: repeat(3, 1fr);
}

.work-filter-btn {
  min-width: 0;
  padding: 6px 2px;
  border-radius: 8px;
  background: #f6f8fb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.work-filter-btn text {
  color: #7d899d;
  font-size: 10px;
}

.work-filter-btn.active {
  background: #eaf4ff;
}

.work-filter-btn.active text {
  color: #287be9;
  font-weight: 700;
}

.member-list {
  display: grid;
  gap: 10px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 11px;
  background: #fff;
  border: 1px solid #e8eef7;
  border-radius: 16px;
  padding: 13px;
  box-shadow: 0 6px 20px rgba(75, 111, 150, 0.04);
}

.member-avatar {
  width: 45px !important;
  height: 45px !important;
  border-radius: 14px !important;
  flex-shrink: 0;
}

.member-avatar text {
  font-size: 13px !important;
}

.member-meta {
  min-width: 0;
  flex: 1;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.member-id {
  margin-top: 5px;
  color: #7d899d;
  font-size: 11px;
  display: block;
}

.member-tags {
  display: flex;
  gap: 5px;
  margin-top: 6px;
}

.mini-tag {
  padding: 3px 6px;
  border-radius: 6px;
  background: #eef6ff;
  color: #3488ff;
  font-size: 9px;
}

.mini-tag.active {
  background: #e9f9f2;
  color: #20a56f;
}

.mini-tag.off {
  background: #f3f5f8;
  color: #909baa;
}

.promoter-control {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.promoter-label {
  font-size: 9px;
  color: #8a96a8;
}

.switch {
  width: 38px;
  height: 22px;
  border-radius: 11px;
  background: #d9e1eb;
  position: relative;
  transition: 0.18s ease;
}

.switch::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(35, 56, 79, 0.18);
  top: 2px;
  left: 2px;
  transition: 0.18s ease;
}

.switch.on {
  background: #3488ff;
}

.switch.on::after {
  transform: translateX(16px);
}

.member-arrow {
  width: 20px;
  font-size: 20px;
  color: #c5cdd9;
  flex-shrink: 0;
}

.empty {
  text-align: center;
  color: #98a4b5;
  font-size: 13px;
  padding: 34px 0;
}
</style>
