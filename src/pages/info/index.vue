<template>
  <!-- ===== 金色模板 F-2（模板2） ===== -->
  <view v-if="isGoldTemplate" class="gold-info">
    <text class="g-info-title">资讯</text>

    <view v-if="infoBanners.length > 0" class="g-info-banner">
      <view class="g-info-banner-track" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
        <view v-for="(banner, idx) in infoBanners" :key="banner.id || idx" class="g-info-banner-slide"
          @click="onBannerClick(banner)">
          <image :src="getImageUrl(banner.image_url)" class="g-info-banner-img" mode="aspectFill" />
        </view>
      </view>
      <view class="g-info-banner-dots" v-if="infoBanners.length > 1">
        <view v-for="(banner, idx) in infoBanners" :key="idx"
          :class="['g-info-banner-dot', { active: currentBanner === idx }]" @click="currentBanner = idx" />
      </view>
    </view>

    <view class="g-news-search">
      <image src="/static/tpl-gold/icon-search.png" mode="aspectFit" />
      <input v-model.trim="keyword" type="text" confirm-type="search" placeholder="搜索资讯、文章、动态等" @input="onSearch" />
      <view class="g-search-btn" @click="onSearch"><text>搜索</text></view>
    </view>

    <view class="g-news-panel">
      <scroll-view scroll-x class="g-news-tabs" :show-scrollbar="false">
        <view v-for="item in categories" :key="item.name" class="g-news-tab"
          :class="{ active: currentCategory === item.name }" @click="switchCategory(item.name)"><text>{{ item.name
          }}</text></view>
      </scroll-view>

      <view class="g-news-list" v-if="infoList.length">
        <template v-for="(item, index) in infoList" :key="item.id">
          <view class="g-news-card" @click="goDetail(item)">
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
          <!-- 在第4个列表项后展示模板广告 -->
          <view v-if="index === 3 && templateAdUnit" class="g-ad-container">
            <ad-custom :unit-id="templateAdUnit.ad_unit_id" @load="onAdLoad" @error="onAdError"
              @close="onAdClose"></ad-custom>
          </view>
        </template>
      </view>

      <view class="g-empty-state" v-if="!infoList.length">
        <text class="g-empty-title">没有找到相关资讯</text>
        <text class="g-empty-desc">试试其他关键词</text>
      </view>
    </view>
  </view>

  <!-- ===== 紫色模板（模板1） ===== -->
  <view v-else class="page-shell info-page">
    <!-- 轮播图 -->
    <view v-if="infoBanners.length > 0" class="info-banner-carousel surface">
      <view class="info-banner-track" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
        <view v-for="(banner, idx) in infoBanners" :key="banner.id || idx" class="info-banner-slide"
          @click="onBannerClick(banner)">
          <image :src="getImageUrl(banner.image_url)" class="info-banner-img" mode="aspectFill" />
        </view>
      </view>
      <view class="info-banner-dots" v-if="infoBanners.length > 1">
        <view v-for="(banner, idx) in infoBanners" :key="idx"
          :class="['info-banner-dot', { active: currentBanner === idx }]" @click="currentBanner = idx" />
      </view>
    </view>

    <!-- 搜索栏 -->
    <view class="search-bar surface">
      <text class="search-icon">⌕</text>
      <input v-model.trim="keyword" type="text" confirm-type="search" placeholder="搜索资讯、文章、动态" @input="onSearch" />
      <button v-if="keyword" class="clear-btn" @tap="keyword = ''; onSearch()">×</button>
    </view>

    <!-- 分类（纵向图标 + 文字） -->
    <scroll-view class="categories surface" scroll-x :show-scrollbar="false">
      <button v-for="item in categories" :key="item.name" :class="{ active: currentCategory === item.name }"
        @tap="switchCategory(item.name)">
        <image class="category-icon" :src="item.icon_url" />
        <text>{{ item.name }}</text>
      </button>
    </scroll-view>

    <!-- 资讯列表 -->
    <view v-if="infoList.length">
      <template v-for="(item, index) in infoList" :key="item.id">
        <view class="article-card surface" @tap="goDetail(item)">
          <view class="article-copy">
            <view class="article-title ellipsis">{{ item.title }}</view>
            <view class="article-sub ellipsis">{{ item.summary || '点击查看详情' }}</view>
            <view class="article-meta">
              <text v-if="item.category" class="article-tag">{{ item.category }}</text>
              <text v-if="item.locked" class="lock-tag">🔒 {{ item.require_level }}</text>
              <text class="article-date">▣ {{ (item.created_at || item.publish_date || '').slice(0, 10) }}</text>
            </view>
          </view>
          <view class="article-cover">
            <image v-if="item.cover_url" :src="item.cover_url" mode="aspectFill" />
            <view v-else class="cover-placeholder"></view>
            <view v-if="item.locked" class="cover-lock-overlay">
              <view class="lock-badge">
                <text class="lock-emoji">🔒</text>
                <text class="lock-text">{{ item.require_level }}可读</text>
              </view>
            </view>
          </view>
        </view>
        <!-- 在第4个列表项后展示模板广告 -->
        <view v-if="index === 2 && templateAdUnit" class="ad-container">
          <ad-custom :unit-id="templateAdUnit.ad_unit_id" @load="onAdLoad" @error="onAdError"
            @close="onAdClose"></ad-custom>
        </view>
      </template>
    </view>

    <view v-else class="empty surface">没有找到相关资讯</view>
  </view>

  <!-- 底部跑马灯登录条（未绑定手机号时显示） -->
  <LoginMarqueeBar />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getMiniappInfoList, getMiniappInfoCategories, getMiniappConfig } from '@/api/miniapp'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'
