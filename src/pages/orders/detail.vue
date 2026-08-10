<template>
  <view class="detail-page" v-if="!loading && order">
    <!-- 状态条 -->
    <view :class="['status-banner', statusClass(order.order_status)]">
      <text class="status-ico">{{ statusIcon(order.order_status) }}</text>
      <view class="status-text">
        <text class="status-title">{{ order.order_status_text }}</text>
        <text class="status-desc" v-if="order.order_status === 'pending_payment'">请尽快完成支付</text>
        <text class="status-desc" v-else-if="order.order_status === 'pending_ship'">商家备货中，请耐心等待</text>
        <text class="status-desc" v-else-if="order.order_status === 'pending_receive'">商品已发出，请注意查收</text>
        <text class="status-desc" v-else-if="order.order_status === 'completed'">订单已完成，感谢您的购买</text>
      </view>
    </view>

    <!-- 物流卡（已发货才显示） -->
    <view class="logistics-card" v-if="order.tracking_no" @click="goLogistics">
      <view class="logistics-left">
        <text class="logistics-ico">🚚</text>
        <view class="logistics-info">
          <text class="logistics-company">{{ order.logistics_company || '物流公司' }}</text>
          <text class="logistics-no">运单号：{{ order.tracking_no }}</text>
        </view>
      </view>
      <text class="logistics-arrow">查看 ›</text>
    </view>

    <!-- 收货地址卡 -->
    <view class="address-card">
      <view class="card-title">
        <text class="title-ico">📍</text>
        <text class="title-text">收货信息</text>
      </view>
      <view class="address-body">
        <view class="receiver">
          <text class="name">{{ order.receiver_name || '—' }}</text>
          <text class="phone">{{ order.receiver_phone || '—' }}</text>
        </view>
        <text class="addr">{{ order.receiver_address || '—' }}</text>
      </view>
    </view>

    <!-- 商品卡 -->
    <view class="goods-card">
      <view class="card-title">
        <text class="title-ico">📦</text>
        <text class="title-text">商品信息</text>
        <text class="shop-name" v-if="order.enterprise_name">{{ order.enterprise_name }}</text>
      </view>
      <view class="goods-row">
        <view class="goods-cover">
          <image v-if="order.product_image" :src="getImageUrl(order.product_image)" class="cover-img"
            mode="aspectFill" />
          <view v-else class="cover-placeholder"><text>📦</text></view>
        </view>
        <view class="goods-info">
          <text class="goods-name">{{ order.product_name }}</text>
          <text class="goods-sku" v-if="order.sku_name">{{ order.sku_name }}</text>
        </view>
        <view class="goods-side">
          <text class="price">¥{{ Number(order.original_amount || order.amount || 0).toFixed(2) }}</text>
          <text class="qty">×{{ order.qty || 1 }}</text>
        </view>
      </view>
      <view class="price-detail">
        <view class="row">
          <text>商品金额</text>
          <text>¥{{ Number(order.original_amount || order.amount || 0).toFixed(2) }}</text>
        </view>
        <view class="row">
          <text>运费</text>
          <text class="free">免邮</text>
        </view>
        <view class="row" v-if="Number(order.balance_deduct || 0) > 0">
          <text>余额抵扣</text>
          <text class="deduct">-¥{{ Number(order.balance_deduct || 0).toFixed(2) }}</text>
        </view>
        <view class="row total">
          <text>实付</text>
          <text class="total-value">¥{{ Number(order.amount || 0).toFixed(2) }}</text>
        </view>
      </view>
    </view>

    <!-- 订单信息卡 -->
    <view class="info-card">
      <view class="card-title">
        <text class="title-ico">📋</text>
        <text class="title-text">订单信息</text>
      </view>
      <view class="info-row">
        <text class="info-label">订单编号</text>
        <view class="info-value-copy" @click="copyText(order.order_no)">
          <text>{{ order.order_no }}</text>
          <text class="copy-badge">复制</text>
        </view>
      </view>
      <view class="info-row" v-if="order.wx_transaction_id">
        <text class="info-label">微信支付单号</text>
        <text class="info-value">{{ order.wx_transaction_id }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">下单时间</text>
        <text class="info-value">{{ order.created_at || '—' }}</text>
      </view>
      <view class="info-row" v-if="order.paid_at">
        <text class="info-label">支付时间</text>
        <text class="info-value">{{ order.paid_at }}</text>
      </view>
      <view class="info-row" v-if="order.shipped_at">
        <text class="info-label">发货时间</text>
        <text class="info-value">{{ order.shipped_at }}</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="footer-bar" v-if="showFooter">
      <view v-if="order.order_status === 'pending_receive'" class="footer-btn primary" @click="onConfirm">
        <text>确认收货</text>
      </view>
      <view v-if="order.order_status === 'pending_receive' && order.tracking_no" class="footer-btn outline"
        @click="goLogistics"><text>查看物流</text></view>
    </view>
  </view>

  <!-- 加载中 -->
  <view v-else-if="loading" class="loading-state">
    <text>加载中...</text>
  </view>

  <!-- 加载失败 -->
  <view v-else class="empty-state">
    <text>订单不存在或加载失败</text>
    <view class="back-btn" @click="goBack"><text>返回</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMyMallOrderDetail, confirmMallReceive } from '@/api/miniapp'
import { navigator, showToast, showConfirm, copyToClipboard } from '@/utils'
import { getImageUrl } from '@/utils/image'

