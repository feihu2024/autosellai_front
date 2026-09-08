<template>
  <view class="logistics-page" v-if="!loading && order">
    <!-- <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">物流详情</text>
    </view> -->

    <!-- 微信小程序官方物流详情入口 -->
    <!-- <view class="wx-entry-card" v-if="order.tracking_no && wxBusinessViewAvailable">
      <view class="wx-entry-body">
        <text class="wx-ico">📨</text>
        <view class="wx-entry-text">
          <text class="wx-entry-title">微信官方物流</text>
          <text class="wx-entry-desc">点击下方按钮调起微信小程序官方物流详情</text>
        </view>
      </view>
      <view class="wx-btn" @click="openWxLogistics"><text>查看官方物流</text></view>
      <text class="wx-tip" v-if="wxError">{{ wxError }}</text>
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

    <!-- 物流轨迹：对接微信官方物流查询 -->
    <view class="track-card" v-if="order.tracking_no">
      <view class="card-title">
        <text class="title-ico">📍</text>
        <text class="title-text">物流轨迹</text>
      </view>
      <text class="wx-track-desc">通过微信官方物流查询实时轨迹</text>
      <view class="wx-track-btn" :class="{ disabled: trackLoading }" @click="openWxTrack">
        <text>{{ trackLoading ? '正在打开...' : '查看物流' }}</text>
      </view>
      <text class="wx-tip" v-if="wxError">{{ wxError }}</text>
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
      <view class="footer-btn primary" v-if="!wxBusinessViewAvailable" @click="searchOnline"><text>在线查询</text></view>
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
import { getMyMallOrderDetail, traceWaybill } from '@/api/miniapp'
import { navigator, showToast, copyToClipboard } from '@/utils'
import { getImageUrl } from '@/utils/image'

const orderId = ref(0)
const order = ref<any>(null)
const loading = ref(false)
const wxBusinessViewAvailable = ref(false)
const wxError = ref('')
const trackLoading = ref(false)
const waybillToken = ref('')

function openWaybillTracking(token: string): Promise<void> {
  // #ifdef MP-WEIXIN
  const plugin = requirePlugin('logisticsPlugin')
  if (!plugin || typeof plugin.openWaybillTracking !== 'function') {
    return Promise.reject(new Error('物流插件未就绪，请确认已添加 logisticsPlugin'))
  }
  return new Promise((resolve, reject) => {
    plugin.openWaybillTracking({
      waybillToken: token,
      success: () => resolve(),
      fail: (err: any) => {
        console.log(err, 'err');
        reject(new Error(err?.errMsg || err?.message || '打开物流组件失败'))
      },
    })
  })
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('请在微信小程序中查看物流'))
  // #endif
}

function detectWxBusinessView() {
  // #ifdef MP-WEIXIN
  wxBusinessViewAvailable.value = true
  // #endif
  // #ifndef MP-WEIXIN
  wxBusinessViewAvailable.value = false
  // #endif
}

function openWxLogistics() {
  wxError.value = ''
  // #ifdef MP-WEIXIN
  const wxApi: any = (globalThis as any).wx
  if (wxApi && typeof wxApi.openBusinessView === 'function') {
    wxApi.openBusinessView({
      businessType: 'logisticsDetail',
      queryString: `tracking_no=${order.value?.tracking_no || ''}&logistics_company=${order.value?.logistics_company || ''}&order_no=${order.value?.order_no || ''}`,
      success: () => {
        showToast('已打开物流详情', 'success')
      },
      fail: (err: any) => {
        wxError.value = err?.errMsg || '调起失败，请使用静态信息查看'
      },
    })
  } else {
    wxError.value = '当前微信版本不支持物流详情'
  }
  // #endif
  // #ifndef MP-WEIXIN
  wxError.value = '当前不在微信小程序环境'
  // #endif
}

async function loadData() {
  if (!orderId.value) return
  loading.value = true
  try {
    const res: any = await getMyMallOrderDetail(orderId.value)
    if (res.code === 200 || res.code === 0) {
      order.value = res.data
      if (order.value?.tracking_no) {
        prefetchWaybillToken()
      }
    }
  } catch {
    order.value = null
  } finally {
    loading.value = false
  }
}

function buildTracePayload() {
  const o = order.value || {}
  const openid = o.openid || o.wx_openid || ''
  const payload: Parameters<typeof traceWaybill>[0] = {
    order_id: orderId.value,
    waybill_id: o.tracking_no || o.waybill_id || '',
    trans_id: o.wx_transaction_id || o.transaction_id || o.trans_id || '',
    receiver_phone: o.receiver_phone || '',
    order_detail_path: `/pages/orders/detail?id=${o.id || orderId.value}`,
    goods_info: {
      detail_list: [
        {
          goods_name: o.product_name || '商品',
          goods_img_url: getImageUrl(o.product_image || o.goods_img_url || ''),
        },
      ],
    },
  }
  if (o.sender_phone) payload.sender_phone = o.sender_phone
  if (o.delivery_id || o.logistics_code) payload.delivery_id = o.delivery_id || o.logistics_code
  if (openid) payload.openid = openid
  return payload
}

async function prefetchWaybillToken() {
  if (!orderId.value || !order.value?.tracking_no || waybillToken.value) return
  try {
    const payload = buildTracePayload()
    const res: any = await traceWaybill(payload)
    const token = res?.data?.waybill_token || res?.data?.waybillToken || res?.waybill_token
    if (!(res.code === 200 || res.code === 0) || !token) return
    waybillToken.value = token
  } catch {
    // 点击时再试
  }
}

async function openWxTrack() {
  if (!orderId.value || trackLoading.value) return
  wxError.value = ''

  if (waybillToken.value) {
    try {
      await openWaybillTracking(waybillToken.value)
    } catch (e: any) {
      wxError.value = e?.message || '无法打开微信物流，请确认已开通物流服务并添加插件'
    }
    return
  }

  trackLoading.value = true
  try {
    const payload = buildTracePayload()
    const res: any = await traceWaybill(payload)
    const token = res?.data?.waybill_token || res?.data?.waybillToken || res?.waybill_token
    if (!(res.code === 200 || res.code === 0) || !token) {
      wxError.value = res?.message || res?.data?.errmsg || '获取物流信息失败'
      return
    }

    waybillToken.value = token
    await openWaybillTracking(token)
  } catch (e: any) {
    wxError.value = e?.message || '无法打开微信物流，请确认已开通物流服务并添加插件'
  } finally {
    trackLoading.value = false
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
  detectWxBusinessView()
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

/* 微信官方物流入口 */
.wx-entry-card {
  margin: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #07c160, #10b981);
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(7, 193, 96, 0.25);
}

.wx-entry-body {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.wx-ico {
  font-size: 32px;
}

.wx-entry-text {
  display: flex;
  flex-direction: column;
}

.wx-entry-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.wx-entry-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.wx-btn {
  width: 100%;
  height: 40px;
  background: #fff;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wx-btn text {
  color: #07c160;
  font-size: 14px;
  font-weight: 600;
}

.wx-tip {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
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

.wx-track-desc {
  display: block;
  margin: 8px 0 14px;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.wx-track-btn {
  height: 40px;
  border-radius: 20px;
  background: #07c160;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wx-track-btn.disabled {
  opacity: 0.6;
}

.wx-track-btn text {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
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