import LoginMarqueeBar from '@/components/LoginMarqueeBar.vue'
import { useAdManager } from '@/composables/useAdManager'
import { navigator, showToast } from '@/utils'
import { getImageUrl } from '@/utils/image'
import { onShow } from '@dcloudio/uni-app'

const { isGoldTemplate } = useMiniappTemplate()
const { shouldShowAdByScene, initFromConfig } = useAdManager()

// 模板广告配置（场景ID 14）
const templateAdUnit = ref<any>(null)

function gTagClass(category: string): string {
  const map: Record<string, string> = {
    '行业动态': 'g-tag-gold',
    '政策解读': 'g-tag-green',
    '技术干货': 'g-tag-purple',
    '热门活动': 'g-tag-orange',
  }
  return map[category] || 'g-tag-default'
}

const categories = ref<any[]>([{ name: '全部', icon_url: '/static/images/discover-category-all.png' }])
const currentCategory = ref('全部')
const keyword = ref('')
const infoList = ref<any[]>([])

// 轮播图
const infoBanners = ref<any[]>([])
const currentBanner = ref(0)
let bannerTimer: ReturnType<typeof setInterval> | null = null

async function fetchCategories() {
  try {
    const res = await getMiniappInfoCategories()
    const cats = res.data?.categories || []
    categories.value = [{ name: '全部', icon_url: '/static/images/discover-category-all.png' }, ...cats]
  } catch {
    categories.value = [{ name: '全部', icon_url: '/static/images/discover-category-all.png' }]
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

function onBannerClick(banner: any) {
  if (banner.link_url) navigator.push(banner.link_url)
}

// 广告事件处理
function onAdLoad() {
  console.log('资讯页模板广告加载成功')
}

function onAdError(e: any) {
  console.error('资讯页模板广告加载失败', e)
}

function onAdClose() {
  console.log('资讯页模板广告关闭')
}

onShow(async () => {
  // 获取广告配置
  try {
    // 先获取配置并初始化
    const configRes = await getMiniappConfig()
    const configData = configRes.data || {}
    initFromConfig(configData)

    // 模板广告配置（场景ID 14）
    const templateAd = shouldShowAdByScene(14)
    if (templateAd && templateAd.ad_type === 'SLOT_ID_WEAPP_TEMPLATE') {
      templateAdUnit.value = templateAd
      console.log('资讯页模板广告配置:', templateAd)
    }

    // 加载轮播图
    const allBanners = configData.banners || []
    infoBanners.value = allBanners.filter((b: any) => b.category === 'miniapp' && b.image_url)
    if (infoBanners.value.length > 1) {
      bannerTimer = setInterval(() => {
        currentBanner.value = (currentBanner.value + 1) % infoBanners.value.length
      }, 3500)
    }
  } catch (e) {
    console.error('获取广告配置失败', e)
  }

  fetchCategories()
  fetchList()
})

onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer)
})
</script>

