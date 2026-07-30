<template>
  <view class="checkout-wrap" v-if="!loading">
    <!-- 顶部标题栏 + 后退 -->
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">确认订单</text>
    </view>

    <view class="checkout-page">
      <!-- 收货地址卡（只读展示，修改地址请到地址簿） -->
      <view class="address-card" @click="goAddresses">
        <view class="card-title-row">
          <text class="card-title">📦 收货信息</text>
          <view class="use-default-btn"><text>地址簿 ›</text></view>
        </view>

        <!-- 有地址：只读紧凑展示 -->
        <view v-if="currentAddress" class="addr-readonly">
          <view class="addr-line addr-line-main">
            <text class="addr-name">{{ currentAddress.name || '—' }}</text>
            <text class="addr-phone">{{ currentAddress.phone || '—' }}</text>
          </view>
          <text class="addr-line addr-region">{{ regionText(currentAddress) }}</text>
          <text class="addr-line addr-detail">{{ currentAddress.detail || (currentAddress.full_address || currentAddress.address || '') }}</text>
        </view>

        <!-- 无地址空态 -->
        <view v-else class="addr-empty" @click.stop="goAddresses">
          <text class="addr-empty-ico">📍</text>
          <text class="addr-empty-text">请选择收货地址</text>
          <view class="addr-empty-btn"><text>去地址簿选择</text></view>
        </view>
      </view>

      <!-- 商品快照卡 -->
      <view class="product-card" v-if="product">
        <view class="product-row">
          <view class="product-cover">
            <image
              v-if="product.main_image || currentSku?.sku_image"
              :src="currentSku?.sku_image || product.main_image"
              class="cover-img"
              mode="aspectFill"
            />
            <view v-else class="cover-placeholder"><text>📦</text></view>
          </view>
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-sku" v-if="currentSku">{{ currentSku.sku_name }}</text>
            <view class="product-price-row">
              <text class="unit-price">¥{{ unitPrice }}</text>
              <text class="unit-original-price" v-if="originalUnitPrice">¥{{ originalUnitPrice }}</text>
              <text class="member-badge" v-if="usingMemberPrice">会员专享</text>
              <text class="qty">×{{ qty }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 余额支付开关 -->
      <view class="balance-card" v-if="userBalance > 0">
        <view class="balance-info">
          <text class="balance-title">钱包余额支付</text>
          <text class="balance-amount">当前余额 ¥{{ userBalance.toFixed(2) }}</text>
        </view>
        <view
          class="switch"
          :class="{ on: useBalance }"
          @click="toggleUseBalance"
        >
          <view class="switch-knob"></view>
        </view>
      </view>

      <!-- 价格明细 -->
      <view class="price-detail-card">
        <view class="detail-row">
          <text class="detail-label">商品金额</text>
          <text class="detail-value">¥{{ totalAmount }}</text>
        </view>
        <view class="detail-row">
          <text class="detail-label">运费</text>
          <text class="detail-value free">免邮</text>
        </view>
        <view class="detail-row" v-if="useBalance && balanceDeduct > 0">
          <text class="detail-label">余额抵扣</text>
          <text class="detail-value deduct">-¥{{ balanceDeduct.toFixed(2) }}</text>
        </view>
        <view class="detail-row total-row">
          <text class="detail-label">实付</text>
          <text class="total-value">¥{{ payAmount }}</text>
        </view>
      </view>

      <!-- 底部提交栏 -->
      <view class="submit-bar">
        <view class="submit-amount">
          <text class="submit-label">实付：</text>
          <text class="submit-value">¥{{ payAmount }}</text>
        </view>
        <view
          class="submit-btn"
          :class="{ disabled: submitting }"
          @click="submitOrder"
        >
          <text>{{ submitting ? '提交中...' : '提交订单' }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 加载中 -->
  <view class="loading-page" v-else>
    <text>加载中...</text>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getMiniappMallProduct, createMallOrderV2, simulateMallPay } from '@/api/miniapp'
import { getDefaultAddress, getAddresses, getUserProfile } from '@/api/miniapp'
import { navigator, showToast } from '@/utils'

const loading = ref(true)
const submitting = ref(false)
const product = ref<any>(null)
const userBalance = ref(0)
const useBalance = ref(false)

// 页面参数
const productId = ref(0)
const skuId = ref(0)
const qty = ref(1)
const selectedAddressId = ref(0)

// 当前生效地址
const defaultAddress = ref<any>(null)
const currentAddress = computed(() => defaultAddress.value)

/** 拼接地区文本（省/市/区） */
function regionText(addr: any): string {
  if (!addr) return ''
  const parts = [addr.province, addr.city, addr.district].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return addr.full_address || addr.address || ''
}

async function loadDefaultAddress() {
  try {
    const res: any = await getDefaultAddress()
    defaultAddress.value = res?.data || null
  } catch {
    defaultAddress.value = null
  }
}

/** 从地址簿选择返回后，按 address_id 加载指定地址回填 */
async function loadSelectedAddress(addressId: number) {
  try {
    const res: any = await getAddresses()
    const list = res?.data || []
    const target = (Array.isArray(list) ? list : []).find((a: any) => a.id === addressId)
    if (target) {
      defaultAddress.value = target
      showToast('已切换地址', 'success')
    }
  } catch {
    // 忽略，回退到默认地址
  }
}

/** 跳转地址簿，带 redirect 以便选择后返回结算页 */
function goAddresses() {
  const redirect = `/m/mall/checkout?product_id=${productId.value}&sku_id=${skuId.value}&qty=${qty.value}`
  navigator.push(`/m/addresses?redirect=${encodeURIComponent(redirect)}`)
}

function goBack() {
  navigator.back()
}

// 当前 SKU
const currentSku = computed(() => {
  const skus = product.value?.skus || []
  return skus.find((s: any) => s.id === skuId.value) || null
})

// 单价（优先使用有效会员价）
const unitPrice = computed(() => {
  const sku = currentSku.value
  if (sku) {
    const mp = Number(sku.member_price || 0)
    const ep = Number(sku.enterprise_price || 0)
    if (mp > 0 && mp < ep) return mp.toFixed(2)
    if (ep > 0) return ep.toFixed(2)
  }
  return Number(product.value?.retail_price || 0).toFixed(2)
})

const usingMemberPrice = computed(() => {
  const sku = currentSku.value
  if (!sku) return false
  const mp = Number(sku.member_price || 0)
  const ep = Number(sku.enterprise_price || 0)
  return mp > 0 && mp < ep
})

const originalUnitPrice = computed(() => {
  if (!usingMemberPrice.value) return ''
  const sku = currentSku.value
  const ep = Number(sku?.enterprise_price || 0)
  return ep > 0 ? ep.toFixed(2) : ''
})

const totalAmount = computed(() => {
  return (Number(unitPrice.value) * qty.value).toFixed(2)
})

const balanceDeduct = computed(() => {
  if (!useBalance.value || userBalance.value <= 0) return 0
  const total = Number(totalAmount.value)
  const maxDeduct = Math.max(total - 0.01, 0)
  return Math.min(userBalance.value, maxDeduct)
})

const payAmount = computed(() => {
  const pay = Number(totalAmount.value) - balanceDeduct.value
  return Math.max(pay, 0.01).toFixed(2)
})

function toggleUseBalance() {
  if (userBalance.value <= 0) {
    showToast('当前余额为 0，无法使用余额支付')
    return
  }
  useBalance.value = !useBalance.value
}

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
  } catch (e) {
    console.error('加载商品失败', e)
    product.value = null
  } finally {
    loading.value = false
  }
  loadDefaultAddress()
  loadUserBalance()
}

