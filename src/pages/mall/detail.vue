<template>
  <view class="detail-page" v-if="!loading && product">
    <!-- 浮动返回按钮 -->
    <view class="back-floater" @click="goBack">
      <text class="back-arrow">‹</text>
    </view>
    <!-- 主图轮播 -->
    <view class="swiper" v-if="imageList.length > 0">
      <view class="swiper-track" :style="{ transform: `translateX(-${currentImage * 100}%)` }">
        <view v-for="(img, idx) in imageList" :key="idx" class="swiper-slide" @click="previewImages(idx)">
          <image :src="getImageUrl(img)" class="swiper-img" mode="aspectFill" />
        </view>
      </view>
      <!-- 指示器 -->
      <view class="swiper-dots" v-if="imageList.length > 1">
        <view v-for="(_, idx) in imageList" :key="idx" class="dot" :class="{ active: currentImage === idx }"
          @click="currentImage = idx"></view>
      </view>
      <!-- 来源标签 -->
      <view v-if="product.source === 'saas_sync'" class="source-badge"><text>SAAS严选</text></view>
    </view>

    <!-- 商品基础信息 -->
    <view class="info-card">
      <view class="price-row">
        <view class="price-main">
          <text class="price-symbol">¥</text>
          <text class="price-value">{{ minPrice }}</text>
        </view>
        <view class="price-member" v-if="minMemberPrice">
          <text class="member-tag">会员</text>
          <text class="member-value">¥{{ minMemberPrice }}</text>
        </view>
      </view>
      <text class="product-name">{{ product.name }}</text>
      <text class="product-subtitle" v-if="product.subtitle">{{ product.subtitle }}</text>
    </view>

    <!-- 规格选择区（点击弹出规格弹窗） -->
    <view class="spec-select-card" v-if="product.spec1_name || product.spec2_name" @click="openSpecSheet">
      <text class="spec-label">选择</text>
      <text class="spec-value">{{ selectedSpecText }}</text>
      <text class="spec-arrow">›</text>
    </view>

    <!-- 富文本详情 -->
    <view class="detail-card" v-if="product.detail_html">
      <text class="card-title">商品详情</text>
      <rich-text class="rich-content" :nodes="processedDetailHtml"></rich-text>
    </view>

    <!-- 详情长图（备选展示） -->
    <view class="detail-card" v-else-if="detailImages.length > 0">
      <text class="card-title">商品详情</text>
      <view class="detail-images">
        <image v-for="(img, idx) in detailImages" :key="idx" :src="img" class="detail-img" mode="widthFix" />
      </view>
    </view>

    <!-- 底部操作栏：客服 + 分享 + 立即购买 -->
    <view class="action-bar">
      <view class="action-icon-btn" @click="goHome">
        <text class="action-icon-glyph">🏠</text>
        <text class="action-icon-text">首页</text>
      </view>
      <view class="action-icon-btn" @click="sharePopupVisible = true">
        <text class="action-icon-glyph">↗</text>
        <text class="action-icon-text">分享</text>
      </view>
      <view class="buy-btn" @click="openSpecSheet">
        <text class="buy-btn-main">立即购买</text>
        <text class="buy-btn-sub" v-if="minPrice">¥{{ minPrice }} 起</text>
      </view>
    </view>

    <!-- 分享弹窗 -->
    <view class="share-popup-mask" v-if="sharePopupVisible" @click="sharePopupVisible = false"></view>
    <view class="share-popup" v-if="sharePopupVisible" @click.stop>
      <text class="share-popup-title">分享至</text>
      <view class="share-options">
        <button class="share-option" open-type="share" @click="sharePopupVisible = false">
          <view class="share-option-icon wechat-icon"><text>微</text></view>
          <text class="share-option-text">微信好友</text>
        </button>
        <view class="share-option" @click="shareToTimeline">
          <view class="share-option-icon moments-icon"><text>圈</text></view>
          <text class="share-option-text">朋友圈</text>
        </view>
      </view>
      <view class="share-popup-cancel" @click="sharePopupVisible = false">取消</view>
    </view>

    <!-- 规格弹窗 -->
    <PurchaseSpecSheet v-if="specSheetVisible && product" :product="product" :visible="specSheetVisible"
      @close="specSheetVisible = false" @confirm="handleSpecConfirm" />
  </view>

  <!-- 加载中 -->
  <view class="loading-page" v-else-if="loading">
    <text>加载中...</text>
  </view>

  <!-- 空状态 -->
  <view class="empty-page" v-else>
    <text class="empty-icon">📦</text>
    <text>商品不存在或已下架</text>
    <view class="back-btn" @click="goBack"><text>返回商城</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMiniappMallProduct } from '@/api/miniapp'
