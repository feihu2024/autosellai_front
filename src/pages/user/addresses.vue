<template>
  <view class="addresses-page">
    <!-- 地址列表 -->
    <view class="address-list" v-if="!loading && addresses.length > 0">
      <view class="address-card" v-for="item in addresses" :key="item.id">
        <view class="address-top">
          <text class="addr-name">{{ item.name }}</text>
          <text class="addr-phone">{{ item.phone }}</text>
          <text v-if="item.is_default" class="default-tag">默认</text>
        </view>
        <text class="address-full">{{ item.full_address || item.address }}</text>

        <view class="address-actions">
          <view v-if="selectMode" class="action-link select" @click="selectAddress(item)"><text>选择此地址</text></view>
          <!-- 默认地址开关 -->
          <view v-else class="default-switch-wrap" @click="onToggleDefault(item)">
            <text class="default-switch-label">默认地址</text>
            <view :class="['default-switch', { on: item.is_default }]">
              <view class="default-switch-thumb"></view>
            </view>
          </view>
          <view class="action-right" v-if="!selectMode">
            <view class="action-link edit" @click="editAddress(item)"><text>编辑</text></view>
            <view class="action-link delete" @click="onDelete(item)"><text>删除</text></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && addresses.length === 0 && !showForm" class="empty-state">
      <text class="empty-icon">📍</text>
      <text class="empty-text">暂无收货地址</text>
      <view class="add-btn-empty" @click="addNew"><text>+ 新增地址</text></view>
    </view>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <!-- 新增/编辑表单 -->
    <view class="form-section" v-if="showForm">
      <text class="form-title">{{ editingId ? '编辑地址' : '新增地址' }}</text>

      <view class="form-field">
        <text class="field-label">收件人</text>
        <input v-model="form.name" type="text" placeholder="姓名" maxlength="20" class="field-input" />
      </view>
      <view class="form-field">
        <text class="field-label">手机号</text>
        <input v-model="form.phone" type="number" placeholder="11 位手机号" maxlength="11" class="field-input" />
      </view>

      <!-- 三级联动：省 / 市 / 区（picker） -->
      <view class="form-field form-field-region">
        <text class="field-label">所在地区</text>
        <view class="region-row">
          <picker mode="selector" :range="provinceList" @change="onProvinceChange" class="region-picker">
            <view class="picker-display">{{ form.province || '省份' }}</view>
          </picker>
          <picker mode="selector" :range="cityOptions" @change="onCityChange" class="region-picker"
            :disabled="!form.province">
            <view class="picker-display" :class="{ disabled: !form.province }">{{ form.city || '城市' }}</view>
          </picker>
          <picker mode="selector" :range="districtOptions" @change="onDistrictChange" class="region-picker"
            :disabled="!form.city">
            <view class="picker-display" :class="{ disabled: !form.city }">{{ form.district || '区/县' }}</view>
          </picker>
        </view>
      </view>

      <view class="form-field">
        <text class="field-label">详细地址</text>
        <textarea v-model="form.detail" class="form-textarea" placeholder="街道、楼栋、门牌号等" maxlength="200"></textarea>
      </view>

      <view class="form-field checkbox-field">
        <view class="checkbox-row" @click="form.is_default = !form.is_default">
          <view :class="['custom-checkbox', { checked: form.is_default }]">
            <text v-if="form.is_default" class="check-mark">✓</text>
          </view>
          <text class="checkbox-label">设为默认地址</text>
        </view>
      </view>

      <view class="form-btns">
        <view class="cancel-btn" @click="showForm = false"><text>取消</text></view>
        <view class="primary-btn" :class="{ disabled: saving }" @click="saveAddress">
          <text>{{ saving ? '保存中...' : '保存' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAddresses as getAddressesList,
} from '@/api/miniapp'
import { provinceList, cityListOf, districtListOf } from '@/utils/region'
import { navigator, showToast, showConfirm } from '@/utils'
import { useGlobalState } from '@/composables/useGlobalState'

const addresses = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const editingId = ref<number | null>(null)

// 从结算页带 select 参数进入时，为「选择地址」模式
const selectMode = ref(false)

/** 选择该地址并返回结算页 */
function selectAddress(item: any) {
  if (!selectMode.value) return

  const { getAddressSelectContext, clearAddressSelectContext } = useGlobalState()
  const context = getAddressSelectContext()

  if (!context) {
    showToast('页面状态异常', 'error')
    return
  }

  // 清除上下文
  clearAddressSelectContext()

  // 跳转回结算页，带上地址ID
  uni.redirectTo({
    url: `/pages/mall/checkout?product_id=${context.productId}&sku_id=${context.skuId}&qty=${context.qty}&address_id=${item.id}`
  })
}

const form = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  is_default: false,
})

const cityOptions = computed(() => cityListOf(form.province))
const districtOptions = computed(() => districtListOf(form.province, form.city))

function resetForm() {
  form.name = ''
  form.phone = ''
  form.province = ''
  form.city = ''
  form.district = ''
  form.detail = ''
  form.is_default = false
}

function addNew() {
  editingId.value = null
  resetForm()
  showForm.value = true
}

function editAddress(item: any) {
  editingId.value = item.id
  form.name = item.name || ''
  form.phone = item.phone || ''
  form.province = item.province || ''
  form.city = item.city || ''
  form.district = item.district || ''
  form.detail = item.detail || ''
  form.is_default = !!item.is_default
  showForm.value = true
}

function onProvinceChange(e: any) {
  const idx = Number(e.detail.value)
  form.province = provinceList[idx] || ''
  form.city = ''
  form.district = ''
}

