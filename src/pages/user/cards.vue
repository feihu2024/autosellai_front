<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">我的卡密</text>
    </view>

    <!-- 统计概览 -->
    <view class="stat-row">
      <view class="stat-item">
        <text class="stat-label">持有总数</text>
        <text class="stat-val">{{ cards.length }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">未激活</text>
        <text class="stat-val warn">{{ stat.unused }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-label">已激活</text>
        <text class="stat-val done">{{ stat.activated }}</text>
      </view>
    </view>

    <!-- 状态筛选 -->
    <scroll-view scroll-x class="subchips" :show-scrollbar="false">
      <view class="chip" :class="{ active: filter === 'all' }" @click="changeFilter('all')"><text>全部</text></view>
      <view class="chip" :class="{ active: filter === 'unused' }" @click="changeFilter('unused')"><text>未激活</text></view>
      <view class="chip" :class="{ active: filter === 'activated' }" @click="changeFilter('activated')"><text>已激活</text></view>
      <view class="chip" :class="{ active: filter === 'expired' }" @click="changeFilter('expired')"><text>已过期</text></view>
    </scroll-view>

    <!-- 卡密列表 -->
    <view class="card-code" v-for="item in cards" :key="item.id">
      <!-- 第一行：名称 + 标签组 -->
      <view class="card-head">
        <text class="head-name">{{ item.name }}</text>
        <view class="head-tags">
          <text class="mini-tag identity" v-if="item.benefit_level !== '无'">{{ item.benefit_level }}</text>
          <text class="mini-tag compute" v-if="item.compute_power > 0">{{ item.compute_power }}点</text>
          <text :class="'status-pill-' + item.status">{{ statusText(item.status) }}</text>
        </view>
      </view>

      <!-- 第二行：激活码 -->
      <view class="code-row" v-if="item.status === 'unused'" @click="copyText(item.code)">
        <text class="code-text">{{ item.code }}</text>
        <text class="copy-link">复制</text>
      </view>
      <view class="code-row disabled" v-else>
        <text class="code-text">{{ item.code }}</text>
        <text class="code-state">{{ item.status === 'activated' ? '已使用' : '已过期' }}</text>
      </view>

      <!-- 第三行：副信息 -->
      <view class="card-sub">
        <text class="sub-info" v-if="item.status === 'unused'">截止 {{ item.expire_date }}</text>
        <text class="sub-info" v-else-if="item.status === 'activated'">激活于 {{ item.activated_at || '—' }}</text>
        <text class="sub-info" v-else>过期 {{ item.expire_date }}</text>
        <view class="goto-link" v-if="item.status === 'unused'" @click="goActivate"><text>去激活 ›</text></view>
      </view>
    </view>

    <view class="empty" v-if="!loading && !cards.length">
      <text>{{ filter === 'all' ? '暂无卡密' : '该分类下暂无卡密' }}</text>
    </view>
    <view class="empty" v-if="loading">
      <text>加载中...</text>
    </view>

    <!-- 使用提示 -->
    <view class="tip-card" v-if="cards.length">
      <text class="tip-title">💡 使用提示</text>
      <text class="tip-p">1. 复制卡密码发给好友，好友在「卡密激活」页输入即可激活</text>
      <text class="tip-p">2. 激活后权益将发放给激活者本人账户</text>
      <text class="tip-p">3. 请在激活截止日期前使用，逾期未激活的卡密将作废</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMyCards } from '@/api/miniapp'
import type { MyCard } from '@/api/miniapp'
import { navigator, copyToClipboard, showToast } from '@/utils'

const cards = ref<MyCard[]>([])
const filter = ref<'all' | 'unused' | 'activated' | 'expired'>('all')
const loading = ref(false)

const stat = computed(() => ({
  total: cards.value.length,
  unused: cards.value.filter(c => c.status === 'unused').length,
  activated: cards.value.filter(c => c.status === 'activated').length,
}))

async function loadCards() {
  loading.value = true
  try {
    const status = filter.value === 'all' ? undefined : filter.value
    const res = await getMyCards(status) as any
    const data = res.data || res
    cards.value = Array.isArray(data) ? data : []
  } catch {
    cards.value = []
  } finally {
    loading.value = false
  }
}

async function changeFilter(f: 'all' | 'unused' | 'activated' | 'expired') {
  if (filter.value === f) return
  filter.value = f
  await loadCards()
}

function statusText(s: string) {
  const map: Record<string, string> = {
    unused: '未激活',
    activated: '已激活',
    expired: '已过期',
  }
  return map[s] || s
}

async function copyText(text: string) {
  await copyToClipboard(text)
  showToast('已复制：' + text, 'success')
}

function goActivate() {
  navigator.push('/m/activate')
}

function goBack() {
  navigator.back()
}

onLoad(() => {
  loadCards()
})
</script>

<style scoped lang="scss">
.sub-page {
  min-height: 100vh;
  background: #f4f7fc;
  padding: 0 16px 80px;
}
.page-head {
  display: flex;
  align-items: center;
  min-height: 50px;
  gap: 8px;
}
.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}
.back text {
  font-size: 22px;
  color: #1e293b;
}
.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

/* 统计 */
.stat-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.stat-item {
  flex: 1;
  padding: 14px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(211, 224, 241, 0.5);
  text-align: center;
  box-shadow: 0 4px 12px rgba(67, 109, 157, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-label {
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
}
.stat-val {
  font-size: 20px;
  color: #1e293b;
  font-weight: 700;
}
.stat-val.warn { color: #ea580c; }
.stat-val.done { color: #16a34a; }

/* 筛选 chips */
.subchips {
  white-space: nowrap;
  margin-bottom: 14px;
  padding-bottom: 2px;
}
.chip {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 16px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.9);
  margin-right: 8px;
}
.chip text {
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}
.chip.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: transparent;
}
.chip.active text {
  color: #fff;
}

/* 卡密卡片 */
.card-code {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(67, 109, 157, 0.05);
  border: 1px solid rgba(211, 224, 241, 0.5);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.head-name {
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.head-tags {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}
.mini-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}
.mini-tag.identity { background: #ede9fe; color: #6d28d9; }
.mini-tag.compute { background: #f5f3ff; color: #7c3aed; }
.status-pill-unused { background: #dcfce7; color: #16a34a; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; white-space: nowrap; }
.status-pill-activated { background: #f1f5f9; color: #64748b; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; white-space: nowrap; }
.status-pill-expired { background: #fee2e2; color: #dc2626; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; white-space: nowrap; }

.code-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}
.code-row.disabled {
  background: #f8fafc;
}
.code-text {
  font-size: 14px;
  color: #1e293b;
  word-break: break-all;
  font-weight: 600;
  flex: 1;
}
.code-row.disabled .code-text {
  color: #94a3b8;
  font-weight: 500;
}
.copy-link {
  font-size: 12px;
  color: #6366f1;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.code-state {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}

.card-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sub-info {
  font-size: 11px;
  color: #94a3b8;
}
.goto-link {
  display: flex;
  align-items: center;
}
.goto-link text {
  color: #6366f1;
  font-size: 12px;
  font-weight: 600;
}

.empty {
  text-align: center;
  padding: 50px 0;
}
.empty text {
  color: #94a3b8;
  font-size: 14px;
}

.tip-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 8px;
  border: 1px dashed #c7d2fe;
  display: flex;
  flex-direction: column;
}
.tip-title {
  font-size: 13px;
  color: #4338ca;
  margin-bottom: 6px;
  font-weight: 600;
}
.tip-p {
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 3px;
}
</style>
