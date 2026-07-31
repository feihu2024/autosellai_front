<template>
  <!-- ===== 金色模板 F-1（模板2） ===== -->
  <view v-if="isGoldTemplate" class="gold-home">
    <!-- Banner 轮播 -->
    <view v-if="homeBanners.length > 0" class="g-banner-carousel">
      <view class="g-banner-track" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
        <view v-for="(banner, idx) in homeBanners" :key="banner.id || idx" class="g-banner-slide"
          @click="onBannerClick(banner)">
          <image :src="getImageUrl(banner.image_url)" class="g-banner-img" mode="aspectFill" />
        </view>
      </view>
      <view class="g-banner-dots" v-if="homeBanners.length > 1">
        <view v-for="(banner, idx) in homeBanners" :key="idx"
          :class="['g-banner-dot', { active: currentBanner === idx }]" @click="currentBanner = idx" />
      </view>
    </view>

    <!-- 静态 Hero 回退 -->
    <view v-else class="g-hero">
      <image src="/static/tpl-gold/home-hero.png" class="g-hero-img" mode="widthFix" />
    </view>

    <!-- 搜索框 -->
    <view class="g-search-box">
      <image class="g-search-ico" src="/static/tpl-gold/icon-search.png" mode="aspectFit" />
      <input v-model="searchKeyword" type="text" confirm-type="search"
        :placeholder="agentVisible ? '搜索智能体 / 功能' : '搜索商品'" @input="onSearch" />
      <view v-if="searchKeyword" class="g-search-clear" @click="searchKeyword = ''; onSearch()"><text>×</text></view>
    </view>

    <!-- 金刚区 -->
    <view class="g-quick-panel">
      <view class="g-quick-action" v-for="tool in quickTools" :key="tool.name" @click="onToolClick(tool)">
        <image :src="goldQuickIcon(tool.name)" mode="aspectFit" />
        <text>{{ tool.name }}</text>
      </view>
    </view>

    <!-- 智能体区域 -->
    <template v-if="agentVisible">
      <view class="g-tabs-row">
        <view v-for="tab in categories" :key="tab.value" class="g-tab" :class="{ active: activeCategory === tab.value }"
          @click="switchCategory(tab.value)"><text>{{ tab.label }}</text></view>
      </view>

      <view class="g-tool-list" v-if="agents.length">
        <view class="g-tool-card" v-for="agent in agents" :key="agent.id">
          <view class="g-favorite" :class="{ active: agent.is_favorite }" @click.stop="toggleFavorite(agent)">
            <image src="/static/tpl-gold/icon-star.png" mode="aspectFit" />
          </view>
          <image class="g-tool-thumb"
            :src="getImageUrl(agent.cover_url || agent.icon) || '/static/icons/common/robot.png'" mode="aspectFill" />
          <view class="g-tool-copy">
            <text class="g-tool-name">{{ agent.name }}</text>
            <text class="g-tool-desc">{{ agent.description }}</text>
          </view>
          <view class="g-use-btn" @click="goToChat(agent)"><text>使用</text></view>
        </view>
      </view>

      <view v-if="!loading && agents.length === 0" class="g-empty-state">
        <text class="g-empty-title">没有找到对应智能体</text>
        <text class="g-empty-desc">换一个关键词或分类试试</text>
      </view>
      <view v-if="loading" class="g-loading"><text>加载中...</text></view>
    </template>

    <!-- 商品推荐占位 -->
    <template v-else>
      <view class="g-tabs-row">
        <text class="g-tab active">精选好物</text>
      </view>

      <view class="g-tool-list" v-if="products.length">
        <view class="g-tool-card" v-for="product in products" :key="product.id" @click="goToProduct(product)">
          <image class="g-tool-thumb" :src="getImageUrl(product.main_image) || '/static/icons/common/robot.png'"
            mode="aspectFill" />
          <view class="g-tool-copy">
            <text class="g-tool-name">{{ product.name }}</text>
            <text class="g-tool-desc">{{ product.subtitle || '点击查看详情' }}</text>
          </view>
          <view class="g-use-btn" @click.stop="goToProduct(product)"><text>¥{{ product.min_price || product.retail_price
            || 0 }}</text></view>
        </view>
      </view>

      <view v-if="!productsLoading && products.length === 0" class="g-empty-state">
        <text class="g-empty-title">暂无推荐商品</text>
      </view>
      <view v-if="productsLoading" class="g-loading"><text>加载中...</text></view>
    </template>
  </view>

  <!-- ===== 紫色模板（模板1，默认） ===== -->
  <view v-else class="home-page">
    <!-- Banner 轮播 -->
    <view v-if="homeBanners.length > 0" class="banner-carousel">
      <view class="banner-track" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
        <view v-for="(banner, idx) in homeBanners" :key="banner.id || idx" class="banner-slide"
          @click="onBannerClick(banner)">
          <image :src="getImageUrl(banner.image_url)" class="banner-img" mode="aspectFill" />
        </view>
      </view>
      <view class="banner-dots" v-if="homeBanners.length > 1">
        <view v-for="(banner, idx) in homeBanners" :key="idx" :class="['banner-dot', { active: currentBanner === idx }]"
          @click="currentBanner = idx" />
      </view>
    </view>

    <!-- 静态 Hero 回退 -->
    <view v-else class="hero">
      <view class="hero-copy">
        <text class="hero-kicker">AI 创作中心</text>
        <text class="hero-title">让创作更轻松</text>
        <text class="hero-desc">智能工具 · 高效创作 · 灵感随行</text>
      </view>
      <view class="hero-orb orb-a"></view>
      <view class="hero-orb orb-b"></view>
      <view class="hero-grid"></view>
    </view>

    <!-- 搜索框 -->
    <view class="search-field" :class="{ 'has-value': searchKeyword }">
      <image class="ui-icon search-ico" src="/static/icons/common/search.png" mode="aspectFit" />
      <input v-model="searchKeyword" type="text" confirm-type="search" :placeholder="agentVisible ? '搜索智能体' : '搜索商品'"
        @input="onSearch" />
      <view v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''; onSearch()"><text>×</text></view>
    </view>

    <!-- 金刚区 -->
    <view class="quick-grid">
      <view class="quick-item" v-for="tool in quickTools" :key="tool.name" @click="onToolClick(tool)">
        <view class="quick-icon">
          <image class="ui-icon" :src="tool.icon" mode="aspectFit" />
        </view>
        <text class="quick-name">{{ tool.name }}</text>
        <text class="quick-sub">{{ toolSubtitle(tool.name) }}</text>
      </view>
    </view>

    <!-- 智能体区域 -->
    <template v-if="agentVisible">
      <view class="section-heading compact">
        <view>
          <text class="eyebrow">智能体广场</text>
          <text class="heading-title">选择你的创作助手</text>
        </view>
        <view class="count-pill"><text class="count-num">{{ agents.length }}</text><text> 个</text></view>
      </view>

      <scroll-view scroll-x class="chip-scroll" :show-scrollbar="false">
        <view v-for="tab in categories" :key="tab.value" class="chip" :class="{ active: activeCategory === tab.value }"
          @click="switchCategory(tab.value)"><text>{{ tab.label }}</text></view>
      </scroll-view>

      <view class="agent-grid" v-if="agents.length">
        <view class="agent-card" v-for="agent in agents" :key="agent.id">
          <view class="square-media" v-if="agent.cover_url || agent.icon">
            <image :src="getImageUrl(agent.cover_url || agent.icon)" mode="aspectFill" />
          </view>
          <view class="square-media media-icon" v-else>
            <image class="ui-icon media-emoji" src="/static/icons/common/robot.png" mode="aspectFit" />
          </view>
          <view class="favorite-btn" :class="{ active: agent.is_favorite }" @click.stop="toggleFavorite(agent)">
            <view class="favorite-icon-set">
              <image class="ui-icon icon-normal" src="/static/icons/common/star.png" mode="aspectFit" />
              <image class="ui-icon icon-active" src="/static/icons/common/star-active.png" mode="aspectFit" />
            </view>
          </view>
          <view class="agent-content">
            <text class="micro-tag" v-if="agent.category">{{ agent.category }}</text>
            <text class="agent-name">{{ agent.name }}</text>
            <text class="agent-desc">{{ agent.description }}</text>
            <view class="agent-actions">
              <view class="use-agent-btn" @click="goToChat(agent)"><text>使用</text></view>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!loading && agents.length === 0" class="empty-state show">
        <image class="ui-icon empty-icon" src="/static/icons/common/search.png" mode="aspectFit" />
        <text class="empty-title">没有找到对应智能体</text>
        <text class="empty-desc">换一个关键词或分类试试</text>
      </view>

      <view v-if="loading" class="loading-state">
        <text>加载中...</text>
      </view>

      <view class="ad-strip" @click="goExplore" v-if="agents.length">
        <view class="ad-icon">
          <image class="ui-icon" src="/static/icons/common/wand-brown.png" mode="aspectFit" />
        </view>
        <view class="ad-copy">
          <text class="ad-strong">探索更多 AI 创作可能</text>
          <text class="ad-small">发现适合你的实用工具</text>
        </view>
        <text class="ad-tag">广告</text>
      </view>
    </template>

    <!-- 商品推荐占位 -->
    <template v-else>
      <view class="section-heading compact">
        <view>
          <text class="eyebrow">精选好物</text>
          <text class="heading-title">为你推荐</text>
        </view>
      </view>

      <view class="agent-grid" v-if="products.length">
        <view class="agent-card" v-for="product in products" :key="product.id" @click="goToProduct(product)">
          <view class="square-media" v-if="product.main_image">
            <image :src="getImageUrl(product.main_image)" mode="aspectFill" />
          </view>
          <view class="square-media media-icon" v-else>
            <image class="ui-icon media-emoji" src="/static/icons/common/robot.png" mode="aspectFit" />
          </view>
          <view class="agent-content">
            <text class="agent-name">{{ product.name }}</text>
            <text class="agent-desc">{{ product.subtitle }}</text>
            <view class="product-price-row">
              <text class="product-price">¥{{ product.min_price || product.retail_price || 0 }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="!productsLoading && products.length === 0" class="empty-state show">
        <text class="empty-title">暂无推荐商品</text>
      </view>

      <view v-if="productsLoading" class="loading-state">
        <text>加载中...</text>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getMiniappAgents, getMiniappAgentCategories, favoriteAgent, unfavoriteAgent, getMiniappConfig, getUserProfile, getMiniappMallProducts, miniappLogin } from '@/api/miniapp'