import PurchaseSpecSheet from '@/components/PurchaseSpecSheet.vue'
import { useShare } from '@/composables/useShare'
import { navigator, previewImage, showToast } from '@/utils'
import { getImageUrl } from '@/utils/image'

// 注册商品分享：分享当前商品详情页 + 自动携带邀请参数
useShare(() => ({
  title: product.value?.name || '快来看看这个好商品',
  path: '/pages/mall/detail',
  pathParams: { id: productId.value },
  imageUrl: product.value?.share_image || '',
}))

const productId = ref(0)
const product = ref<any>(null)
const loading = ref(true)
const currentImage = ref(0)
const specSheetVisible = ref(false)
const sharePopupVisible = ref(false)

// 选中规格快照（供规格选择区展示）
const selectedSkuSnapshot = ref<any>(null)

// 主图列表（images 数组 + main_image 兜底）
const imageList = computed<string[]>(() => {
  if (!product.value) return []
  const imgs = Array.isArray(product.value.images) ? product.value.images : []
  if (imgs.length > 0) return imgs
  if (product.value.main_image) return [product.value.main_image]
  return []
})

// 详情长图
const detailImages = computed<string[]>(() => {
  if (!product.value) return []
  return Array.isArray(product.value.detail_images) ? product.value.detail_images : []
})

// 最低售价
const minPrice = computed(() => {
  const skus = product.value?.skus || []
  if (skus.length > 0) {
    const prices = skus
      .map((s: any) => Number(s.enterprise_price))
      .filter((p: number) => !isNaN(p) && p > 0)
    if (prices.length > 0) return Math.min(...prices).toFixed(2)
  }
  return Number(product.value?.retail_price || 0).toFixed(2)
})

// 最低会员价
const minMemberPrice = computed(() => {
  const skus = product.value?.skus || []
  if (skus.length > 0) {
    const prices = skus
      .map((s: any) => Number(s.member_price))
      .filter((p: number) => !isNaN(p) && p > 0)
    if (prices.length > 0) return Math.min(...prices).toFixed(2)
  }
  const suggest = Number(product.value?.member_price_suggest || 0)
  return !isNaN(suggest) && suggest > 0 ? suggest.toFixed(2) : null
})

