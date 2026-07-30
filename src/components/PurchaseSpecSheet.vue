<template>
  <view class="pay-mask" @click.self="$emit('close')">
    <view class="purchase-sheet">
      <!-- 头部 -->
      <view class="sheet-head">
        <view class="sheet-head-text">
          <text class="sheet-title">选择商品规格</text>
          <text class="sheet-desc">确认规格与数量后，进入结算并完成支付。</text>
        </view>
        <view class="close-btn" @click="$emit('close')"><text>×</text></view>
      </view>

      <!-- 商品信息 -->
      <view class="product-head">
        <view class="product-icon">
          <image
            v-if="currentSku?.sku_image || product.main_image"
            :src="currentSku?.sku_image || product.main_image"
            class="icon-img"
            mode="aspectFill"
          />
          <text v-else class="icon-placeholder">{{ product.name?.charAt(0) || '商' }}</text>
        </view>
        <view class="product-meta">
          <text class="product-name">{{ product.name }}</text>
          <view class="product-price-row">
            <text class="product-price">¥{{ unitPrice }}</text>
            <text class="product-original-price" v-if="originalPrice">¥{{ originalPrice }}</text>
            <text class="product-member-tag" v-if="usingMemberPrice">会员专享</text>
          </view>
        </view>
      </view>

      <!-- 规格选择 -->
      <view class="spec-section" v-if="skuList.length > 0">
        <view class="section-title">
          <text>规格选择</text>
        </view>
        <view class="sku-options">
          <view
            v-for="(sku, index) in skuList"
            :key="sku.id || index"
            class="sku-option"
            :class="{ active: selectedIndex === index }"
            @click="selectSpec(index)"
          ><text>{{ sku.sku_name || `规格 ${index + 1}` }}</text></view>
        </view>
        <view class="spec-info" v-if="currentSku">
          <text>当前规格：{{ currentSku.sku_name || '默认规格' }} · 单价 ¥{{ unitPrice }}</text>
        </view>
      </view>

      <!-- 购买数量 -->
      <view class="spec-section">
        <view class="section-title">
          <text>购买数量</text>
          <view class="quantity-control">
            <view class="qty-btn" @click="decQty"><text>−</text></view>
            <text class="qty-num">{{ quantity }}</text>
            <view class="qty-btn" @click="incQty"><text>+</text></view>
          </view>
        </view>
      </view>

      <!-- 合计 -->
      <view class="total">
        <text>合计</text>
        <text class="total-price">¥{{ totalPrice }}</text>
      </view>

      <!-- 确认按钮 -->
      <view class="confirm-btn" @click="handleConfirm">
        <text>确认购买</text>
        <text class="confirm-price">¥{{ totalPrice }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  product: any
  visible?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', payload: { sku: any; qty: number }): void
}>()

const skuList = computed(() => {
  const skus = props.product?.skus
  if (Array.isArray(skus) && skus.length > 0) return skus
  return [{
    id: 0,
    sku_name: '默认规格',
    enterprise_price: props.product?.retail_price || 0,
    member_price: props.product?.member_price_suggest || 0,
    sku_image: props.product?.main_image || '',
  }]
})

const selectedIndex = ref(0)
const quantity = ref(1)

watch(() => props.visible, (v) => {
  if (v) {
    selectedIndex.value = 0
    quantity.value = 1
  }
})

const currentSku = computed(() => skuList.value[selectedIndex.value] || null)

function _effectiveMemberPrice(sku: any): number {
  const mp = Number(sku?.member_price || 0)
  const ep = Number(sku?.enterprise_price || 0)
  return mp > 0 && mp < ep ? mp : 0
}

const unitPrice = computed(() => {
  const sku = currentSku.value
  if (sku) {
    const mp = _effectiveMemberPrice(sku)
    if (mp > 0) return mp.toFixed(2)
    if (Number(sku.enterprise_price) > 0) {
      return Number(sku.enterprise_price).toFixed(2)
    }
  }
  return Number(props.product?.retail_price || 0).toFixed(2)
})

const originalPrice = computed(() => {
  const sku = currentSku.value
  if (!sku) return ''
  const mp = _effectiveMemberPrice(sku)
  if (mp <= 0) return ''
  const ep = Number(sku.enterprise_price || 0)
  return ep > 0 ? ep.toFixed(2) : ''
})