const orderId = ref(0)
const order = ref<any>(null)
const loading = ref(false)

const showFooter = computed(() => {
  const s = order.value?.order_status
  return s === 'pending_receive'
})

function statusClass(status: string): string {
  const map: Record<string, string> = {
    pending_payment: 'warn',
    pending_ship: 'info',
    pending_receive: 'primary',
    completed: 'done',
    refund: 'refund',
    closed: 'closed',
  }
  return map[status] || 'info'
}

function statusIcon(status: string): string {
  const map: Record<string, string> = {
    pending_payment: '💰',
    pending_ship: '📦',
    pending_receive: '🚚',
    completed: '✅',
    refund: '↩️',
    closed: '🔒',
  }
  return map[status] || '📦'
}

async function loadData() {
  if (!orderId.value) return
  loading.value = true
  try {
    const res: any = await getMyMallOrderDetail(orderId.value)
    if (res.code === 200 || res.code === 0) {
      order.value = res.data
    }
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

function goLogistics() {
  if (!order.value) return
  navigator.push(`/m/logistics/${order.value.id}`)
}

function goBack() {
  navigator.back()
}

async function copyText(text: string) {
  if (!text) return
  await copyToClipboard(text)
  showToast('已复制', 'success')
}

async function onConfirm() {
  const confirmed = await showConfirm('确认收货', '确认已收到商品？确认后订单将完成。')
  if (!confirmed) return
  try {
    const res: any = await confirmMallReceive(order.value.id)
    if (res.code === 200 || res.code === 0) {
      showToast('已确认收货', 'success')
      order.value = res.data
    }
  } catch {
    // 错误已在拦截器提示
  }
}

onLoad((options: any) => {
  orderId.value = Number(options?.id) || 0
  loadData()
})
</script>

<style scoped lang="scss">
.detail-page {
  min-height: 100vh;
  background: #f5f7fb;
  /* 为微信小程序导航栏预留空间 */
}

.page-head {
  position: sticky;
  top: 30px;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  padding-top: env(safe-area-inset-top);
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

/* 状态横幅 */
.status-banner {
  position: relative;
  top: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 16px;
  margin-top: 0;
  /* 确保没有负margin */
}

.status-banner.warn {
  background: linear-gradient(135deg, #f59e0b, #f97316);
}

.status-banner.info {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.status-banner.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.status-banner.done {
  background: linear-gradient(135deg, #10b981, #059669);
}

.status-banner.refund,
.status-banner.closed {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.status-ico {
  font-size: 32px;
}

.status-text {
  display: flex;
  flex-direction: column;
}

.status-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 2px;
}

.status-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

/* 物流卡 */
.logistics-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(67, 109, 157, 0.05);
}

.logistics-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logistics-ico {
  font-size: 22px;
}

.logistics-info {
  display: flex;
  flex-direction: column;
}

.logistics-company {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.logistics-no {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.logistics-arrow {
  font-size: 13px;
  color: #6366f1;
  font-weight: 500;
}

/* 地址卡 */
.address-card,
.goods-card,
.info-card {
  margin: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(67, 109, 157, 0.05);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}

.title-ico {
  font-size: 16px;
}

.title-text {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.shop-name {
  font-size: 12px;
  color: #6366f1;
  font-weight: 500;
}

.address-body .receiver {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.address-body .receiver .name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.address-body .receiver .phone {
  font-size: 14px;
  color: #475569;
}

.address-body .addr {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

/* 商品行 */
.goods-row {
  display: flex;
  gap: 10px;
}

.goods-cover {
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  font-size: 28px;
  color: #cbd5e1;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.goods-name {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.goods-sku {
  font-size: 12px;
  color: #64748b;
}

.goods-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.goods-side .price {
  font-size: 14px;
  font-weight: 700;
  color: #ef4444;
}

.goods-side .qty {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.price-detail {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eef2f7;
}

.price-detail .row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;
  color: #64748b;
}

.price-detail .row.total {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px solid #f1f5f9;
  font-size: 14px;
  color: #1e293b;
  font-weight: 600;
}

.total-value {
  color: #ef4444;
  font-weight: 700;
  font-size: 16px;
}

.free {
  color: #10b981;
}

.deduct {
  color: #ef4444;
  font-weight: 600;
}

/* 订单信息 */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px dashed #f1f5f9;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #64748b;
}

.info-value {
  color: #1e293b;
  font-weight: 500;
  text-align: right;
}

.info-value-copy {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-value-copy text {
  color: #6366f1;
  font-weight: 500;
}

.copy-badge {
  font-size: 11px;
  background: #e0e7ff;
  color: #6366f1;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 500;
}

/* 底部操作 */
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #eef2f7;
  z-index: 20;
}

.footer-btn {
  flex: 1;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-btn text {
  font-size: 14px;
  font-weight: 500;
}

.footer-btn.outline {
  background: #fff;
  border: 1px solid #cbd5e1;
}

.footer-btn.outline text {
  color: #475569;
}

.footer-btn.primary {
  background: #6366f1;
  border: 1px solid #6366f1;
}

.footer-btn.primary text {
  color: #fff;
}

/* 状态 */
.loading-state,
.empty-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  color: #94a3b8;
}

.back-btn {
  margin-top: 16px;
  height: 36px;
  padding: 0 20px;
  background: #6366f1;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn text {
  color: #fff;
  font-size: 13px;
}
</style>