function onCityChange(e: any) {
  const idx = Number(e.detail.value)
  const cities = cityListOf(form.province)
  form.city = cities[idx] || ''
  form.district = ''
}

function onDistrictChange(e: any) {
  const idx = Number(e.detail.value)
  const districts = districtListOf(form.province, form.city)
  form.district = districts[idx] || ''
}

function validate(): string | null {
  if (!form.name.trim()) return '请填写收件人姓名'
  if (!/^1\d{10}$/.test(form.phone.trim())) return '请填写正确的手机号'
  if (!form.province) return '请选择省份'
  if (!form.city) return '请选择城市'
  if (!form.district) return '请选择区/县'
  if (!form.detail.trim()) return '请填写详细地址'
  return null
}

async function saveAddress() {
  const err = validate()
  if (err) {
    showToast(err)
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      province: form.province,
      city: form.city,
      district: form.district,
      detail: form.detail.trim(),
      is_default: form.is_default,
    }
    if (editingId.value) {
      await updateAddress(editingId.value, payload)
      showToast('已更新', 'success')
    } else {
      await createAddress(payload)
      showToast('已新增', 'success')
    }
    showForm.value = false
    await loadList()
  } catch {
    // 错误提示由拦截器统一处理
  } finally {
    saving.value = false
  }
}

async function onDelete(item: any) {
  const msg = `确认删除「${item.name}」的地址？${item.is_default ? '（默认地址删除后将自动选择最新一条作为默认）' : ''}`
  const confirmed = await showConfirm('删除确认', msg)
  if (!confirmed) return
  try {
    await deleteAddress(item.id)
    showToast('已删除', 'success')
    await loadList()
  } catch {
    // ignore
  }
}

async function onSetDefault(item: any) {
  try {
    await setDefaultAddress(item.id)
    showToast('已设为默认', 'success')
    await loadList()
  } catch {
    // ignore
  }
}

async function onToggleDefault(item: any) {
  if (item.is_default) {
    showToast('当前已是默认地址，点击其他地址可切换默认')
    return
  }
  await onSetDefault(item)
}

function goBack() {
  navigator.back()
}

async function loadList() {
  loading.value = true
  try {
    const res: any = await getAddresses()
    if (res.code === 200 || res.code === 0) {
      addresses.value = res.data || []
    }
  } catch {
    addresses.value = []
  } finally {
    loading.value = false
  }
}

onLoad((options: any) => {
  selectMode.value = options?.select === '1' || options?.select === 'true'
  loadList()
})
</script>

<style scoped lang="scss">
.addresses-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding-bottom: 24px;
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
}

.add-top {
  padding: 4px 8px;
}

.add-top text {
  color: #6366f1;
  font-size: 13px;
  font-weight: 500;
}

/* 地址卡片 */
.address-list {
  padding: 12px;
}

.address-card {
  background: #fff;
  border-radius: 14px;
  margin-bottom: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(67, 109, 157, 0.05);
  border: 1px solid #f0f4fa;
}

.address-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.addr-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
}

.addr-phone {
  font-size: 13px;
  color: #64748b;
}

.default-tag {
  font-size: 10px;
  font-weight: 600;
  color: #16a34a;
  background: #dcfce7;
  padding: 2px 8px;
  border-radius: 8px;
}

.address-full {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed #eef2f7;
}

.action-right {
  display: flex;
  gap: 8px;
}

.action-link {
  padding: 4px 8px;
}

.action-link text {
  font-size: 12px;
  font-weight: 500;
}

.action-link.select text {
  color: #6366f1;
}

.action-link.edit text {
  color: #3b82f6;
}

.action-link.delete text {
  color: #ef4444;
}

/* 默认地址开关（自定义滑块） */
.default-switch-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.default-switch-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.default-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 11px;
  background: #cbd5e1;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.default-switch.on {
  background: #16a34a;
}

.default-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.default-switch.on .default-switch-thumb {
  transform: translateX(18px);
}

/* 表单 */
.form-section {
  margin: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(67, 109, 157, 0.08);
}

.form-title {
  display: block;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.form-field {
  margin-bottom: 14px;
}

.field-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 500;
}

.field-input {
  width: 100%;
  height: 42px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 0 12px;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 10px 12px;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}

.form-field-region .region-row {
  display: flex;
  gap: 6px;
}

.region-picker {
  flex: 1;
}

.picker-display {
  height: 40px;
  line-height: 40px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  padding: 0 8px;
  font-size: 13px;
  color: #1e293b;
  background: #fff;
  text-align: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.picker-display.disabled {
  color: #cbd5e1;
}

/* 自定义复选框 */
.checkbox-field .checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-checkbox.checked {
  background: #6366f1;
  border-color: #6366f1;
}

.check-mark {
  font-size: 12px;
  color: #fff;
  font-weight: 700;
}

.checkbox-label {
  font-size: 13px;
  color: #475569;
}

.form-btns {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.cancel-btn {
  flex: 1;
  height: 42px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-btn text {
  color: #64748b;
  font-size: 14px;
}

.primary-btn {
  flex: 1;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
}

.primary-btn text {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.primary-btn.disabled {
  opacity: 0.6;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 16px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  margin-bottom: 16px;
  font-size: 14px;
  color: #94a3b8;
}

.add-btn-empty {
  height: 38px;
  padding: 0 22px;
  background: #6366f1;
  border-radius: 19px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn-empty text {
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.loading-state {
  text-align: center;
  padding: 60px 16px;
}

.loading-state text {
  font-size: 14px;
  color: #94a3b8;
}
</style>