// 处理富文本 HTML：给 img 和 image 标签添加宽度限制
const processedDetailHtml = computed(() => {
  if (!product.value?.detail_html) return ''

  console.log('原始 HTML:', product.value.detail_html)

  let html = product.value.detail_html

  // 处理函数：给标签添加宽度和样式
  const processTag = (tagHtml: string, tagName: string): string => {
    // 1. 移除已有的 width 和 height 属性
    tagHtml = tagHtml.replace(new RegExp(`<${tagName}([^>]*?)\\s+width\\s*=\\s*["'][^"']*["']`, 'gi'), `<${tagName}$1`)
    tagHtml = tagHtml.replace(new RegExp(`<${tagName}([^>]*?)\\s+height\\s*=\\s*["'][^"']*["']`, 'gi'), `<${tagName}$1`)

    // 2. 移除已有 style 中的 width 和 height（rich-text 不支持 max-width）
    tagHtml = tagHtml.replace(new RegExp(`<${tagName}([^>]*?)\\s+style\\s*=\\s*["']([^"']*?)width\\s*:\\s*[^;]+;?([^"']*)["']`, 'gi'), `<${tagName}$1 style="$2$3"`)
    tagHtml = tagHtml.replace(new RegExp(`<${tagName}([^>]*?)\\s+style\\s*=\\s*["']([^"']*?)height\\s*:\\s*[^;]+;?([^"']*)["']`, 'gi'), `<${tagName}$1 style="$2$3"`)

    // 3. 给所有标签添加 width="100%" HTML 属性和 style（使用 width 而不是 max-width）
    tagHtml = tagHtml.replace(new RegExp(`<${tagName}([^>]*?)(\\s+style\\s*=\\s*["']([^"']*)["'])?([^>]*?)(\\/?)>`, 'gi'), (match, before, styleAttr, styleContent, after, selfClosing) => {
      if (styleAttr) {
        // 已有 style 属性，在前面添加 width 和 height
        const newStyle = `width:100%;height:auto;display:block;${styleContent || ''}`
        return `<${tagName}${before} width="100%" style="${newStyle}"${after}${selfClosing}>`
      } else {
        // 没有 style 属性，新增一个
        return `<${tagName}${before} width="100%" style="width:100%;height:auto;display:block;"${after}${selfClosing}>`
      }
    })

    return tagHtml
  }

  // 同时处理 img 和 image 标签
  html = processTag(html, 'img')
  html = processTag(html, 'image')

  // 4. 处理父元素的固定宽度（将固定宽度改为 100%）
  html = html.replace(/style\s*=\s*["']([^"']*?)width\s*:\s*\d+([^"';]*)px([^"']*)["']/gi, 'style="$1width:100%$3"')

  console.log('处理后的 HTML:', html)

  return html
})

// 规格选择区文案
const selectedSpecText = computed(() => {
  if (selectedSkuSnapshot.value) return selectedSkuSnapshot.value.sku_name
  const parts: string[] = []
  if (product.value?.spec1_name) parts.push(product.value.spec1_name)
  if (product.value?.spec2_name) parts.push(product.value.spec2_name)
  return parts.length > 0 ? `请选择 ${parts.join(' / ')}` : '请选择规格'
})

async function loadProduct() {
  if (!productId.value) {
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res: any = await getMiniappMallProduct(productId.value)
    const data = res?.data?.data || res?.data || {}
    product.value = data
    currentImage.value = 0
  } catch (e) {
    console.error('加载商品详情失败', e)
    product.value = null
  } finally {
    loading.value = false
  }
}

function previewImages(idx: number) {
  if (imageList.value.length > 0) {
    previewImage(imageList.value, idx)
  }
}

function openSpecSheet() {
  specSheetVisible.value = true
}

function handleSpecConfirm(payload: { sku: any; qty: number }) {
  specSheetVisible.value = false
  selectedSkuSnapshot.value = payload.sku
  navigator.push(`/m/mall/checkout?product_id=${productId.value}&sku_id=${payload.sku.id}&qty=${payload.qty}`)
}

function goHome() {
  // 返回首页
  uni.reLaunch({
    url: '/pages/home/index'
  })
}

// 朋友圈分享（微信小程序无 open-type 支持，引导用户使用右上角菜单）
function shareToTimeline() {
  sharePopupVisible.value = false
  showToast('请点击右上角···选择「分享到朋友圈」', 'none')
}

function goBack() {
  navigator.back()
}

onLoad((options: any) => {
  productId.value = Number(options?.id) || 0
  loadProduct()
})
</script>

<style scoped lang="scss">
.detail-page {
  padding-bottom: 80px;
  background: #f4f9ff;
  min-height: 100vh;
}

/* 轮播 */
.swiper {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  overflow: hidden;
  background: #fff;
}

.swiper-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  transition: transform 0.3s ease-out;
}

.swiper-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
}

.swiper-img {
  width: 100%;
  height: 100%;
}

.swiper-dots {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 5;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.2s;
}

.dot.active {
  width: 18px;
  background: #fff;
}

.source-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
}