import { useAdManager } from '@/composables/useAdManager'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'
import { useShare } from '@/composables/useShare'
import { useGlobalState } from '@/composables/useGlobalState'
import { navigator } from '@/utils'
import { getImageUrl } from '@/utils/image'

// 注册页面分享：分享首页 + 自动携带邀请参数
useShare()

const { isGoldTemplate } = useMiniappTemplate()

const { loginInitialized } = useGlobalState()

const searchKeyword = ref('')
const activeCategory = ref('')
const agents = ref<any[]>([])
const loading = ref(false)

// Banner 轮播
const homeBanners = ref<any[]>([])
const currentBanner = ref(0)
let bannerTimer: ReturnType<typeof setInterval> | null = null

// 权益身份级别排序
const LEVEL_RANK: Record<string, number> = { '普通': 0, '达人': 1, '店长': 2, '分销商': 3 }

// 智能体可见性控制
const userBenefitLevel = ref<string>('普通')
const agentVisibleLevel = ref<string>('普通')
const agentVisible = computed(() => {
  const userRank = LEVEL_RANK[userBenefitLevel.value] ?? 0
  const requiredRank = LEVEL_RANK[agentVisibleLevel.value] ?? 0
  return userRank >= requiredRank
})

// 商品推荐占位
const products = ref<any[]>([])
const productsLoading = ref(false)

