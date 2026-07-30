<template>
  <!-- ===== 金色模板 F-2（模板2） ===== -->
  <view v-if="isGoldTemplate" class="gold-info">
    <text class="g-info-title">资讯</text>

    <view class="g-news-search">
      <image src="/static/tpl-gold/icon-search.png" mode="aspectFit" />
      <input v-model.trim="keyword" type="text" confirm-type="search" placeholder="搜索资讯、文章、动态等" @input="onSearch" />
      <view class="g-search-btn" @click="onSearch"><text>搜索</text></view>
    </view>

    <view class="g-news-panel">
      <scroll-view scroll-x class="g-news-tabs" :show-scrollbar="false">
        <view v-for="item in categories" :key="item" class="g-news-tab" :class="{ active: currentCategory === item }"
          @click="switchCategory(item)"><text>{{ item }}</text></view>
      </scroll-view>

      <view class="g-news-list" v-if="infoList.length">
        <view class="g-news-card" v-for="item in infoList" :key="item.id" @click="goDetail(item)">
          <view class="g-news-copy">
            <text class="g-news-title">{{ item.title }}</text>
            <view class="g-news-meta">
              <text class="g-tag" :class="gTagClass(item.category)">{{ item.category }}</text>
              <text class="g-news-date">{{ (item.created_at || item.publish_date || '').slice(0, 10) }}</text>
            </view>
          </view>
          <image class="g-news-img" v-if="item.cover_url" :src="item.cover_url" mode="aspectFill" />
          <view class="g-news-img g-news-placeholder" v-else></view>
        </view>
      </view>

      <view class="g-empty-state" v-if="!infoList.length">
        <text class="g-empty-title">没有找到相关资讯</text>
        <text class="g-empty-desc">试试其他关键词</text>
      </view>
    </view>
  </view>

  <!-- ===== 紫色模板（模板1） ===== -->
  <view v-else class="info-page">
    <view class="page-header">
      <text class="eyebrow">内容中心</text>
      <text class="page-title">信息</text>
      <text class="page-desc">查看平台动态、运营指南与实用技巧</text>
    </view>

    <view class="search-field" :class="{ 'has-value': keyword }">
      <image class="ui-icon search-ico" src="/static/icons/common/search.png" mode="aspectFit" />
      <input v-model.trim="keyword" type="text" confirm-type="search" placeholder="搜索信息" @input="onSearch" />
      <view v-if="keyword" class="search-clear" @click="keyword = ''; onSearch()"><text>×</text></view>
    </view>

    <scroll-view scroll-x class="chip-scroll" :show-scrollbar="false">
      <view v-for="item in categories" :key="item" class="chip" :class="{ active: currentCategory === item }"
        @click="switchCategory(item)"><text>{{ item }}</text></view>
    </scroll-view>

    <view class="section-heading">
      <view>
        <text class="eyebrow">精选内容</text>
        <text class="heading-title">实用信息，一看就懂</text>
      </view>
    </view>

    <view class="article-list" v-if="infoList.length">
      <view class="article-card" :class="{ locked: item.locked }" v-for="item in infoList" :key="item.id"
        @click="goDetail(item)">
        <view class="article-cover">
          <image v-if="item.cover_url" :src="item.cover_url" mode="aspectFill" />
          <view v-else class="cover-placeholder"></view>
          <view class="cover-lock-overlay" v-if="item.locked">
            <view class="lock-badge">
              <text class="lock-emoji">🔒</text>
              <text class="lock-text">{{ item.require_level }}可读</text>
            </view>
          </view>
        </view>
        <view class="article-copy">
          <view>
            <text class="micro-tag" v-if="item.category">{{ item.category }}</text>
            <text class="lock-tag" v-if="item.locked">🔒 {{ item.require_level }}</text>
            <text class="article-title">{{ item.title }}</text>
            <text class="article-summary">{{ item.summary || '点击查看详情' }}</text>
          </view>
          <view class="article-meta">
            <view v-if="item.locked" class="detail-btn locked-btn">
              <text>升级解锁</text>
            </view>
            <view v-else class="detail-btn">
              <text>查看详情</text>
              <image class="ui-icon" src="/static/icons/common/chevron-purple.png" mode="aspectFit" />
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="!infoList.length">
      <image class="ui-icon empty-icon" src="/static/icons/common/news-empty.png" mode="aspectFit" />
      <text class="empty-title">没有找到相关信息</text>
      <text class="empty-desc">试试其他关键词</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMiniappInfoList, getMiniappInfoCategories } from '@/api/miniapp'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'