async function loadUserBalance() {
  try {
    const res: any = await getUserProfile()
    userBalance.value = Number(res?.data?.balance || 0)
  } catch {
    userBalance.value = 0
  }
}

function validateAddress(): string | null {
  const addr = currentAddress.value
  if (!addr) return '请先选择收货地址'
  if (!addr.name || !addr.name.trim()) return '收件人姓名缺失，请到地址簿补全'
  if (!addr.phone || !/^1\d{10}$/.test(String(addr.phone).trim())) return '手机号不正确，请到地址簿补全'
  if (!(addr.province && addr.city)) return '地区信息不完整，请到地址簿补全'
  if (!(addr.detail && addr.detail.trim())) return '详细地址缺失，请到地址簿补全'
  return null
}

function buildFullAddress(): string {
  const addr = currentAddress.value
  if (!addr) return ''
  return `${addr.province || ''} ${addr.city || ''} ${addr.district || ''} ${(addr.detail || '').trim()}`.replace(/\s+/g, ' ').trim()
}

async function submitOrder() {
  if (submitting.value) return

  const err = validateAddress()
  if (err) {
    showToast(err)
    return
  }

  if (!product.value || !currentSku.value) {
    showToast('商品信息缺失，请返回重试')
    return
  }

  const addr = currentAddress.value
  submitting.value = true

  try {
    const res: any = await createMallOrderV2({
      product_id: productId.value,
      sku_id: skuId.value,
      qty: qty.value,
      receiver_name: (addr.name || '').trim(),
      receiver_phone: String(addr.phone || '').trim(),
      receiver_address: buildFullAddress(),
      use_balance: useBalance.value,
    })

    const data = res?.data?.data || res?.data || {}

    if (data.mode === 'jsapi') {
      await handleJsapiPay(data)
    } else if (data.mode === 'simulate') {
      await handleSimulatePay(data)
    } else {
      showToast('下单异常：未知 mode')
      submitting.value = false
    }
  } catch (e: any) {
    console.error('下单失败', e)
    const msg = e?.message || '下单失败'
    showToast(msg)
    submitting.value = false
  }
}