const quickTools = [
  { name: '提取链接', icon: '/static/icons/functions/extract-link.png' },
  { name: '反推提示词', icon: '/static/icons/functions/reverse-prompt.png' },
  { name: '文案提取', icon: '/static/icons/functions/copywriting.png' },
  { name: '高端制图', icon: '/static/icons/functions/image-create.png' },
]

function goldQuickIcon(name: string): string {
  const map: Record<string, string> = {
    '提取链接': '/static/tpl-gold/quick-link.png',
    '高端制图': '/static/tpl-gold/quick-image.png',
    '文案提取': '/static/tpl-gold/quick-copy.png',
    '反推提示词': '/static/tpl-gold/quick-prompt.png',
  }
  return map[name] || '/static/tpl-gold/quick-link.png'
}

const categories = ref<{ label: string; value: string }[]>([
  { label: '全部', value: '' },
])

let searchTimer: ReturnType<typeof setTimeout> | null = null

function toolSubtitle(name: string): string {
  const map: Record<string, string> = {
    '提取链接': '快速解析内容',
    '反推提示词': '图片灵感拆解',
    '文案提取': '复制视频文案',
    '高端制图': '生成视觉素材',
  }
  return map[name] || ''
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (agentVisible.value) {
      fetchAgents()
    } else {
      fetchProducts()
    }
  }, 300)
}