import { navigator, showToast } from '@/utils'

const { isGoldTemplate } = useMiniappTemplate()

function gTagClass(category: string): string {
  const map: Record<string, string> = {
    '行业动态': 'g-tag-gold',
    '政策解读': 'g-tag-green',
    '技术干货': 'g-tag-purple',
    '热门活动': 'g-tag-orange',
  }
  return map[category] || 'g-tag-default'
}

const categories = ref<string[]>(['全部'])
const currentCategory = ref('全部')
const keyword = ref('')
const infoList = ref<any[]>([])

async function fetchCategories() {
  try {
    const res = await getMiniappInfoCategories()
    const cats = res.data?.categories || []
    categories.value = ['全部', ...cats]
  } catch {
    categories.value = ['全部']
  }
}

async function fetchList() {
  try {
    const params: any = {}
    if (currentCategory.value !== '全部') params.category = currentCategory.value
    if (keyword.value) params.keyword = keyword.value
    const res = await getMiniappInfoList(params)
    infoList.value = res.data?.items || []
  } catch {
    infoList.value = []
  }
}

function switchCategory(cat: string) {
  currentCategory.value = cat
  fetchList()
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchList(), 300)
}

function goDetail(item: any) {
  if (item.locked) {
    showToast(`内容过于硬核，需要【${item.require_level}】及以上身份才可以观看\n请升级权益等级后查看`)
    return
  }
  navigator.push(`/m/info/detail?id=${item.id}`)
}

onMounted(() => {
  fetchCategories()
  fetchList()
})
</script>

<style scoped lang="scss">
/* ===== 紫色模板 ===== */
.info-page {
  padding: 12px 18px 0;
}

.ui-icon {
  display: block;
  flex: 0 0 auto;
}

.page-header {
  padding: 18px 2px 16px;
}

.eyebrow {
  display: block;
  color: #6658f5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.7px;
  margin-bottom: 5px;
}

.page-title {
  display: block;
  font-size: 29px;
  line-height: 1.15;
  margin-bottom: 7px;
  color: #202a42;
  font-weight: 800;
}

.page-desc {
  display: block;
  font-size: 13px;
  color: #75829c;
}

.search-field {
  height: 52px;
  border: 1px solid #e5eaf4;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 17px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 13px;
  box-shadow: 0 8px 20px rgba(58, 69, 110, 0.04);
  margin-bottom: 16px;
}

.search-ico {
  width: 19px;
  height: 19px;
  flex-shrink: 0;
}

.search-field input {
  flex: 1;
  font-size: 14px;
  min-width: 0;
}

.search-clear {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #a2abc0;
  flex-shrink: 0;
}

.chip-scroll {
  white-space: nowrap;
  padding: 1px 1px 8px;
  margin-bottom: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 66px;
  height: 36px;
  padding: 0 15px;
  border-radius: 999px;
  background: #fff;
  color: #75829c;
  border: 1px solid #e5eaf4;
  font-size: 13px;
  margin-right: 9px;
}

.chip.active {
  background: #6658f5;
  color: #fff;
  border-color: #6658f5;
  box-shadow: 0 8px 18px rgba(102, 88, 245, 0.24);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 24px 0 14px;
}

.heading-title {
  font-size: 19px;
  font-weight: 800;
  color: #202a42;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-card {
  display: flex;
  gap: 13px;
  min-height: 128px;
  padding: 10px;
  background: #fff;
  border-radius: 22px;
  border: 1px solid #e5eaf4;
  box-shadow: 0 8px 24px rgba(57, 70, 112, 0.07);
}

.article-card.locked .article-cover {
  position: relative;
}

.article-card.locked .article-cover image {
  opacity: 0.6;
}

.cover-lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 25, 45, 0.45);
  border-radius: 16px;
}

.lock-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12px;
  padding: 8px 12px;
}

.lock-emoji {
  font-size: 22px;
}

.lock-text {
  font-size: 10px;
  font-weight: 700;
  color: #6b5a1e;
}

