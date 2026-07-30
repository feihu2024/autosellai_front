<template>
  <!-- ===== 金色模板 F-3（模板2） ===== -->
  <view v-if="isGoldTemplate" class="gold-mall">
    <view v-if="mallBanners.length > 0" class="g-shop-banner">
      <view class="g-banner-track" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
        <view v-for="(banner, idx) in mallBanners" :key="banner.id || idx" class="g-banner-slide" @click="onBannerClick(banner)">
          <image :src="banner.image_url" class="g-banner-img" mode="aspectFill" />
        </view>
      </view>
      <view class="g-banner-dots" v-if="mallBanners.length > 1">
        <view v-for="(banner, idx) in mallBanners" :key="idx" :class="['g-banner-dot', { active: currentBanner === idx }]" @click="currentBanner = idx" />
      </view>
    </view>
    <view v-else class="g-shop-hero">
      <image src="/static/tpl-gold/shop-hero.png" mode="widthFix" />
    </view>

    <view class="g-shop-search">
      <image class="g-search-ico" src="/static/tpl-gold/icon-search.png" mode="aspectFit" />
      <input v-model="keyword" type="text" confirm-type="search" placeholder="搜索商品" @input="onSearchDebounced" />
      <view v-if="keyword" class="g-search-clear" @click="keyword = ''; onSearchDebounced()"><text>×</text></view>
    </view>

    <scroll-view scroll-x class="g-shop-categories" :show-scrollbar="false">
      <view v-for="cat in productCategories" :key="cat.value" class="g-cat-btn" :class="{ active: activeProductCategory === cat.value }" @click="switchProductCategory(cat.value)"><text>{{ cat.label }}</text></view>
    </scroll-view>

    <view class="g-section-heading">
      <text class="g-heading-title"><text class="g-heading-bar"></text>精选好物</text>
    </view>

    <view class="g-product-grid" v-if="!loading && filteredProducts.length > 0">
      <view class="g-product-card" v-for="product in filteredProducts" :key="product.id">
        <view class="g-product-media" @click="goDetail(product)">
          <image v-if="product.main_image" :src="product.main_image" mode="aspectFill" />
          <image v-else src="/static/icons/common/robot.png" mode="aspectFit" />
        </view>
        <text class="g-product-name" @click="goDetail(product)">{{ product.name }}</text>
        <view class="g-product-actions">
          <view class="g-product-price" :class="{ 'is-member': getMinMemberPrice(product) }">
            <template v-if="getMinMemberPrice(product)">
              <text class="g-member-label"><text class="g-member-tag">会员</text><text class="g-member-amount">￥{{ getMinMemberPrice(product) }}</text></text>
              <text class="g-normal-price">日常 ￥{{ getMinPrice(product) }}</text>
            </template>
            <text v-else class="g-single-price">￥{{ getMinPrice(product) }}</text>
          </view>
          <view class="g-buy-btn" @click.stop="openPurchase(product)"><text>购买</text></view>
        </view>
      </view>
    </view>

    <view class="g-empty-state" v-if="!loading && filteredProducts.length === 0">
      <text class="g-empty-title">没有找到对应商品</text>
      <text class="g-empty-desc">{{ keyword ? '换一个关键词试试' : '暂无商品' }}</text>
    </view>
    <view v-if="loading" class="g-loading-state"><text>加载中...</text></view>

    <PurchaseSpecSheet v-if="specSheetVisible && selectedProduct" :product="selectedProduct" :visible="specSheetVisible" @close="specSheetVisible = false" @confirm="handleSpecConfirm" />
  </view>

  <!-- ===== 紫色模板（模板1） ===== -->
  <view v-else class="mall-page">
    <view v-if="mallBanners.length > 0" class="banner-carousel">
      <view class="banner-track" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
        <view v-for="(banner, idx) in mallBanners" :key="banner.id || idx" class="banner-slide" @click="onBannerClick(banner)">
          <image :src="banner.image_url" class="banner-img" mode="aspectFill" />
        </view>
      </view>
      <view class="banner-dots" v-if="mallBanners.length > 1">
        <view v-for="(banner, idx) in mallBanners" :key="idx" :class="['banner-dot', { active: currentBanner === idx }]" @click="currentBanner = idx" />
      </view>
    </view>
    <view v-else class="hero">
      <view class="hero-copy">
        <text class="hero-kicker">品质优选</text>
        <text class="hero-title">好商品，放心选</text>
        <text class="hero-desc">自营严选 · SAAS 同步 · 一站购齐</text>
      </view>
      <view class="shop-bag"><image class="ui-icon" src="/static/icons/common/shop-white.png" mode="aspectFit" /></view>
    </view>

    <view class="search-field" :class="{ 'has-value': keyword }">
      <image class="ui-icon search-ico" src="/static/icons/common/search.png" mode="aspectFit" />
      <input v-model="keyword" type="text" confirm-type="search" placeholder="搜索商品" @input="onSearchDebounced" />
      <view v-if="keyword" class="search-clear" @click="keyword = ''; onSearchDebounced()"><text>×</text></view>
    </view>

    <scroll-view scroll-x class="chip-scroll" :show-scrollbar="false">
      <view v-for="cat in productCategories" :key="cat.value" class="chip" :class="{ active: activeProductCategory === cat.value }" @click="switchProductCategory(cat.value)"><text>{{ cat.label }}</text></view>
    </scroll-view>

    <view class="section-heading compact">
      <view>
        <text class="eyebrow">精选好物</text>
        <text class="heading-title">为创作者认真挑选</text>
      </view>
    </view>

    <view class="product-grid" v-if="!loading && filteredProducts.length > 0">
      <view class="product-card" v-for="product in filteredProducts" :key="product.id">
        <view class="square-media" @click="goDetail(product)">
          <image v-if="product.main_image" :src="product.main_image" mode="aspectFill" />
          <image v-else class="cover-placeholder" src="/static/icons/common/robot.png" mode="aspectFit" />
        </view>
        <view class="product-copy">
          <text class="product-name" @click="goDetail(product)">{{ product.name }}</text>
          <view class="product-bottom">
            <view class="compact-price-line">
              <text class="price">¥<text class="price-strong">{{ getMinPrice(product) }}</text></text>
              <text v-if="getMinMemberPrice(product)" class="inline-member-price">会员 ¥{{ getMinMemberPrice(product) }}</text>
            </view>
            <view class="mini-buy-btn" @click.stop="openPurchase(product)"><text>购买</text></view>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="!loading && filteredProducts.length === 0">
      <image class="ui-icon empty-icon" src="/static/icons/common/shop-empty.png" mode="aspectFit" />
      <text class="empty-title">没有找到对应商品</text>
      <text class="empty-desc">{{ keyword ? '换一个关键词试试' : '暂无商品' }}</text>
    </view>
    <view v-if="loading" class="loading-state"><text>加载中...</text></view>

    <PurchaseSpecSheet v-if="specSheetVisible && selectedProduct" :product="selectedProduct" :visible="specSheetVisible" @close="specSheetVisible = false" @confirm="handleSpecConfirm" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getMiniappMallProducts, getMiniappConfig } from '@/api/miniapp'