function switchCategory(category: string) {
  activeCategory.value = category
  fetchAgents()
}

async function fetchCategories() {
  try {
    const res = await getMiniappAgentCategories()
    const cats = res.data?.categories || []
    const dynamicTabs = cats.map((c: any) => ({ label: c.name, value: c.name }))
    categories.value = [
      { label: '全部', value: '' },
      ...dynamicTabs,
      { label: '收藏', value: '收藏' },
    ]
  } catch (e) {
    console.error('获取分类失败', e)
    categories.value = [
      { label: '全部', value: '' },
      { label: '收藏', value: '收藏' },
    ]
  }
}

async function fetchAgents() {
  loading.value = true
  try {
    const res = await getMiniappAgents({
      page: 1,
      page_size: 50,
      category: activeCategory.value || undefined,
      keyword: searchKeyword.value || undefined,
    })
    agents.value = res.data?.items || []
  } catch (e) {
    console.error('获取智能体列表失败', e)
  } finally {
    loading.value = false
  }
}

async function toggleFavorite(agent: any) {
  const wasFavorite = agent.is_favorite
  agent.is_favorite = !wasFavorite
  try {
    if (wasFavorite) {
      await unfavoriteAgent(agent.id)
    } else {
      await favoriteAgent(agent.id)
    }
  } catch (e) {
    agent.is_favorite = wasFavorite
    console.error('收藏操作失败', e)
  }
}

function goToChat(agent: any) {
  navigator.push(`/m/agent/chat?id=${agent.id}`)
}

function goExplore() {
  // 可跳转到更多详情
}

function onBannerClick(banner: any) {
  if (banner.link_url) {
    navigator.push(banner.link_url)
  }
}

function goToProduct(product: any) {
  navigator.push(`/m/mall/${product.id}`)
}

async function fetchProducts() {
  productsLoading.value = true
  try {
    const res = await getMiniappMallProducts({
      keyword: searchKeyword.value || undefined,
    })
    products.value = res.data?.list || []
  } catch (e) {
    console.error('获取商品列表失败', e)
  } finally {
    productsLoading.value = false
  }
}

// ===== 广告频次门禁 =====
const { initFromConfig, shouldShowAd } = useAdManager()

const TOOL_TRIGGER_MAP: Record<string, string> = {
  '提取链接': 'btn_extract_link',
  '反推提示词': 'btn_reverse_prompt',
  '文案提取': 'btn_extract_text',
  '高端制图': 'btn_image_gen',
}

function onToolClick(tool: any) {
  const triggerKey = TOOL_TRIGGER_MAP[tool.name]
  if (triggerKey && shouldShowAd(triggerKey)) {
    console.debug('[ad] trigger:', triggerKey)
  }
}


async function init() {
  try {
    const [configRes, profileRes]: any[] = await Promise.all([
      getMiniappConfig(),
      getUserProfile(),
    ])
    const configData = configRes.data || {}
    const userData = profileRes.data || {}
    agentVisibleLevel.value = configData.agent_visible_level || '普通'
    userBenefitLevel.value = userData.benefit_level || '普通'

    initFromConfig(configData)

    const allBanners = configData.banners || []
    homeBanners.value = allBanners.filter((b: any) => b.category === 'home' && b.image_url)
    if (homeBanners.value.length > 1) {
      bannerTimer = setInterval(() => {
        currentBanner.value = (currentBanner.value + 1) % homeBanners.value.length
      }, 3500)
    }
  } catch (e) {
    console.error('获取配置/用户信息失败', e)
  }

  if (agentVisible.value) {
    await fetchCategories()
    fetchAgents()
  } else {
    fetchProducts()
  }
}

// 监听登录状态，登录完成后初始化页面
watch(loginInitialized, async (initialized) => {
  if (initialized) {
    await init()
  }
}, { immediate: true })

onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer)
})
</script>

<style scoped lang="scss">
/* ===== HomeView 紫色模板样式 ===== */
.home-page {
  padding: 12px 18px 0;
}

/* Banner 轮播 */
.banner-carousel {
  position: relative;
  border-radius: 28rpx;
  overflow: hidden;
  margin-bottom: 16px;
  box-shadow: 0 18px 42px rgba(102, 88, 245, 0.16);
}

