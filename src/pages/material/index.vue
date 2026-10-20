<template>
  <view class="material-page">
    <!-- 自定义导航 -->
    <view class="nav" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="nav-title">素材中心</text>
    </view>

    <!-- 搜索栏 -->
    <view class="search-row">
      <view class="search">
        <image class="search-icon" src="/static/icons/common/search.png" mode="aspectFit" />
        <input v-model.trim="keyword" class="search-input" type="text" confirm-type="search" placeholder="搜索素材名称、类型或关键词"
          placeholder-class="search-ph" @input="onSearch" @confirm="fetchList" />
        <view v-if="keyword" class="search-clear" @tap="clearKeyword"><text>×</text></view>
      </view>
      <view class="filter-btn" :class="{ on: filtersOpen }" @tap="filtersOpen = !filtersOpen">
        <view class="filter-ico">
          <view class="fl-line">
            <view class="fl-dot" style="left: 2rpx"></view>
          </view>
          <view class="fl-line">
            <view class="fl-dot" style="left: 12rpx"></view>
          </view>
          <view class="fl-line">
            <view class="fl-dot" style="left: 6rpx"></view>
          </view>
        </view>
        <text>筛选</text>
      </view>
    </view>

    <!-- 分类筛选 -->
    <view class="filters" v-if="filtersOpen">
      <view v-for="cat in categories" :key="cat" class="chip" :class="{ active: currentCategory === cat }"
        @tap="switchCategory(cat)">
        <text>{{ cat }}</text>
      </view>
    </view>

    <!-- 素材列表 -->
    <view class="list" v-if="materialList.length">
      <view class="card" v-for="item in materialList" :key="item.id" @tap="goDetail(item)">
        <image class="thumb" :src="item.image" mode="aspectFill" />
        <view class="card-info">
          <text class="card-title ellipsis">{{ item.title }}</text>
          <text class="subtitle ellipsis-2">{{ item.subtitle }}</text>
          <view class="card-foot">
            <text class="date">更新时间：{{ item.date || '-' }}</text>
            <view class="detail-btn">
              <text>查看详情</text>
              <text class="chevron"></text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="empty" v-else-if="!loading">
      <text>没有找到相关素材</text>
      <view class="empty-btn" @tap="resetFilter"><text>清除搜索与筛选</text></view>
    </view>

    <LoginMarqueeBar />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMaterialCategories, getMaterialList } from '@/api/miniapp'
import { navigator } from '@/utils'
import { getImageUrl } from '@/utils/image'
import LoginMarqueeBar from '@/components/LoginMarqueeBar.vue'

const statusBarHeight = ref(uni.getSystemInfoSync().statusBarHeight || 20)

const keyword = ref('')
const filtersOpen = ref(false)
const currentCategory = ref('全部')
const categories = ref<string[]>(['全部'])
const materialList = ref<any[]>([])
const loading = ref(false)

/** 分类接口返回结构兼容（字符串数组 / 对象数组 / {categories}） */
function normalizeCategories(data: any): string[] {
  const list = data?.categories || data?.items || data?.list || (Array.isArray(data) ? data : [])
  const names = list
    .map((c: any) => (typeof c === 'string' ? c : c?.name || c?.category_name || c?.label || c?.value))
    .filter(Boolean)
  return names.length ? ['全部', ...names] : ['全部']
}

/** 列表项字段兼容 */
function normalizeItem(raw: any): any {
  const tags = raw.tags || raw.tag_list || []
  return {
    id: raw.id ?? raw.material_id,
    title: raw.title || raw.name || '未命名素材',
    subtitle: raw.subtitle || raw.summary || raw.description || '',
    image: getImageUrl(raw.image || raw.cover_url || raw.thumb_url || raw.cover || raw.thumbnail),
    category: raw.category_name || raw.category || raw.type || '',
    tags: Array.isArray(tags) ? tags : String(tags).split(/[,，、]/).filter(Boolean),
    date: String(raw.updated_at || raw.updatedAt || raw.created_at || raw.publish_date || '').slice(0, 10),
    raw,
  }
}

async function fetchCategories() {
  try {
    const res = await getMaterialCategories()
    categories.value = normalizeCategories(res.data)
  } catch {
    categories.value = ['全部']
  }
}