.source-badge text {
  background: linear-gradient(135deg, #ff8a4c 0%, #ff6e6e 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 12px;
}

/* 商品基础信息 */
.info-card {
  background: #fff;
  padding: 16px;
  margin-bottom: 10px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.price-main {
  color: #ff4d4f;
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 14px;
  font-weight: 600;
}

.price-value {
  font-size: 26px;
  font-weight: 800;
  margin-left: 2px;
}

.price-member {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.member-tag {
  background: linear-gradient(135deg, #ffb84d 0%, #ff9a3c 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
}

.member-value {
  font-size: 14px;
  color: #ff9a3c;
  font-weight: 600;
}

.product-name {
  display: block;
  margin-bottom: 6px;
  font-size: 17px;
  font-weight: 700;
  color: #1a2332;
  line-height: 1.4;
}

.product-subtitle {
  display: block;
  font-size: 13px;
  color: #8d99aa;
  line-height: 1.5;
}

/* 规格选择卡片 */
.spec-select-card {
  background: #fff;
  padding: 14px 16px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.spec-label {
  font-size: 14px;
  color: #8d99aa;
  margin-right: 14px;
}

.spec-value {
  flex: 1;
  font-size: 14px;
  color: #1a2332;
  font-weight: 500;
}

.spec-arrow {
  color: #c5cfdb;
  font-size: 20px;
  line-height: 1;
}

/* 详情卡 */
.detail-card {
  background: #fff;
  padding: 16px;
  margin-bottom: 10px;
}

.card-title {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #1a2332;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f4fa;
}

.rich-content {
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  width: 100%;
  overflow: hidden;
}

.rich-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 10px auto;
}


.detail-images {
  display: flex;
  flex-direction: column;
}

.detail-img {
  width: 100%;
}

/* 浮动返回按钮 */
.back-floater {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 30;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-arrow {
  color: #fff;
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  margin-top: -2px;
}

/* 底部操作栏 */
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  height: 66px;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.97);
  border-top: 1px solid #e0eaf5;
  display: flex;
  align-items: center;
  padding-left: 14px;
  padding-right: 14px;
  gap: 12px;
}

.action-icon-btn {
  width: 54px;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex-shrink: 0;
}

.action-icon-glyph {
  font-size: 20px;
  line-height: 1;
}

.action-icon-text {
  font-size: 11px;
  color: #5a6878;
}

.buy-btn {
  flex: 1;
  height: 50px;
  border-radius: 25px;
  background: linear-gradient(135deg, #5b5cf0 0%, #7b6cf0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  box-shadow: 0 8px 18px rgba(91, 92, 240, 0.32);
}

.buy-btn-main {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
}

.buy-btn-sub {
  font-size: 11px;
  opacity: 0.9;
  font-weight: 500;
  color: #fff;
}

/* 加载/空状态 */
.loading-page,
.empty-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f4f9ff;
  color: #8d99aa;
  font-size: 14px;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.back-btn {
  margin-top: 16px;
  padding: 8px 24px;
  border: 1px solid #5b5cf0;
  background: #fff;
  border-radius: 20px;
  font-size: 13px;
}

.back-btn text {
  color: #5b5cf0;
}

/* ===== 分享弹窗 ===== */
.share-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  animation: maskIn 0.2s ease;
}

@keyframes maskIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

.share-popup {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 18px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 201;
  animation: popupIn 0.25s ease;
}

@keyframes popupIn {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

.share-popup-title {
  display: block;
  text-align: center;
  font-size: 14px;
  color: #8d99aa;
  margin-bottom: 20px;
}

.share-options {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding: 0 20px 24px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  line-height: normal;
}

.share-option::after {
  border: none;
}

.share-option-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
}

.wechat-icon {
  background: linear-gradient(135deg, #2dc100, #07c160);
}

.moments-icon {
  background: linear-gradient(135deg, #4ad06a, #2aa84a);
}

.share-option-text {
  font-size: 12px;
  color: #4d5b6e;
}

.share-popup-cancel {
  text-align: center;
  padding: 14px 0 8px;
  font-size: 16px;
  color: #64748b;
  border-top: 1px solid #f1f5f9;
}
</style>