import PurchaseSpecSheet from '@/components/PurchaseSpecSheet.vue'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'
import { navigator } from '@/utils'

const { isGoldTemplate, loadTemplateVariant } = useMiniappTemplate()

const keyword = ref('')
const products = ref<any[]>([])
const loading = ref(false)

const mallBanners = ref<any[]>([])
const currentBanner = ref(0)
let bannerTimer: ReturnType<typeof setInterval> | null = null

const specSheetVisible = ref(false)
const selectedProduct = ref<any>(null)

const activeProductCategory = ref('')
const productCategories = [
  { label: '全部', value: '' },
  { label: '自营商品', value: '自营商品' },
  { label: '数字产品', value: '数字产品' },
  { label: '实物商品', value: '实物商品' },
]

const filteredProducts = computed(() => {
  if (!activeProductCategory.value) return products.value
  return products.value.filter((p: any) => {
    const cats = (p.categories || p.category || '').toString()
    if (activeProductCategory.value === '自营商品') {
      return p.source === 'saas_sync' || cats.includes('自营')
    }
    return cats.includes(activeProductCategory.value)
  })
})

function switchProductCategory(val: string) {
  activeProductCategory.value = val
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchDebounced() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    loadProducts()
  }, 300)
}

async function loadProducts() {
  loading.value = true
  try {
    const params: any = {}
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const res = await getMiniappMallProducts(params)
    const data = res?.data?.data || res?.data || {}
    products.value = data.list || []
  } catch (e) {
    console.error('加载商城商品失败', e)
    products.value = []
  } finally {
    loading.value = false
  }
}