async function fetchList() {
  loading.value = true
  try {
    const params: any = {}
    if (currentCategory.value !== '全部') params.category = currentCategory.value
    if (keyword.value) params.keyword = keyword.value
    const res = await getMaterialList(params)
    const data = res.data
    const items = data?.items || data?.list || data?.data || (Array.isArray(data) ? data : [])
    materialList.value = items.map(normalizeItem)
  } catch {
    materialList.value = []
  } finally {
    loading.value = false
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

function clearKeyword() {
  keyword.value = ''
  fetchList()
}

function resetFilter() {
  keyword.value = ''
  currentCategory.value = '全部'
  fetchList()
}

function goDetail(item: any) {
  navigator.push(`/pages/material/detail?id=${item.id}`)
}

onShow(() => {
  fetchCategories()
  fetchList()
})
</script>

<style scoped lang="scss">
.material-page {
  min-height: 100vh;
  padding: 0 20rpx calc(140rpx + env(safe-area-inset-bottom));
  background: linear-gradient(110deg, #fcfcfd, #fff 50%, #f8f9fb);
  box-sizing: border-box;
}

/* 导航 */
.nav {
  height: 66rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #101114;
}

/* 搜索栏 */
.search-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 12rpx 12rpx 23rpx;
}

.search {
  flex: 1;
  min-width: 0;
  height: 64rpx;
  border-radius: 40rpx;
  background: #f1f2f5;
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 0 23rpx;
  box-sizing: border-box;
}

.search-icon {
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  color: #444;
}

.search-ph {
  color: #9499a3;
}

.search-clear {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #c4c9d2;
  color: #fff;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 筛选按钮（CSS 绘制滑块图标） */
.filter-btn {
  width: 72rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  font-size: 18rpx;
  color: #5f6675;
}

.filter-btn.on {
  color: #287aff;
}

.filter-ico {
  width: 32rpx;
  height: 30rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.fl-line {
  position: relative;
  height: 4rpx;
  border-radius: 2rpx;
  background: currentColor;
}

.fl-dot {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #fff;
  border: 3rpx solid currentColor;
  box-sizing: border-box;
}

/* 分类 chips */
.filters {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  margin: 0 12rpx 20rpx;
}

.chip {
  font-size: 20rpx;
  border-radius: 24rpx;
  padding: 10rpx 20rpx;
  background: #edf3ff;
}

.chip text {
  color: #4772b1;
}

.chip.active {
  background: #287aff;
}

.chip.active text {
  color: #fff;
}

/* 列表卡片 */
.list {
  display: flex;
  flex-direction: column;
  gap: 17rpx;
}

.card {
  display: flex;
  gap: 22rpx;
  padding: 14rpx 16rpx;
  border-radius: 25rpx;
  background: #fff;
  box-shadow: 0 8rpx 24rpx rgba(38, 57, 83, 0.05);
  min-height: 174rpx;
  box-sizing: border-box;
}

.thumb {
  width: 263rpx;
  height: 146rpx;
  border-radius: 14rpx;
  flex-shrink: 0;
  background: #e8edf3;
}

.card-info {
  flex: 1;
  min-width: 0;
  padding: 12rpx 0 4rpx;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 27rpx;
  font-weight: 650;
  color: #101114;
}

.subtitle {
  margin-top: 8rpx;
  color: #8c919d;
  font-size: 21rpx;
  line-height: 1.5;
}

.card-foot {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
}

.date {
  font-size: 18rpx;
  color: #8d94a2;
  white-space: nowrap;
}

.detail-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  border-radius: 30rpx;
  background: #eaf2ff;
  padding: 12rpx 18rpx;
  flex-shrink: 0;
}

.detail-btn text {
  color: #0064ff;
  font-size: 20rpx;
  font-weight: 600;
}

.chevron {
  width: 12rpx;
  height: 12rpx;
  border-top: 2rpx solid #0064ff;
  border-right: 2rpx solid #0064ff;
  transform: rotate(45deg);
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 90rpx 0;
  color: #8b94a2;
  font-size: 24rpx;
}

.empty-btn {
  display: inline-block;
  margin-top: 24rpx;
  font-size: 22rpx;
  color: #287aff;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ellipsis-2 {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