.banner-track {
  display: flex;
  transition: transform 0.4s ease;
}

.banner-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 180px;
}

.banner-img {
  width: 100%;
  height: 100%;
}

.banner-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 5;
}

.banner-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: 0.2s;
}

.banner-dot.active {
  background: #fff;
  width: 18px;
  border-radius: 4px;
}

.ui-icon {
  display: block;
  flex: 0 0 auto;
}

/* Hero */
.hero {
  min-height: 164px;
  padding: 24px 22px;
  border-radius: 28rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 18px 42px rgba(102, 88, 245, 0.24);
  margin-bottom: 16px;
  background: linear-gradient(135deg, #554cf0 0%, #7468f5 52%, #9b94f8 100%);
}

.hero-copy {
  position: relative;
  z-index: 3;
}

.hero-kicker {
  display: inline-flex;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  margin-bottom: 12px;
  color: #fff;
}

.hero-title {
  display: block;
  margin: 0 0 6px;
  font-size: 28px;
  line-height: 1.16;
  color: #fff;
  font-weight: 800;
}

.hero-desc {
  display: block;
  color: rgba(255, 255, 255, 0.84);
  font-size: 13px;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.13);
}

.orb-a {
  width: 150px;
  height: 150px;
  right: -42px;
  top: -50px;
}

.orb-b {
  width: 94px;
  height: 94px;
  right: 58px;
  bottom: -52px;
}

/* 搜索框 */
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

/* 金刚区 */
.quick-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  margin-bottom: 22px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.quick-item {
  flex: 1;
  min-width: 70px;
  max-width: 90px;
  min-height: 90px;
  padding: 12px 4px 8px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(57, 70, 112, 0.06);
  border: 1px solid rgba(229, 234, 244, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quick-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(145deg, #f1efff, #e9f0ff);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.quick-icon .ui-icon {
  width: 18px;
  height: 18px;
}

.quick-name {
  font-size: 12px;
  font-weight: 600;
}

.quick-sub {
  font-size: 8px;
  color: #75829c;
  margin-top: 2px;
}

/* Section heading */
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin: 24px 0 14px;
}

.eyebrow {
  display: block;
  color: #6658f5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.7px;
  margin-bottom: 5px;
}

.heading-title {
  font-size: 19px;
  font-weight: 800;
  color: #202a42;
}

.count-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e5eaf4;
  font-size: 11px;
  color: #75829c;
}

.count-num {
  color: #6658f5;
  font-size: 13px;
  font-weight: 800;
}

/* 分类 Chip */
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

/* 智能体卡片 */
.agent-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.agent-card {
  width: calc(50% - 6px);
  position: relative;
  background: #fff;
  border-radius: 22px;
  overflow: hidden;
  border: 1px solid rgba(229, 234, 244, 0.92);
  box-shadow: 0 8px 24px rgba(57, 70, 112, 0.07);
  display: flex;
  flex-direction: column;
}

.square-media {
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  overflow: hidden;
  background: #eef2fb;
  position: relative;
}

.square-media image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.media-icon {
  padding-bottom: 100%;
  background: linear-gradient(145deg, #f5efff, #eef6ff);
}

.media-icon .media-emoji {
  width: 54px;
  height: 54px;
}

.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 8px 18px rgba(31, 42, 67, 0.12);
}

.favorite-icon-set {
  position: relative;
  width: 19px;
  height: 19px;
}

.favorite-icon-set .ui-icon {
  position: absolute;
  top: 0;
  left: 0;
  width: 19px;
  height: 19px;
}

.icon-active {
  display: none;
}

.favorite-btn.active .icon-normal {
  display: none;
}

.favorite-btn.active .icon-active {
  display: block;
}

.agent-content {
  padding: 12px 13px 13px;
  display: flex;
  flex-direction: column;
}

.micro-tag {
  align-self: flex-start;
  padding: 4px 7px;
  border-radius: 999px;
  color: #6658f5;
  background: #efedff;
  font-size: 10px;
  font-weight: 700;
}

.agent-name {
  font-size: 15px;
  line-height: 1.35;
  margin: 8px 0 5px;
  color: #202a42;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.agent-desc {
  font-size: 11.5px;
  line-height: 1.55;
  color: #75829c;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.agent-actions {
  margin-top: 12px;
}

