<template>
  <view v-if="visible" class="pay-sheet-mask" @click="close">
    <view class="pay-sheet" @click.stop>
      <!-- 拖拽指示条 -->
      <view class="sheet-handle" @click="close"></view>

      <!-- 标题区 -->
      <view class="sheet-header">
        <text class="sheet-title">选择套餐购买</text>
        <text class="sheet-subtitle">算力不足，购买套餐后即可继续使用</text>
      </view>

      <!-- 加载中 -->
      <view v-if="loading" class="sheet-loading">
        <text>加载套餐中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="packages.length === 0" class="sheet-empty">
        <text>暂无可购买的套餐，请联系客服</text>
      </view>

      <!-- 套餐列表 -->
      <scroll-view v-else class="package-list" scroll-y>
        <view
          v-for="pkg in packages"
          :key="pkg.id"
          class="package-card"
          :class="{ active: selectedId === pkg.id }"
          @click="selectedId = pkg.id"
        >
          <view class="pkg-main">
            <text class="pkg-name">{{ pkg.name }}</text>
            <text class="pkg-desc" v-if="pkg.description">{{ pkg.description }}</text>
            <view class="pkg-meta">
              <text class="pkg-compute">{{ pkg.compute_amount }} 点算力</text>
              <text class="pkg-level" v-if="pkg.benefit_level && pkg.benefit_level !== '普通'">权益:{{ pkg.benefit_level }}</text>
              <text class="pkg-days" v-if="pkg.duration_days">{{ pkg.duration_days }}天</text>
            </view>
          </view>
          <text class="pkg-price">¥{{ pkg.price }}</text>
        </view>
      </scroll-view>

      <!-- 底部支付按钮 -->
      <view class="sheet-footer" v-if="packages.length > 0">
        <view
          class="pay-btn"
          :class="{ disabled: !selectedId || paying }"
          @click="handlePay"
        >
          <text>{{ paying ? '处理中...' : '立即支付' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getMiniappPackages, createMiniappOrder, simulateOrderPay } from '@/api/miniapp'
import { showToast } from '@/utils'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'paid', data: { compute_balance: number }): void
}>()

const packages = ref<any[]>([])
const loading = ref(false)
const selectedId = ref<number | null>(null)
const paying = ref(false)

// 每次打开时重新加载套餐
watch(() => props.visible, async (val) => {
  if (val) {
    selectedId.value = null
    await fetchPackages()
  }
})

async function fetchPackages() {
  loading.value = true
  try {
    const res: any = await getMiniappPackages()
    packages.value = res.data?.list || []
    // 默认选中第一个
    if (packages.value.length > 0) {
      selectedId.value = packages.value[0].id
    }
  } catch {
    packages.value = []
  } finally {
    loading.value = false
  }
}

function close() {
  if (!paying.value) {
    emit('close')
  }
}

async function handlePay() {
  if (!selectedId.value || paying.value) return
  paying.value = true

  try {
    // 1. 创建订单
    const orderRes: any = await createMiniappOrder(selectedId.value)
    const orderData = orderRes.data

    if (orderData.mode === 'simulate') {
      // 模拟支付模式：直接调 simulate-pay
      const payRes: any = await simulateOrderPay(orderData.order_id)
      const computeBalance = payRes.data?.compute_balance ?? 0
      emit('paid', { compute_balance: computeBalance })
    } else if (orderData.mode === 'jsapi') {
      // 真实微信JSAPI支付
      const params = orderData.pay_params

      // #ifdef MP-WEIXIN
      uni.requestPayment({
        provider: 'wxpay',
        timeStamp: params.timeStamp,
        nonceStr: params.nonceStr,
        package: params.package,
        signType: params.signType,
        paySign: params.paySign,
        success: () => {
          emit('paid', { compute_balance: 0 })
        },
        fail: () => {
          paying.value = false
        },
      })
      // #endif

      // #ifndef MP-WEIXIN
      // 非微信环境，降级提示
      showToast('请在微信小程序中完成支付')
      paying.value = false
      // #endif
    }
  } catch {
    paying.value = false
  }
}
</script>

<style scoped>
.pay-sheet-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
}

.pay-sheet {
  background: #fff;
  width: 100%;
  border-radius: 20px 20px 0 0;
  padding: 8px 20px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  max-height: 75vh;
  display: flex;
  flex-direction: column;
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: #e2e8f0;
  border-radius: 2px;
  margin: 0 auto 12px;
}

.sheet-header {
  text-align: center;
  margin-bottom: 16px;
}

.sheet-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.sheet-subtitle {
  font-size: 13px;
  color: #94a3b8;
  display: block;
  margin-top: 4px;
}

.sheet-loading,
.sheet-empty {
  text-align: center;
  padding: 40px 0;
  color: #94a3b8;
  font-size: 14px;
}

.package-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.package-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border: 2px solid #e8edf3;
  border-radius: 14px;
  margin-bottom: 10px;
}

.package-card.active {
  border-color: #5b5cf0;
  background: rgba(91, 92, 240, 0.04);
}

.pkg-main {
  flex: 1;
}

.pkg-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  display: block;
  margin-bottom: 2px;
}

.pkg-desc {
  font-size: 12px;
  color: #94a3b8;
  display: block;
  margin-bottom: 6px;
}

.pkg-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
}

.pkg-compute {
  color: #5b5cf0;
  font-weight: 600;
}

.pkg-level {
  color: #2e7d32;
}

.pkg-days {
  color: #94a3b8;
}

.pkg-price {
  font-size: 22px;
  font-weight: 700;
  color: #ef4444;
}

.sheet-footer {
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.pay-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: #5b5cf0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pay-btn.disabled {
  opacity: 0.5;
}

.pay-btn text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
</style>
