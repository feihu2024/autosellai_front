<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">我的推荐</text>
    </view>

    <!-- 统计 -->
    <view class="stats">
      <view class="stat">
        <text class="stat-label">推荐总人数</text>
        <text class="stat-num">{{ summary.total_referrals }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">当日日活</text>
        <text class="stat-num">{{ summary.today_active }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">昨日日活</text>
        <text class="stat-num">{{ summary.yesterday_active }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">昨日收益</text>
        <text class="stat-num">¥{{ summary.yesterday_revenue.toFixed(2) }}</text>
      </view>
      <view class="stat wide">
        <text class="stat-label">当月累计收益</text>
        <text class="stat-num">¥{{ summary.month_revenue.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 筛选 -->
    <scroll-view scroll-x class="filter-strip">
      <view
        class="tab"
        :class="{ active: typeFilter === item }"
        v-for="item in ['全部成员','推广者','普通成员']"
        :key="item"
        @click="typeFilter = item"
      >
        <text>{{ item }}</text>
      </view>
    </scroll-view>
    <scroll-view scroll-x class="filter-strip" style="margin-top: -3px">
      <view
        class="tab"
        :class="{ active: activeFilter === item }"
        v-for="item in ['全部','活跃','未活跃']"
        :key="item"
        @click="activeFilter = item"
      >
        <text>{{ item }}</text>
      </view>
    </scroll-view>

    <!-- 推荐成员列表 -->
    <view class="member-list">
      <view
        class="member-item"
        v-for="item in filteredList"
        :key="item.id"
        @click="goMemberDetail(item.id)"
      >
        <view class="avatar">
          <text>{{ (item.nickname || '').slice(0, 1) }}</text>
        </view>
        <view class="member-meta">
          <text class="member-name">{{ item.nickname }}</text>
          <view class="member-tags">
            <text class="mini-tag">{{ item.identity }}</text>
            <text class="mini-tag" :class="item.promoter ? 'active' : 'off'">
              {{ item.promoter ? '推广员' : '非推广员' }}
            </text>
            <text class="mini-tag" :class="item.is_active ? 'active' : 'off'">
              {{ item.is_active ? '活跃' : '未活跃' }}
            </text>
          </view>
          <text class="member-id">ID {{ item.display_id || item.id }}</text>
        </view>
        <text class="member-phone">{{ item.phone }}</text>
        <text class="member-arrow">›</text>
      </view>
      <view class="empty" v-if="!filteredList.length"><text>暂无推荐成员</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAgentReferrals } from '@/api/miniapp'
import { navigator } from '@/utils'

const summary = ref({
  total_referrals: 0,
  today_active: 0,
  yesterday_active: 0,
  yesterday_revenue: 0,
  month_revenue: 0,
})

const referralList = ref<any[]>([])
const typeFilter = ref('全部成员')
const activeFilter = ref('全部')

const filteredList = computed(() => {
  let list = referralList.value
  if (typeFilter.value === '推广者') {
    list = list.filter((m: any) => m.promoter)
  } else if (typeFilter.value === '普通成员') {
    list = list.filter((m: any) => !m.promoter)
  }
  if (activeFilter.value === '活跃') {
    list = list.filter((m: any) => m.is_active)
  } else if (activeFilter.value === '未活跃') {
    list = list.filter((m: any) => !m.is_active)
  }
  return list
})

function goBack() {
  navigator.back()
}

function goMemberDetail(id: number) {
  navigator.push(`/m/member-detail/${id}`)
}

onLoad(async () => {
  try {
    const res = await getAgentReferrals()
    const data = res.data
    if (data) {
      summary.value = data.summary || summary.value
      referralList.value = data.items || []
    }
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

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 13px;
}

.stat {
  padding: 14px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid #e8eef7;
}

.stat.wide {
  grid-column: span 2;
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

.filter-strip {
  white-space: nowrap;
  margin: 13px 0 11px;
  display: flex;
  gap: 7px;
}

.tab {
  display: inline-flex;
  padding: 8px 15px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e8eef7;
  margin-right: 7px;
}

.tab text {
  color: #7c899c;
  font-size: 13px;
}

.tab.active {
  background: #eaf4ff;
  border-color: #b9d8ff;
}

.tab.active text {
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

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3987ff, #91c2ff);
  flex-shrink: 0;
}

.avatar text {
  color: #fff;
  font-weight: 800;
  font-size: 13px;
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
  flex-wrap: wrap;
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

.member-phone {
  font-size: 11px;
  color: #7f8b9d;
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