.use-agent-btn {
  width: 100%;
  height: 38px;
  border-radius: 13px;
  background: linear-gradient(135deg, #6658f5, #8377fb);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(102, 88, 245, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 空状态 */
.empty-state,
.loading-state {
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

/* 商品价格 */
.product-price-row {
  margin-top: 10px;
}

.product-price {
  font-size: 16px;
  font-weight: 800;
  color: #ff4d4f;
}

/* 广告横幅 */
.ad-strip {
  // width: 100%;
  min-height: 60px;
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 18px;
  background: linear-gradient(90deg, #fff1ae, #ffe58d);
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9a6212;
}

.ad-icon {
  width: 38px;
  height: 38px;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ad-icon .ui-icon {
  width: 19px;
  height: 19px;
}

.ad-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.ad-strong {
  font-size: 13px;
  font-weight: 700;
}

.ad-small {
  font-size: 10px;
  opacity: 0.78;
  margin-top: 2px;
}

.ad-tag {
  font-size: 10px;
  padding: 4px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

/* ===== HomeView 金色模板样式 ===== */
.gold-home {
  padding: 0 15px 20px;
  background: #fffaf2;
}

.g-banner-carousel {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(253, 178, 41, 0.15);
}

.g-banner-track {
  display: flex;
  transition: transform 0.4s ease;
}

.g-banner-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 170px;
}

.g-banner-img {
  width: 100%;
  height: 100%;
}

.g-banner-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 5;
}

.g-banner-dot {
  width: 11px;
  height: 3px;
  border-radius: 99px;
  background: #d2d1ce;
  transition: 0.2s;
}

.g-banner-dot.active {
  background: #ff7b1a;
}

.g-hero {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(253, 178, 41, 0.15);
  margin-bottom: 12px;
}

.g-hero-img {
  width: 100%;
}

.g-search-box {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  margin-bottom: 12px;
  border: 1px solid #efede8;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 4px 10px rgba(79, 66, 44, 0.08);
}

.g-search-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.g-search-box input {
  min-width: 0;
  flex: 1;
  font-size: 13px;
}

.g-search-clear {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #a4a5a9;
  flex-shrink: 0;
}

.g-quick-panel {
  display: flex;
  gap: 4px;
  padding: 10px 8px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(240, 237, 230, 0.9);
  box-shadow: 0 4px 12px rgba(118, 94, 51, 0.1);
  margin-bottom: 12px;
}

.g-quick-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.g-quick-action image {
  width: 48px;
  height: 48px;
  border-radius: 10px;
}

.g-quick-action text {
  font-size: 12px;
  color: #15171b;
}

.g-tabs-row {
  display: flex;
  align-items: center;
  height: 38px;
  justify-content: space-around;
  border-bottom: 1px solid #f5f2ed;
  padding: 0 7px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 12px 12px 0 0;
  border: 1px solid rgba(240, 237, 230, 0.9);
}

.g-tab {
  position: relative;
  min-width: 60px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #272a2f;
  font-size: 13px;
}

.g-tab.active {
  color: #ff7b1a;
  font-weight: 700;
}

.g-tab.active::after {
  content: "";
  position: absolute;
  height: 2px;
  border-radius: 99px;
  background: linear-gradient(90deg, #ff7b1a, #ffa53d);
  left: 25%;
  right: 25%;
  bottom: 2px;
}

.g-tool-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}

.g-tool-card {
  width: calc(50% - 4px);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px 10px;
  border: 1px solid #f1eeea;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 7px rgba(82, 65, 44, 0.06);
}

.g-tool-thumb {
  width: 56px;
  height: 56px;
  border-radius: 14px;
}

.g-tool-copy {
  width: 100%;
  text-align: center;
  margin-top: 8px;
}

.g-tool-name {
  display: block;
  margin-bottom: 3px;
  font-size: 13px;
  font-weight: 700;
  color: #15171b;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.g-tool-desc {
  display: block;
  overflow: hidden;
  color: #7c7f85;
  font-size: 10px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.g-favorite {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
}

.g-favorite image {
  width: 18px;
  height: 18px;
}

.g-favorite.active image {
  filter: sepia(1) saturate(8) hue-rotate(354deg);
}

.g-use-btn {
  width: 100%;
  height: 32px;
  margin-top: 8px;
  border-radius: 16px;
  font-size: 11px;
  color: #15171b;
  font-weight: 600;
  background: linear-gradient(120deg, #ffca38, #ffb62f);
  box-shadow: 0 3px 6px rgba(255, 179, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.g-empty-state,
.g-loading {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  color: #999;
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