function getMinPrice(product: any): string {
  const skus = product.skus
  if (Array.isArray(skus) && skus.length > 0) {
    const prices = skus.map((s: any) => Number(s.enterprise_price)).filter((p: number) => !isNaN(p) && p > 0)
    if (prices.length > 0) return Math.min(...prices).toFixed(2)
  }
  return Number(product.retail_price || 0).toFixed(2)
}

function getMinMemberPrice(product: any): string | null {
  const skus = product.skus
  if (Array.isArray(skus) && skus.length > 0) {
    const prices = skus.map((s: any) => Number(s.member_price)).filter((p: number) => !isNaN(p) && p > 0)
    if (prices.length > 0) return Math.min(...prices).toFixed(2)
  }
  const suggest = Number(product.member_price_suggest || 0)
  if (!isNaN(suggest) && suggest > 0) return suggest.toFixed(2)
  return null
}

function goDetail(product: any) {
  navigator.push(`/m/mall/${product.id}`)
}

function openPurchase(product: any) {
  selectedProduct.value = product
  specSheetVisible.value = true
}

function handleSpecConfirm(payload: { sku: any; qty: number }) {
  specSheetVisible.value = false
  const product = selectedProduct.value
  if (!product) return
  navigator.push(`/m/mall/checkout?product_id=${product.id}&sku_id=${payload.sku.id}&qty=${payload.qty}`)
}

function onBannerClick(banner: any) {
  if (banner.link_url) navigator.push(banner.link_url)
}

onMounted(async () => {
  loadTemplateVariant()
  try {
    const configRes: any = await getMiniappConfig()
    const allBanners = configRes.data?.banners || []
    mallBanners.value = allBanners.filter((b: any) => b.category === 'mall' && b.image_url)
    if (mallBanners.value.length > 1) {
      bannerTimer = setInterval(() => {
        currentBanner.value = (currentBanner.value + 1) % mallBanners.value.length
      }, 3500)
    }
  } catch { /* ignore */ }
  loadProducts()
})

onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer)
})
</script>

