<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">成员详情</text>
    </view>

    <!-- 基本信息 -->
    <view class="panel" v-if="info">
      <view class="work-profile">
        <view class="avatar">
          <text>{{ (info.nickname || '用').slice(0, 1) }}</text>
        </view>
        <view class="meta">
          <text class="profile-name">{{ info.nickname }}</text>
          <view class="profile-tags">
            <text class="mini-tag">{{ info.benefit_level }}</text>
            <text class="mini-tag" :class="info.is_promoter ? 'active' : 'off'">
              {{ info.is_promoter ? '推广员' : '非推广' }}
            </text>
            <text class="mini-tag active" v-if="info.is_sales_leader">销售代理</text>
          </view>
          <view class="info-rows">
            <text class="info-text">ID {{ info.display_id || info.id }}</text>
            <text class="info-text" v-if="info.phone">{{ maskPhone(info.phone) }}</text>
            <text class="info-text" v-if="info.created_at">加入时间 {{ info.created_at }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats" v-if="summary">
      <view class="stat">
        <text class="stat-label">直推人数</text>
        <text class="stat-num">{{ summary.total_referrals }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">推广员人数</text>
        <text class="stat-num">{{ summary.promoter_count }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">当日日活</text>
        <text class="stat-num">{{ summary.today_active }}</text>
      </view>
      <view class="stat">
        <text class="stat-label">昨日日活</text>
        <text class="stat-num">{{ summary.yesterday_active }}</text>
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

    <!-- 直推成员列表 -->
    <view class="member-list">
      <view class="member-item" v-for="item in filteredList" :key="item.id">
        <view class="avatar">
          <text>{{ (item.nickname || '').slice(0, 1) }}</text>
        </view>
        <view class="member-meta">
          <text class="member-name">{{ item.nickname }}</text>
          <view class="member-tags">
            <text class="mini-tag">{{ item.benefit_level }}</text>
            <text class="mini-tag" :class="item.is_promoter ? 'active' : 'off'">
              {{ item.is_promoter ? '推广员' : '非推广员' }}
            </text>
            <text class="mini-tag" :class="item.is_active ? 'active' : 'off'">
              {{ item.is_active ? '活跃' : '未活跃' }}
            </text>
          </view>
          <text class="member-id">ID {{ item.display_id || item.id }}</text>
        </view>
        <text class="member-phone">{{ maskPhone(item.phone) }}</text>
      </view>
      <view class="empty" v-if="!filteredList.length"><text>暂无直推成员</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMemberDetail } from '@/api/miniapp'
import { navigator } from '@/utils'

const info = ref<any>(null)
const summary = ref<any>(null)
const memberList = ref<any[]>([])
const typeFilter = ref('全部成员')
const activeFilter = ref('全部')

function maskPhone(phone: string) {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

const filteredList = computed(() => {
  let list = memberList.value
  if (typeFilter.value === '推广者') {
    list = list.filter((m: any) => m.is_promoter)
  } else if (typeFilter.value === '普通成员') {
    list = list.filter((m: any) => !m.is_promoter)
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

onLoad(async (options: any) => {
  const memberId = Number(options?.id)
  if (!memberId) return
  try {
    const res = await getMemberDetail(memberId)
    const data = res.data
    if (data) {
      info.value = data.basic_info
      summary.value = data.summary
      memberList.value = data.items || []
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

.panel {
  background: #fff;
  border: 1px solid #e8eef7;
  border-radius: 18px;
  padding: 15px;
  box-shadow: 0 8px 22px rgba(75, 111, 150, 0.05);
}

.work-profile {
  display: flex;
  align-items: flex-start;
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
  flex-shrink: 0;
}

.avatar text {
  color: #fff;
  font-weight: 800;
  font-size: 18px;
}

.meta {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  display: block;
  margin-bottom: 5px;
}

.profile-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.info-rows {
  margin-top: 6px;
}

.info-text {
  display: block;
  margin-top: 4px;
  color: #7d899d;
  font-size: 11px;
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

.member-item .avatar {
  width: 45px;
  height: 45px;
  border-radius: 14px;
}

.member-item .avatar text {
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

.empty {
  text-align: center;
  color: #98a4b5;
  font-size: 13px;
  padding: 34px 0;
}
</style>
