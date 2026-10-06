<template>
  <view class="logistics-page" v-if="!loading && order">
    <!-- <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">物流详情</text>
    </view> -->

    <!-- 静态物流信息兜底 -->
    <view class="info-card">
      <view class="card-title">
        <text class="title-ico">🚚</text>
        <text class="title-text">物流信息</text>
      </view>
      <view class="info-row">
        <text class="info-label">物流公司</text>
        <text class="info-value">{{ order.logistics_company || '—' }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">运单号</text>
        <view class="info-value-copy" @click="copyText(order.tracking_no)" v-if="order.tracking_no">
          <text>{{ order.tracking_no }}</text>
          <text class="copy-badge">复制</text>
        </view>
        <text class="info-value" v-else>—</text>
      </view>
      <view class="info-row" v-if="order.shipped_at">
        <text class="info-label">发货时间</text>
        <text class="info-value">{{ order.shipped_at }}</text>
      </view>
    </view>

    <!-- 物流轨迹：接口实时查询 -->
    <view class="track-card" v-if="order.tracking_no">
      <view class="card-title">
        <text class="title-ico">📍</text>
        <text class="title-text">物流轨迹</text>
        <text class="track-state" v-if="trackStateText">{{ trackStateText }}</text>
        <text class="track-refresh" v-if="!trackLoading && trackList.length" @click="loadTrack(true)">刷新</text>
      </view>

      <view class="track-loading" v-if="trackLoading">
        <text>物流轨迹加载中...</text>
      </view>

      <view class="track-empty" v-else-if="trackError || !trackList.length">
        <text class="track-empty-text">{{ trackError || '暂无物流轨迹，请稍后刷新查看' }}</text>
        <view class="track-retry-btn" @click="loadTrack(true)"><text>重新加载</text></view>
      </view>

      <view class="track-list" v-else>
        <view
          class="track-item"
          v-for="(item, idx) in trackList"
          :key="idx"
          :class="{ active: idx === 0, last: idx === trackList.length - 1 }"
        >
          <view class="track-rail">
            <view class="track-dot"></view>
            <view class="track-line" v-if="idx !== trackList.length - 1"></view>
          </view>
          <view class="track-content">
            <text class="track-context">{{ item.context }}</text>
            <text class="track-time" v-if="item.time">{{ item.time }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 商品卡 -->
    <view class="goods-card">
      <view class="card-title">
        <text class="title-ico">📦</text>
        <text class="title-text">商品</text>
      </view>
      <view class="goods-row">
        <view class="goods-cover">
          <image v-if="order.product_image" :src="order.product_image" class="cover-img" mode="aspectFill" />
          <view v-else class="cover-placeholder"><text>📦</text></view>
        </view>
        <view class="goods-info">
          <text class="goods-name">{{ order.product_name }}</text>
          <text class="goods-sku" v-if="order.sku_name">{{ order.sku_name }}</text>
          <text class="goods-qty">×{{ order.qty || 1 }}</text>
        </view>
      </view>
    </view>

    <!-- 收货信息 -->
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

    <!-- 提示 -->
    <view class="tip-card" v-if="!order.tracking_no">
      <text class="tip-ico">⏳</text>
      <text class="tip-text">商家尚未填写物流信息，请耐心等待或联系商家咨询。</text>
    </view>

    <!-- 复制运单号去快递查询 -->
    <view class="footer-bar" v-if="order.tracking_no">
      <view class="footer-btn outline" @click="copyText(order.tracking_no)"><text>复制运单号</text></view>
      <view class="footer-btn primary" @click="searchOnline"><text>在线查询</text></view>
    </view>
  </view>

  <view v-else-if="loading" class="loading-state">
    <text>加载中...</text>
  </view>

  <view v-else class="empty-state">
    <text>订单不存在或加载失败</text>
    <view class="back-btn" @click="goBack"><text>返回</text></view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getExpressTrack, getMyMallOrderDetail } from '@/api/miniapp'
import { navigator, showToast, copyToClipboard } from '@/utils'

const orderId = ref(0)
const order = ref<any>(null)
const loading = ref(false)
const trackLoading = ref(false)
const trackLoaded = ref(false)
const trackError = ref('')
const trackStateText = ref('')
const trackList = ref<Array<{ context: string; time: string }>>([])

/** 快递100 状态码映射（后端若未返回文本状态时兜底） */
const EXPRESS_STATE_MAP: Record<string, string> = {
  '0': '运输中',
  '1': '已揽收',
  '2': '疑难件',
  '3': '已签收',
  '4': '退签',
  '5': '派件中',
  '6': '退回中',
  '14': '拒签',
}

function mapExpressState(state: unknown): string {
  if (state === undefined || state === null || state === '') return ''
  return EXPRESS_STATE_MAP[String(state)] || ''
}

/** 兼容多种后端返回结构，归一化为轨迹列表 */
function normalizeTrackList(data: any): Array<{ context: string; time: string }> {
  if (!data) return []
  let raw: any[] = []
  if (Array.isArray(data)) {
    raw = data
  } else if (Array.isArray(data.traces)) {
    raw = data.traces
  } else if (Array.isArray(data.list)) {
    raw = data.list
  } else if (Array.isArray(data.routes)) {
    raw = data.routes
  } else if (Array.isArray(data.data)) {
    raw = data.data
  }
  return raw
    .map((it) => ({
      context: it?.context || it?.status || it?.content || it?.desc || it?.action || '',
      time: it?.time || it?.ftime || it?.datetime || it?.track_time || '',
    }))
    .filter((it) => it.context)
}

async function loadTrack(force = false) {
  if (!orderId.value || trackLoading.value) return
  if (trackLoaded.value && !force) return
  trackLoading.value = true
  trackError.value = ''
  try {
    const res: any = await getExpressTrack(orderId.value)
    if (res.code === 200 || res.code === 0) {
      const data = res.data.tracks || {}
      trackStateText.value =
        data.state_text || data.status_text || data.stateText || data.statusText || mapExpressState(data.state ?? data.status)
      trackList.value = normalizeTrackList(data)
      trackLoaded.value = true
      if (!trackList.value.length) {
        trackError.value = '暂无物流轨迹，请稍后刷新查看'
      }
    } else {
      trackError.value = res.message || '物流轨迹获取失败'
    }
  } catch (e: any) {
    trackError.value = e?.message || '物流轨迹获取失败'
  } finally {
    trackLoading.value = false
  }
}

async function loadData() {
  if (!orderId.value) return
  loading.value = true
  try {
    const res: any = await getMyMallOrderDetail(orderId.value)
    if (res.code === 200 || res.code === 0) {
      order.value = res.data
      if (order.value?.tracking_no) {
        loadTrack()
      }
    }
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

async function copyText(text: string) {
  if (!text) return
  await copyToClipboard(text)
  showToast('已复制', 'success')
}

function searchOnline() {
  const no = order.value?.tracking_no
  if (!no) return
  const url = `https://www.kuaidi100.com/chaxun?nu=${encodeURIComponent(no)}`
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifndef H5
  copyToClipboard(no).then(() => showToast('运单号已复制，请在浏览器中查询', 'success'))
  // #endif
}

function goBack() {
  navigator.back()
}

onLoad((options: any) => {
  orderId.value = Number(options?.order_id || options?.id) || 0
  loadData()
})
</script>

<style scoped lang="scss">
.logistics-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding-bottom: 80px;
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

/* 卡片通用 */
.info-card,
.goods-card,
.address-card {
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
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

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

/* 物流轨迹 */
.track-card {
  margin: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(67, 109, 157, 0.05);
}

.track-card .card-title {
  justify-content: flex-start;
}

.track-state {
  margin-left: 4px;
  padding: 1px 8px;
  font-size: 11px;
  color: #6366f1;
  background: #e0e7ff;
  border-radius: 8px;
}

.track-refresh {
  margin-left: auto;
  font-size: 12px;
  color: #6366f1;
  padding: 2px 6px;
}

.track-loading,
.track-empty {
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.track-loading text {
  font-size: 13px;
  color: #94a3b8;
}

.track-empty-text {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
  line-height: 1.5;
}

.track-retry-btn {
  margin-top: 10px;
  height: 32px;
  padding: 0 18px;
  border-radius: 16px;
  background: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-retry-btn text {
  color: #fff;
  font-size: 12px;
}

.track-item {
  display: flex;
  align-items: stretch;
}

.track-rail {
  width: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.track-dot {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
}

.track-item.active .track-dot {
  width: 10px;
  height: 10px;
  margin-top: 4px;
  background: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.track-line {
  flex: 1;
  width: 2px;
  margin: 2px 0;
  background: #e2e8f0;
}

.track-content {
  flex: 1;
  padding: 0 0 16px 8px;
}

.track-item.last .track-content {
  padding-bottom: 0;
}

.track-context {
  display: block;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.track-item.active .track-context {
  color: #1e293b;
  font-weight: 600;
}

.track-time {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #94a3b8;
}

/* 商品 */
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
}

.goods-name {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
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

/* 地址 */
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

/* 提示卡 */
.tip-card {
  margin: 12px;
  padding: 18px 14px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tip-ico {
  font-size: 22px;
}

.tip-text {
  flex: 1;
  font-size: 13px;
  color: #9a3412;
  line-height: 1.5;
}

/* 底部 */
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