<style scoped lang="scss">
/* ===== 紫色模板（对齐 discover 风格） ===== */
.info-page {
  padding: 18rpx 24rpx 0;
  box-sizing: border-box;
}

/* surface 卡片通用背景 */
.surface {
  background: white;
  border-radius: 28rpx;
  box-shadow: 0 10rpx 30rpx rgba(39, 54, 75, 0.06);
}

/* 搜索栏 */
.search-bar {
  height: 108rpx;
  padding: 12rpx 16rpx 12rpx 26rpx;
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

/* 轮播图（紫色模板） */
.info-banner-carousel {
  position: relative;
  overflow: hidden;
  margin-bottom: 20rpx;
  margin-top: 32px;
}

.info-banner-track {
  display: flex;
  transition: transform 0.4s ease;
}

.info-banner-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 180px;
}

.info-banner-img {
  width: 100%;
  height: 100%;
}

.info-banner-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 5;
}

.info-banner-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.info-banner-dot.active {
  background: #fff;
  width: 18px;
  border-radius: 4px;
}

.search-icon {
  color: #58708e;
  font-size: 42rpx;
}

.search-bar input {
  flex: 1;
  min-width: 0;
  padding: 0 18rpx;
  font-size: 27rpx;
}

.clear-btn {
  width: 70rpx;
  height: 70rpx;
  line-height: 66rpx;
  padding: 0;
  border-radius: 22rpx;
  color: white;
  background: #3479ed;
  font-size: 38rpx;
}

.clear-btn::after {
  border: none;
}

/* 分类（纵向图标 + 文字） */
.categories {
  margin-bottom: 20rpx;
  padding: 10rpx 8rpx;
  white-space: nowrap;
}

.categories button {
  width: 112rpx;
  height: 118rpx;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 10rpx 0 0;
  padding: 0;
  color: #8190a7;
  background: transparent;
  font-size: 24rpx;
  border-radius: 20rpx;
}

.categories button::after {
  border: none;
}

.categories button.active {
  color: #2f76ef;
  background: #edf3ff;
}

.category-icon {
  width: 52rpx;
  height: 52rpx;
  margin-top: 8rpx;
}

/* 资讯卡片（横向：左文字 右封面） */
.article-card {
  min-height: 210rpx;
  margin-bottom: 20rpx;
  padding: 22rpx;
  display: flex;
  align-items: center;
}

.article-copy {
  width: 52%;
  padding: 6rpx 12rpx 6rpx 4rpx;
}

.article-title {
  font-size: 32rpx;
  font-weight: 750;
}

.article-sub {
  margin-top: 14rpx;
  color: #8590a5;
  font-size: 26rpx;
}

.article-meta {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
}

.article-tag {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  color: #2f76ef;
  background: #edf3ff;
  font-size: 20rpx;
}

.lock-tag {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  color: #b45309;
  background: #fef3c7;
  font-size: 20rpx;
}

.article-date {
  color: #8794aa;
  font-size: 24rpx;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 封面图 */
.article-cover {
  width: 48%;
  height: 170rpx;
  position: relative;
  overflow: hidden;
  border-radius: 23rpx;
  background: linear-gradient(145deg, #edf0ff, #f8efff);
}

.article-cover image {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
}

/* 锁定遮罩 */
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
}

.lock-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 12rpx;
  padding: 8rpx 16rpx;
}

.lock-emoji {
  font-size: 30rpx;
}

.lock-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #6b5a1e;
}

/* 空状态 */
.empty {
  padding: 70rpx;
  text-align: center;
  color: #8b97a9;
}

/* 广告容器 */
.ad-container {
  margin: 20rpx 0;
  padding: 0 24rpx;
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

/* 轮播图（金色模板） */
.g-info-banner {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: 0 8px 24px rgba(255, 180, 0, 0.12);
}

.g-info-banner-track {
  display: flex;
  transition: transform 0.4s ease;
}

.g-info-banner-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 180px;
}

.g-info-banner-img {
  width: 100%;
  height: 100%;
}

.g-info-banner-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 5;
}

.g-info-banner-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.g-info-banner-dot.active {
  background: #ffb400;
  width: 16px;
  border-radius: 4px;
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

/* 广告容器 */
.g-ad-container {
  margin: 16px 0;
  padding: 0 14px;
}
</style>