<style scoped lang="scss">
/* ===== 紫色模板 ===== */
.mall-page { padding: 12px 18px 0; }
.banner-carousel { position: relative; border-radius: 28rpx; overflow: hidden; margin-bottom: 16px; box-shadow: 0 14px 30px rgba(102, 88, 245, 0.16); }
.banner-track { display: flex; transition: transform 0.4s ease; }
.banner-slide { flex: 0 0 100%; width: 100%; height: 180px; }
.banner-img { width: 100%; height: 100%; }
.banner-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; z-index: 5; }
.banner-dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); }
.banner-dot.active { background: #fff; width: 18px; border-radius: 4px; }
.ui-icon { display: block; flex: 0 0 auto; }
.hero { min-height: 164px; padding: 24px 22px; border-radius: 28rpx; position: relative; overflow: hidden; box-shadow: 0 18px 42px rgba(102, 88, 245, 0.24); margin-bottom: 16px; background: linear-gradient(135deg, #5c4ff2, #796af4 55%, #9b92f8); }
.hero-copy { position: relative; z-index: 3; }
.hero-kicker { display: inline-flex; font-size: 12px; font-weight: 700; padding: 6px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.14); margin-bottom: 12px; color: #fff; }
.hero-title { display: block; margin-bottom: 6px; font-size: 28px; color: #fff; font-weight: 800; }
.hero-desc { display: block; color: rgba(255, 255, 255, 0.84); font-size: 13px; }
.shop-bag { position: absolute; right: 26px; bottom: 24px; width: 66px; height: 66px; border-radius: 22px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.15); z-index: 2; }
.shop-bag .ui-icon { width: 34px; height: 34px; }
.search-field { height: 52px; border: 1px solid #e5eaf4; background: rgba(255, 255, 255, 0.95); border-radius: 17px; display: flex; align-items: center; gap: 10px; padding: 0 13px; box-shadow: 0 8px 20px rgba(58, 69, 110, 0.04); margin-bottom: 16px; }
.search-ico { width: 19px; height: 19px; flex-shrink: 0; }
.search-field input { flex: 1; font-size: 14px; min-width: 0; }
.search-clear { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #a2abc0; flex-shrink: 0; }
.chip-scroll { white-space: nowrap; padding: 1px 1px 8px; margin-bottom: 8px; }
.chip { display: inline-flex; align-items: center; justify-content: center; height: 38px; padding: 0 17px; border-radius: 999px; background: #fff; color: #75829c; border: 1px solid #e5eaf4; font-size: 13px; margin-right: 9px; }
.chip.active { background: #6658f5; color: #fff; border-color: #6658f5; box-shadow: 0 8px 18px rgba(102, 88, 245, 0.24); }
.section-heading { display: flex; justify-content: space-between; align-items: flex-end; margin: 24px 0 14px; }
.eyebrow { display: block; color: #6658f5; font-size: 11px; font-weight: 800; margin-bottom: 5px; }
.heading-title { font-size: 21px; font-weight: 800; color: #202a42; }
.product-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.product-card { width: calc(50% - 6px); display: flex; flex-direction: column; border-radius: 19px; overflow: hidden; background: #fff; border: 1px solid #e8edf5; box-shadow: 0 6px 18px rgba(55, 67, 104, 0.07); }
.square-media { width: 100%; height: 0; padding-bottom: 100%; overflow: hidden; background: #eef2fb; position: relative; }
.square-media image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.cover-placeholder { width: 60%; height: 60%; }
.product-copy { flex: 1; min-height: 112px; padding: 11px 11px 10px; display: flex; flex-direction: column; }
.product-name { min-height: 42px; font-size: 15px; line-height: 21px; font-weight: 700; color: #202a3d; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.product-bottom { min-height: 34px; margin-top: 8px; display: flex; align-items: flex-end; justify-content: space-between; gap: 6px; }
.compact-price-line { min-width: 0; flex: 1; display: flex; align-items: baseline; flex-wrap: wrap; }
.price { color: #ff4b3e; font-size: 12px; white-space: nowrap; }
.price-strong { font-size: 20px; font-weight: 800; }
.inline-member-price { color: #9a6417; font-size: 10px; font-weight: 700; white-space: nowrap; margin-left: 6px; }
.mini-buy-btn { width: 52px; height: 32px; border-radius: 999px; background: linear-gradient(135deg, #6658f5, #8377fb); color: #fff; font-size: 11px; font-weight: 700; box-shadow: 0 6px 14px rgba(102, 88, 245, 0.2); display: flex; align-items: center; justify-content: center; }
.empty-state, .loading-state { min-height: 220px; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; color: #75829c; }
.empty-icon { width: 42px; height: 42px; margin-bottom: 12px; }
.empty-title { font-size: 14px; color: #69758e; font-weight: 600; }
.empty-desc { font-size: 11px; margin-top: 6px; }

/* ===== 金色模板 F-3 ===== */
.gold-mall { padding: 12px 18px 0; background: #fffaf2; }
.g-shop-hero { width: 100%; border-radius: 16px; overflow: hidden; margin-bottom: 12px; box-shadow: 0 8px 24px rgba(255, 180, 0, 0.12); }
.g-shop-hero image { width: 100%; }
.g-shop-banner { position: relative; border-radius: 16px; overflow: hidden; margin-bottom: 12px; box-shadow: 0 8px 24px rgba(255, 180, 0, 0.12); }
.g-banner-track { display: flex; transition: transform 0.4s ease; }
.g-banner-slide { flex: 0 0 100%; width: 100%; height: 180px; }
.g-banner-img { width: 100%; height: 100%; }
.g-banner-dots { position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 5; }
.g-banner-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255, 255, 255, 0.5); }
.g-banner-dot.active { background: #ffb400; width: 16px; border-radius: 4px; }
.g-shop-search { height: 48px; border: 1px solid #f6d67b; background: #fff; border-radius: 26px; display: flex; align-items: center; gap: 8px; padding: 0 14px; margin-bottom: 10px; }
.g-search-ico { width: 18px; height: 18px; flex-shrink: 0; }
.g-shop-search input { flex: 1; font-size: 14px; min-width: 0; }
.g-search-clear { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #a4a5a9; flex-shrink: 0; }
.g-shop-categories { white-space: nowrap; margin-bottom: 10px; padding: 5px; border: 1px solid #eee9df; border-radius: 14px; background: #fff; box-shadow: 0 3px 8px rgba(82, 65, 44, 0.06); }
.g-cat-btn { display: inline-flex; align-items: center; height: 34px; padding: 0 14px; border-radius: 18px; color: #77736d; font-size: 13px; margin-right: 7px; }
.g-cat-btn.active { color: #8d5700; background: linear-gradient(90deg, #ffe590, #ffd05b); font-weight: 700; }
.g-section-heading { display: flex; align-items: center; margin-bottom: 10px; padding: 0 2px; }
.g-heading-title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; color: #15171b; }
.g-heading-bar { width: 5px; height: 16px; border-radius: 99px; background: #ffb400; display: inline-block; }
.g-product-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.g-product-card { width: calc(50% - 6px); overflow: hidden; display: flex; flex-direction: column; border: 1px solid #ece9e3; border-radius: 14px; background: #fff; box-shadow: 0 3px 8px rgba(82, 65, 44, 0.07); }
.g-product-media { position: relative; width: 100%; height: 0; padding-bottom: 100%; overflow: hidden; background: #f8f5ef; }
.g-product-media image { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.g-product-name { min-height: 38px; margin: 8px 9px 6px; font-size: 14px; line-height: 1.38; font-weight: 500; color: #15171b; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.g-product-actions { display: flex; flex-direction: column; gap: 6px; padding: 0 8px 8px; }
.g-product-price { display: flex; align-items: center; min-height: 22px; }
.g-product-price.is-member { justify-content: space-between; }
.g-member-label { display: flex; align-items: center; gap: 3px; }
.g-member-tag { padding: 2px 4px; border-radius: 3px; color: #9b6200; background: #fff0c9; font-size: 9px; font-weight: 700; }
.g-member-amount { color: #ed241e; font-size: 18px; font-weight: 700; }
.g-normal-price { color: #8d8a85; font-size: 10px; text-decoration: line-through; }
.g-single-price { color: #ed241e; font-size: 18px; font-weight: 700; }
.g-buy-btn { width: 100%; height: 36px; border: 1px solid rgba(232, 157, 0, 0.18); border-radius: 20px; color: #3a2500; background: linear-gradient(90deg, #ffd65d, #ffb91e); box-shadow: 0 4px 10px rgba(255, 176, 0, 0.22); font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.g-empty-state, .g-loading-state { min-height: 200px; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; color: #999; }
.g-empty-title { font-size: 14px; color: #69758e; font-weight: 600; }
.g-empty-desc { font-size: 11px; margin-top: 6px; }
</style>
