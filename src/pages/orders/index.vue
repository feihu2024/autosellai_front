<template>
  <view class="orders-page">
    <!-- <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">我的订单</text>
    </view> -->

    <!-- 状态 Tab -->
    <view class="tabs-bar">
      <view v-for="t in tabs" :key="t.value" class="tab" :class="{ active: currentTab === t.value }"
        @click="switchTab(t.value)">
        <text>{{ t.label }}</text>
        <text v-if="counts[t.value]" class="tab-badge">{{ counts[t.value] }}</text>
      </view>
    </view>

    <!-- 订单卡片列表 -->
    <view class="order-list" v-if="!loading && list.length > 0">
      <view class="order-card" v-for="o in list" :key="o.id" @click="goDetail(o.id)">
        <!-- 顶部：店铺/订单号 + 状态 -->
        <view class="card-head">
          <view class="head-left">
            <text class="shop-ico">🏪</text>
            <text class="shop-name">{{ o.enterprise_name || '商城' }}</text>
          </view>
          <text :class="['status-pill', statusClass(o.order_status)]">{{ o.order_status_text }}</text>
        </view>

        <!-- 商品行 -->
        <view class="goods-row">
          <view class="goods-cover">
            <image v-if="o.product_image" :src="getImageUrl(o.product_image)" class="cover-img" mode="aspectFill" />
            <view v-else class="cover-placeholder"><text>📦</text></view>
          </view>
          <view class="goods-info">
            <text class="goods-name">{{ o.product_name }}</text>
            <text class="goods-sku" v-if="o.sku_name">{{ o.sku_name }}</text>
            <text class="goods-qty">×{{ o.qty || 1 }}</text>
          </view>
          <view class="goods-price">
            <text class="amount">¥{{ Number(o.amount || 0).toFixed(2) }}</text>
          </view>
        </view>

        <!-- 底部操作 -->
        <view class="card-foot">
          <text class="order-no">单号 {{ o.order_no }}</text>
        </view>
        <view class="card-actions-row">
          <view class="actions">
            <view v-if="o.order_status === 'pending_receive'" class="btn primary" @click.stop="onConfirm(o)">
              <text>确认收货</text>
            </view>
            <view v-if="o.order_status === 'pending_receive' && o.tracking_no" class="btn outline"
              @click.stop="goLogistics(o.id)"><text>查看物流</text></view>
            <view class="btn outline" @click.stop="goDetail(o.id)"><text>查看详情</text></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && list.length === 0" class="empty-state">
      <text class="empty-icon">🛒</text>
      <text class="empty-text">暂无相关订单</text>
      <view class="go-mall-btn" @click="goMall"><text>去商城逛逛</text></view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMyMallOrders, confirmMallReceive } from '@/api/miniapp'
import { navigator, showToast, showConfirm } from '@/utils'
import { getImageUrl } from '@/utils/image'

const tabs = [
  { label: '全部', value: 'all' },
  { label: '待发货', value: 'pending_ship' },
  { label: '待收货', value: 'pending_receive' },
  { label: '已完成', value: 'completed' },
]

const STATUS_PARAM_MAP: Record<string, string> = {
  all: '',
  pending_ship: 'pending_ship',
  pending_receive: 'pending_receive',
  completed: 'completed',
}