// JSAPI 真实支付
async function handleJsapiPay(data: any) {
  const params = data.pay_params
  if (!params || !params.timeStamp) {
    showToast('支付参数异常')
    submitting.value = false
    return
  }

  // #ifdef MP-WEIXIN
  uni.requestPayment({
    provider: 'wxpay',
    timeStamp: params.timeStamp,
    nonceStr: params.nonceStr,
    package: params.package,
    signType: params.signType,
    paySign: params.paySign,
    success: () => {
      showToast('支付成功', 'success')
      submitting.value = false
      setTimeout(() => {
        navigator.replace('/m/orders')
      }, 1200)
    },
    fail: (err: any) => {
      console.warn('支付取消或失败', err)
      showToast('支付已取消，可在订单中重新支付')
      submitting.value = false
      setTimeout(() => {
        navigator.replace('/m/orders')
      }, 1500)
    },
  })
  // #endif

  // #ifndef MP-WEIXIN
  // H5 端降级为模拟支付
  try {
    await simulateMallPay(data.order_id)
    showToast('支付成功', 'success')
    submitting.value = false
    setTimeout(() => {
      navigator.replace('/m/orders')
    }, 1200)
  } catch (e: any) {
    console.error('模拟支付失败', e)
    showToast(e?.message || '模拟支付失败')
    submitting.value = false
  }
  // #endif
}

// 模拟支付兜底
async function handleSimulatePay(data: any) {
  try {
    await simulateMallPay(data.order_id)
    showToast('支付成功', 'success')
    submitting.value = false
    setTimeout(() => {
      navigator.replace('/m/orders')
    }, 1200)
  } catch (e: any) {
    console.error('模拟支付失败', e)
    const msg = e?.message || '模拟支付失败'
    showToast(msg)
    submitting.value = false
  }
}

onLoad((options: any) => {
  productId.value = Number(options?.product_id) || 0
  skuId.value = Number(options?.sku_id) || 0
  qty.value = Number(options?.qty) || 1
  selectedAddressId.value = Number(options?.address_id) || 0
  loadProduct()
})

// 从地址簿选择返回时重新加载
onShow(() => {
  if (selectedAddressId.value && productId.value) {
    loadSelectedAddress(selectedAddressId.value)
    selectedAddressId.value = 0 // 消费一次
  }
})
</script>