.lock-tag {
  align-self: flex-start;
  padding: 4px 8px;
  border-radius: 999px;
  color: #b45309;
  background: #fef3c7;
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 4px;
}

.article-cover {
  width: 112px;
  height: 112px;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(145deg, #edf0ff, #f8efff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.article-cover image {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
}

.article-copy {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  padding: 4px 2px;
  flex: 1;
}

.micro-tag {
  align-self: flex-start;
  padding: 4px 7px;
  border-radius: 999px;
  color: #6658f5;
  background: #efedff;
  font-size: 10px;
  font-weight: 700;
  margin-bottom: 4px;
}

.article-title {
  font-size: 16px;
  margin: 7px 0 5px;
  color: #202a42;
  font-weight: 600;
  display: block;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-summary {
  font-size: 11px;
  color: #75829c;
  line-height: 1.5;
  display: block;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.detail-btn {
  display: flex;
  align-items: center;
  color: #6658f5;
  font-size: 11px;
}

.detail-btn .ui-icon {
  width: 13px;
  height: 13px;
  margin-left: 3px;
}

.locked-btn {
  color: #f59e0b !important;
}

.empty-state {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  color: #75829c;
}

.empty-icon {
  width: 42px;
  height: 42px;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 14px;
  color: #69758e;
  font-weight: 600;
}

.empty-desc {
  font-size: 11px;
  margin-top: 6px;
}

/* ===== 金色模板 F-2 ===== */
.gold-info {
  padding: 0 14px 20px;
  background: #fffaf2;
}

.g-info-title {
  display: block;
  text-align: center;
  margin: 8px 0 15px;
  font-size: 19px;
  font-weight: 700;
  color: #15171b;
}

.g-news-search {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 5px 0 13px;
  margin-bottom: 6px;
  border: 1px solid #efede8;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 4px 10px rgba(79, 66, 44, 0.08);
}

.g-news-search image {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.g-news-search input {
  min-width: 0;
  flex: 1;
  font-size: 13px;
}

.g-search-btn {
  height: 28px;
  min-width: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1a300;
  font-weight: 700;
  font-size: 12px;
  background: linear-gradient(90deg, #fff8dd, #fff3c8);
}

.g-news-panel {
  padding: 9px 8px 6px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(240, 237, 230, 0.9);
  box-shadow: 0 4px 12px rgba(118, 94, 51, 0.1);
}

.g-news-tabs {
  white-space: nowrap;
  height: 36px;
  border-bottom: 1px solid #f5f2ed;
  margin-bottom: 7px;
}

.g-news-tab {
  display: inline-flex;
  align-items: center;
  min-width: 56px;
  height: 100%;
  color: #272a2f;
  font-size: 12px;
  margin-right: 4px;
}

.g-news-tab.active {
  color: #f3ad00;
  font-weight: 700;
}

.g-news-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.g-news-card {
  display: flex;
  gap: 11px;
  align-items: center;
  padding: 8px 9px 8px 12px;
  border: 1px solid #f0eee9;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(82, 65, 44, 0.07);
}

.g-news-copy {
  min-width: 0;
  flex: 1;
}

.g-news-title {
  display: block;
  margin-bottom: 10px;
  min-height: 26px;
  font-size: 13px;
  line-height: 1.48;
  font-weight: 700;
  color: #15171b;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.g-news-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #8c909a;
  font-size: 10px;
}

.g-tag {
  padding: 3px 5px;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 600;
}

.g-tag-gold {
  color: #eea700;
  background: #fff6d8;
}

.g-tag-green {
  color: #1ab778;
  background: #def8ec;
}

.g-tag-purple {
  color: #7c6cff;
  background: #eeeaff;
}

.g-tag-orange {
  color: #ff7417;
  background: #fff0e7;
}

.g-tag-default {
  color: #eea700;
  background: #fff6d8;
}

.g-news-date {
  white-space: nowrap;
}

.g-news-img {
  width: 100px;
  height: 65px;
  border-radius: 8px;
  flex-shrink: 0;
}

.g-news-placeholder {
  background: linear-gradient(145deg, #fff8e9, #ffefc0);
}

.g-empty-state {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  color: #999;
  padding: 20px 0;
}

.g-empty-title {
  font-size: 13px;
  color: #69758e;
  font-weight: 600;
}

.g-empty-desc {
  font-size: 11px;
  margin-top: 6px;
}
</style>