const currentTab = ref<string>('all')
const list = ref<any[]>([])
const loading = ref(false)
const counts = reactive<Record<string, number>>({
  all: 0,
  pending_ship: 0,
  pending_receive: 0,
  completed: 0,
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

function switchTab(tab: string) {
  if (currentTab.value === tab) return
  currentTab.value = tab
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const statusParam = STATUS_PARAM_MAP[currentTab.value] ?? ''
    const res: any = await getMyMallOrders(statusParam)
    if (res.code === 200 || res.code === 0) {
      const data = res.data?.data || res.data || {}
      list.value = data.list.filter((o: any) => o.order_status !== 'pending_payment') || data || []
      const c = data.counts || {}
      counts.all = c.all - c.pending_payment || 0
      counts.pending_ship = c.pending_ship || 0
      counts.pending_receive = c.pending_receive || 0
      counts.completed = c.completed || 0
    }
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function goDetail(id: number) {
  navigator.push(`/m/orders/detail?id=${id}`)
}

function goLogistics(id: number) {
  navigator.push(`/m/orders/logistics?id=${id}`)
}

function goMall() {
  navigator.switchTab('/m/mall')
}

function goBack() {
  navigator.back()
}

async function onConfirm(o: any) {
  const confirmed = await showConfirm('确认收货', '确认已收到商品？确认后订单将完成。')
  if (!confirmed) return
  try {
    const res: any = await confirmMallReceive(o.id)
    if (res.code === 200 || res.code === 0) {
      showToast('已确认收货', 'success')
      loadData()
    }
  } catch {
    // 错误已在拦截器提示
  }
}

onLoad((options: any) => {
  const q = options?.status || ''
  if (q && tabs.some(t => t.value === q)) {
    currentTab.value = q
  }
  loadData()
})
</script>

<style scoped lang="scss">
.orders-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding-bottom: 24px;
  padding-top: env(safe-area-inset-top);
}

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

/* Tabs */
.tabs-bar {
  position: sticky;
  top: 0;
  z-index: 9;
  white-space: nowrap;
  background: #fff;
  border-bottom: 1px solid #eef2f7;
  display: flex;
  justify-content: space-around;
}

.tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 64px;
  padding: 12px 6px;
  white-space: nowrap;
}

.tab text {
  font-size: 13px;
  color: #64748b;
}

.tab.active text {
  color: #6366f1;
  font-weight: 600;
}

.tab.active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 4px;
  transform: translateX(-50%);
  width: 22px;
  height: 3px;
  border-radius: 2px;
  background: #6366f1;
}

.tab-badge {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  margin-left: 4px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  border-radius: 8px;
  text-align: center;
}

/* 订单卡片 */
.order-list {
  padding: 12px;
}

.order-card {
  background: #fff;
  border-radius: 14px;
  margin-bottom: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(67, 109, 157, 0.05);
  border: 1px solid #f0f4fa;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.shop-ico {
  font-size: 14px;
}

.shop-name {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
}

.status-pill {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}

.status-pill.warn {
  color: #f59e0b;
  background: #fef3c7;
}

.status-pill.info {
  color: #3b82f6;
  background: #dbeafe;
}

.status-pill.primary {
  color: #6366f1;
  background: #e0e7ff;
}

.status-pill.done {
  color: #10b981;
  background: #d1fae5;
}

.status-pill.refund {
  color: #ef4444;
  background: #fee2e2;
}

.status-pill.closed {
  color: #6b7280;
  background: #f3f4f6;
}

/* 商品行 */
.goods-row {
  display: flex;
  gap: 10px;
}

.goods-cover {
  width: 72px;
  height: 72px;
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
  font-size: 26px;
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
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.goods-sku {
  margin-bottom: 2px;
  font-size: 12px;
  color: #64748b;
}

.goods-qty {
  font-size: 12px;
  color: #94a3b8;
}

.goods-price {
  align-self: center;
  font-size: 14px;
  font-weight: 700;
  color: #ef4444;
}

/* 底部 */
.card-foot {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #eef2f7;
}

.order-no {
  font-size: 11px;
  color: #94a3b8;
}

.card-actions-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.actions {
  display: flex;
  gap: 6px;
}

.btn {
  height: 28px;
  padding: 0 10px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn text {
  font-size: 12px;
  font-weight: 500;
}

.btn.outline {
  background: #fff;
  border: 1px solid #cbd5e1;
}

.btn.outline text {
  color: #475569;
}

.btn.primary {
  background: #6366f1;
  border: 1px solid #6366f1;
}

.btn.primary text {
  color: #fff;
}

/* 空状态 / 加载 */
.empty-state,
.loading-state {
  text-align: center;
  padding: 60px 16px;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  margin-bottom: 16px;
  font-size: 14px;
}

.go-mall-btn {
  height: 36px;
  padding: 0 20px;
  background: #6366f1;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.go-mall-btn text {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}
</style>