<style scoped lang="scss">
/* 顶部标题栏 */
.page-head {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #eef2f7;
}
.page-head .back {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-head .back text {
  font-size: 26px;
  color: #1e293b;
}
.page-title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
  padding-right: 36px;
}

.checkout-page {
  padding: 12px 12px 90px;
  background: #f4f9ff;
  min-height: calc(100vh - 48px);
}

/* 卡片通用 */
.address-card,
.product-card,
.price-detail-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 10px rgba(40, 83, 129, 0.04);
}
.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a2332;
}
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f4fa;
}
.use-default-btn text {
  color: #6366f1;
  font-size: 12px;
  font-weight: 500;
}

/* 只读地址展示 */
.addr-readonly {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.addr-line {
  line-height: 1.5;
}
.addr-line-main {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.addr-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a2332;
}
.addr-phone {
  font-size: 13px;
  color: #475569;
}
.addr-region {
  font-size: 13px;
  color: #5a6878;
}
.addr-detail {
  font-size: 13px;
  color: #1a2332;
  line-height: 1.6;
}

/* 无地址空态 */
.addr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0 8px;
}
.addr-empty-ico {
  font-size: 28px;
}
.addr-empty-text {
  font-size: 13px;
  color: #8d99aa;
}
.addr-empty-btn {
  margin-top: 4px;
  height: 32px;
  padding: 0 18px;
  border-radius: 16px;
  background: linear-gradient(135deg, #5b5cf0 0%, #7b6cf0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.addr-empty-btn text {
  color: #fff;
  font-size: 12px;
  font-weight: 500;
}

/* 商品卡 */
.product-row {
  display: flex;
  gap: 12px;
}
.product-cover {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  background: #f4f7fb;
  flex-shrink: 0;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #c5cfdb;
}
.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.product-name {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1a2332;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.product-sku {
  margin-bottom: 8px;
  font-size: 12px;
  color: #8d99aa;
}
.product-price-row {
  margin-top: auto;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
}
.unit-price {
  font-size: 15px;
  font-weight: 700;
  color: #ff4d4f;
}
.unit-original-price {
  font-size: 12px;
  color: #a8b3c2;
  text-decoration: line-through;
}
.member-badge {
  background: linear-gradient(135deg, #ffb84d 0%, #ff9a3c 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
}
.qty {
  font-size: 13px;
  color: #8d99aa;
  margin-left: auto;
}

/* 价格明细 */
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}
.detail-label {
  font-size: 13px;
  color: #5a6878;
}
.detail-value {
  font-size: 13px;
  color: #1a2332;
}
.detail-value.free {
  color: #52c41a;
}
.detail-value.deduct {
  color: #ff4d4f;
  font-weight: 600;
}
.total-row {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid #f0f4fa;
}
.total-value {
  font-size: 17px;
  font-weight: 800;
  color: #ff4d4f;
}

/* 余额支付开关 */
.balance-card {
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 10px rgba(40, 83, 129, 0.04);
}
.balance-info {
  flex: 1;
}
.balance-title {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a2332;
}
.balance-amount {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #8d99aa;
}
.switch {
  width: 46px;
  height: 26px;
  border-radius: 13px;
  background: #e4e7eb;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.switch.on {
  background: linear-gradient(135deg, #5b5cf0 0%, #7b6cf0 100%);
}
.switch-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s;
}
.switch.on .switch-knob {
  transform: translateX(20px);
}

/* 提交栏 */
.submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  height: 60px;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid #e0eaf5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  padding-right: 16px;
}
.submit-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.submit-label {
  font-size: 13px;
  color: #5a6878;
}
.submit-value {
  font-size: 20px;
  font-weight: 800;
  color: #ff4d4f;
}
.submit-btn {
  height: 44px;
  padding: 0 36px;
  border-radius: 22px;
  background: linear-gradient(135deg, #5b5cf0 0%, #7b6cf0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.submit-btn text {
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}
.submit-btn.disabled {
  background: #c5cfdb;
}

/* 加载态 */
.loading-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f9ff;
  color: #8d99aa;
  font-size: 14px;
}
</style>