const usingMemberPrice = computed(() => _effectiveMemberPrice(currentSku.value) > 0)

const totalPrice = computed(() => {
  return (Number(unitPrice.value) * quantity.value).toFixed(2)
})

function selectSpec(index: number) {
  selectedIndex.value = index
}

function incQty() {
  quantity.value++
}

function decQty() {
  if (quantity.value > 1) quantity.value--
}

function handleConfirm() {
  const sku = currentSku.value
  if (!sku) return
  emit('confirm', { sku, qty: quantity.value })
}
</script>

<style scoped lang="scss">
.pay-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.purchase-sheet {
  width: 100%;
  background: #fff;
  border-radius: 24px 24px 0 0;
  padding: 16px 16px calc(18px + env(safe-area-inset-bottom));
  box-shadow: 0 -16px 42px rgba(25, 47, 74, 0.2);
}
.sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.sheet-title { font-size: 19px; color: #1a2332; font-weight: 700; display: block; margin-bottom: 6px; }
.sheet-desc { color: #8d99aa; font-size: 12px; line-height: 1.6; display: block; }
.close-btn {
  width: 32px; height: 32px; border-radius: 10px;
  background: #f3f6fa; display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: #667488; flex-shrink: 0;
}
.product-head {
  display: flex; gap: 12px; align-items: center;
  padding: 14px 0 13px; margin-top: 14px;
  border-bottom: 1px solid #eef2f7;
}
.product-icon {
  width: 72px; height: 72px; border-radius: 15px;
  background: linear-gradient(145deg, #e6f1ff, #9fc8ff);
  overflow: hidden; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.icon-img { width: 100%; height: 100%; }
.icon-placeholder { color: #fff; font-size: 28px; font-weight: 800; }
.product-meta { min-width: 0; flex: 1; }
.product-name {
  margin-bottom: 6px; font-size: 15px; line-height: 1.4;
  color: #1a2332; font-weight: 600; display: block;
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}
.product-price { color: #e34f3c; font-size: 21px; font-weight: 800; }
.product-price-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.product-original-price { color: #a8b3c2; font-size: 13px; text-decoration: line-through; }
.product-member-tag {
  background: linear-gradient(135deg, #ffb84d, #ff9a3c);
  color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px;
}
.spec-section { margin-top: 14px; }
.section-title {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 9px; font-size: 13px; font-weight: 600; color: #1a2332;
}
.sku-options { display: flex; flex-wrap: wrap; gap: 8px; }
.sku-option {
  padding: 8px 14px; border-radius: 10px;
  background: #f5f7fa; color: #6f7c8f;
  border: 1px solid transparent; font-size: 12px;
}
.sku-option.active {
  background: #f0f0ff; border-color: #5b5cf0; color: #5b5cf0; font-weight: 600;
}
.spec-info {
  margin-top: 9px; padding: 9px 10px; border-radius: 10px;
  background: #f7f9fc; color: #6d7a8d; font-size: 11px;
}
.quantity-control {
  display: flex; align-items: center;
  border: 1px solid #dfe7f1; border-radius: 10px; overflow: hidden;
}
.qty-btn {
  width: 36px; height: 34px; background: #f6f8fb;
  display: flex; align-items: center; justify-content: center;
  color: #506078; font-size: 17px;
}
.qty-num { width: 42px; text-align: center; font-size: 13px; font-weight: 600; color: #1a2332; }
.total {
  margin-top: 14px; padding: 11px 12px; border-radius: 12px;
  background: #f7faff; display: flex; align-items: center;
  justify-content: space-between; font-size: 12px; color: #5a6878;
}
.total-price { font-size: 18px; color: #e34f3c; font-weight: 800; }
.confirm-btn {
  width: 100%; height: 48px; margin-top: 13px; border-radius: 13px;
  background: linear-gradient(135deg, #5b5cf0, #7b6cf0);
  color: #fff; font-weight: 700; font-size: 16px;
  box-shadow: 0 8px 18px rgba(91, 92, 240, 0.32);
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.confirm-price { font-size: 17px; font-weight: 800; }
</style>
