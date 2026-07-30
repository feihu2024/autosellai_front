/**
 * 广告频次门禁 — uni-app 跨端版本
 *
 * 与原版差异：使用跨端 adFrequency（基于 uni storage）
 */

import { ref, computed } from 'vue'
import { canShow, recordExposure } from '@/utils/adFrequency'

/** 广告位配置（来自 /miniapp/config 下发） */
export interface AdUnitConfig {
  ad_unit_id: string
  ad_unit_name: string
  ad_scene_id: number
  ad_scene_name: string
  ad_type: string
  trigger_key?: string
  freq_control: boolean
  max_daily?: number | null
  min_interval?: number | null
}

export function useAdManager() {
  /** 从 config 下发的广告位列表 */
  const adUnits = ref<AdUnitConfig[]>([])

  /** trigger_key → 广告位配置 的映射 */
  const triggerKeyMap = computed(() => {
    const map = new Map<string, AdUnitConfig>()
    for (const unit of adUnits.value) {
      if (unit.trigger_key) {
        map.set(unit.trigger_key, unit)
      }
    }
    return map
  })

  /**
   * 从 /miniapp/config 响应中初始化广告位配置
   */
  function initFromConfig(configData: any) {
    const units = configData?.ad_units || []
    adUnits.value = units as AdUnitConfig[]
  }

  /**
   * 频次门禁（核心方法）
   *
   * @param triggerKey 触发点标识
   * @returns true = 允许展示广告（已记录曝光）; false = 静默跳过
   */
  function shouldShowAd(triggerKey: string): boolean {
    const unit = triggerKeyMap.value.get(triggerKey)
    if (!unit) return false
    if (!unit.freq_control) {
      recordExposure(triggerKey)
      return true
    }
    const check = canShow(triggerKey, unit.max_daily, unit.min_interval)
    if (!check.canShow) {
      return false
    }
    recordExposure(triggerKey)
    return true
  }

  return {
    adUnits,
    triggerKeyMap,
    initFromConfig,
    shouldShowAd,
  }
}
