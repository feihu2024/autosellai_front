<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">收益详情</text>
    </view>

    <!-- 4个统计卡片 -->
    <view class="income-grid">
      <view class="income-stat">
        <text class="income-label">昨日收益</text>
        <text class="income-num">¥{{ summary.yesterday_revenue.toFixed(2) }}</text>
      </view>
      <view class="income-stat">
        <text class="income-label">昨日日活</text>
        <text class="income-num">{{ summary.yesterday_active.toLocaleString() }}</text>
      </view>
      <view class="income-stat">
        <text class="income-label">本月收益</text>
        <text class="income-num">¥{{ summary.month_revenue.toLocaleString() }}</text>
      </view>
      <view class="income-stat">
        <text class="income-label">累计收益</text>
        <text class="income-num">¥{{ summary.total_revenue.toLocaleString() }}</text>
      </view>
    </view>


    <view v-if="templateAdUnit" class="ad-container">
      <ad-custom :unit-id="templateAdUnit.ad_unit_id"></ad-custom>
    </view>
    <!-- 分配比例 -->
    <!-- <view class="section">
      <view class="section-title">
        <text class="section-h3">分配比例设置</text>
      </view>
      <view class="panel ratio-list">
        <view class="ratio">
          <text class="ratio-label">团长分给下面用户的比例</text>
          <view class="ratio-edit">
            <view class="ratio-input-wrap">
              <input
                class="ratio-input"
                type="number"
                :value="ratioForm.leader_to_member_ratio"
                @input="onRatioInput"
              />
              <text class="ratio-suffix">%</text>
            </view>
            <view
              class="ratio-save"
              :class="{ disabled: savingRatio }"
              @click="handleSaveRatio"
            >
              <text>{{ savingRatio ? '保存中' : '保存' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">
        <text class="section-h3">广告收益列表明细</text>
      </view>
      <view class="ad-table-head">
        <text class="th-date">日期</text>
        <text class="th">曝光</text>
        <text class="th">日活</text>
        <text class="th">我的收益</text>
        <text class="th">ECPM</text>
      </view>
      <view class="ad-list">
        <view
          class="ad-item"
          v-for="item in records"
          :key="item.date"
          @click="item._open = !item._open"
        >
          <view class="ad-summary">
            <text class="ad-date">{{ item.date }}</text>
            <text class="ad-cell">{{ item.impressions.toLocaleString() }}</text>
            <text class="ad-cell">{{ item.daily_active.toLocaleString() }}</text>
            <text class="ad-cell">¥{{ item.total_amount.toFixed(2) }}</text>
            <text class="ad-cell">{{ item.ecpm }}</text>
          </view>
          <view class="ad-detail" v-if="item._open">
            <view
              class="ad-detail-row commission-row"
              v-if="item.leader_commission > 0 || item.promoter_commission > 0"
            >
              <text class="commission-title">分润明细</text>
              <text class="commission-text" v-if="item.leader_commission > 0">销售代理分润 ¥{{ item.leader_commission.toFixed(2) }}</text>
              <text class="commission-text" v-if="item.promoter_commission > 0">推广员分润 ¥{{ item.promoter_commission.toFixed(2) }}</text>
            </view>
            <view class="ad-detail-row" v-for="ad in item.details" :key="ad.name">
              <text class="ad-detail-name">{{ ad.name }}</text>
              <text class="ad-detail-cell">曝光 {{ ad.views.toLocaleString() }}</text>
              <text class="ad-detail-cell">收入 ¥{{ ad.income.toFixed(2) }}</text>
              <text class="ad-detail-cell">ECPM {{ ad.ecpm }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="note">
        <text>列表项依次展示日期、曝光数、日活、个人实际收益与 ECPM；点击单项展开分润明细与广告位数据。</text>
      </view>
    </view> -->
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getAgentRevenue, getMiniappConfig, setLeaderToMemberRatio } from '@/api/miniapp'
import { navigator, showToast } from '@/utils'
import { useAdManager } from '@/composables/useAdManager'
const { shouldShowAdByScene, initFromConfig } = useAdManager()


// 模板广告配置（场景ID 18）
const templateAdUnit = ref<any>(null)

const summary = ref({
  yesterday_revenue: 0,
  yesterday_active: 0,
  month_revenue: 0,
  total_revenue: 0,
  leader_to_member_ratio: 0,
  is_sales_leader: false,
})

const records = ref<any[]>([])
const savingRatio = ref(false)
const ratioForm = reactive({
  leader_to_member_ratio: 0 as number,
})

function goBack() {
  navigator.back()
}

function onRatioInput(e: any) {
  const v = Number(e.detail.value)
  ratioForm.leader_to_member_ratio = isNaN(v) ? 0 : v
}

onLoad(async () => {
  try {
    const configRes = await getMiniappConfig()
    const configData = configRes.data || {}
    initFromConfig(configData)

    const templateAd = shouldShowAdByScene(20)
    if (templateAd && templateAd.ad_type === 'SLOT_ID_WEAPP_TEMPLATE') {
      templateAdUnit.value = templateAd
    }

    const res = await getAgentRevenue()
    const data = res.data
    if (data) {
      summary.value = data.summary || summary.value
      records.value = (data.records || []).map((r: any) => ({ ...r, _open: false }))
      ratioForm.leader_to_member_ratio = summary.value.leader_to_member_ratio || 0
    }
  } catch {
    // ignore
  }
})

async function handleSaveRatio() {
  const v = Number(ratioForm.leader_to_member_ratio)
  if (isNaN(v) || v < 0 || v > 100) {
    showToast('比例必须在 0-100 之间')
    return
  }
  savingRatio.value = true
  try {
    await setLeaderToMemberRatio({ leader_to_member_ratio: v })
    summary.value.leader_to_member_ratio = v
    showToast('保存成功', 'success')
  } catch {
    showToast('保存失败，请重试')
  } finally {
    savingRatio.value = false
  }
}
</script>

<style scoped>
.sub-page {
  padding: 18px 16px 42px;
  min-height: 100vh;
  background: #f4f7fc;
}

.page-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  margin-bottom: 12px;
}

.back {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back text {
  color: #283851;
  font-size: 22px;
}

.page-title {
  font-size: 20px;
  font-weight: 750;
  color: #1e293b;
}

.income-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 18px;
}

.income-stat {
  padding: 13px 8px;
  text-align: center;
  background: #fff;
  border: 1px solid #e8eef7;
  border-radius: 15px;
}

.income-label {
  display: block;
  color: #7d899d;
  font-size: 10px;
  margin-bottom: 5px;
}

.income-num {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.section {
  margin: 18px 0;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 2px 12px;
}

.section-h3 {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}

.panel {
  background: #fff;
  border: 1px solid #e8eef7;
  border-radius: 18px;
  padding: 15px;
  box-shadow: 0 8px 22px rgba(75, 111, 150, 0.05);
}

.ratio-list {
  display: grid;
  gap: 8px;
}

.ratio {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 12px;
  background: #f7fbff;
  border-radius: 12px;
}

.ratio-label {
  font-size: 13px;
  color: #1e293b;
  flex: 1;
}

.ratio-edit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ratio-input-wrap {
  display: flex;
  align-items: center;
  gap: 2px;
}

.ratio-input {
  width: 60px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  border: 1px solid #d0dae8;
  border-radius: 8px;
  padding: 5px 4px;
  color: #283851;
}

.ratio-suffix {
  font-size: 15px;
  font-weight: 600;
  color: #283851;
}

.ratio-save {
  border-radius: 8px;
  padding: 5px 14px;
  background: #3185ed;
}

.ratio-save text {
  font-size: 12px;
  font-weight: 500;
  color: #fff;
}

.ratio-save.disabled {
  opacity: 0.5;
}

.ad-table-head {
  display: grid;
  grid-template-columns: 1.15fr 0.8fr 0.7fr 0.8fr 0.8fr;
  gap: 4px;
  align-items: center;
  padding: 0 13px 7px;
}

.ad-table-head text {
  color: #8a96a8;
  font-size: 10px;
}

.th-date {
  grid-column: 1;
}

.th {
  text-align: center;
}

.ad-list {
  display: grid;
  gap: 10px;
}

.ad-item {
  background: #fff;
  border: 1px solid #e8eef7;
  border-radius: 16px;
  padding: 13px;
  box-shadow: 0 6px 20px rgba(75, 111, 150, 0.04);
}

.ad-summary {
  display: grid;
  grid-template-columns: 1.15fr 0.8fr 0.7fr 0.8fr 0.8fr;
  gap: 4px;
  align-items: center;
}

.ad-date {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.ad-cell {
  font-size: 11px;
  color: #475569;
  text-align: center;
}

.ad-detail {
  margin-top: 11px;
  border-top: 1px solid #edf2f8;
  padding-top: 8px;
  display: grid;
  gap: 7px;
}

.ad-detail-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr 0.8fr 0.8fr;
  gap: 6px;
  font-size: 10px;
  color: #667488;
}

.ad-detail-name {
  font-weight: 600;
  color: #475569;
}

.ad-detail-cell {
  color: #667488;
}

.ad-detail-row.commission-row {
  grid-template-columns: auto 1fr 1fr;
  background: #f0f6ff;
  border-radius: 8px;
  padding: 7px 9px;
  font-size: 11px;
}

.commission-title {
  color: #283851;
  font-weight: 600;
}

.commission-text {
  color: #3185ed;
  font-weight: 600;
}

.note {
  margin-top: 10px;
  padding: 12px;
  border-radius: 13px;
  background: #f6faff;
}

.note text {
  color: #738094;
  font-size: 12px;
  line-height: 1.7;
}
</style>
