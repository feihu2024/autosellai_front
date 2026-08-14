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

const STORAGE_KEY_AD_UNITS = 'miniapp_ad_units'

/** 从 config 下发的广告位列表（模块级单例） */
const adUnits = ref<AdUnitConfig[]>([])

/** 从本地存储加载广告配置 */
function loadFromStorage() {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY_AD_UNITS)
    if (stored && Array.isArray(stored) && stored.length > 0) {
      adUnits.value = stored as AdUnitConfig[]
    }
  } catch (e) {
    console.error('[useAdManager] 从存储加载广告配置失败', e)
  }
}

// 模块加载时立即从存储加载
loadFromStorage()

export function useAdManager() {
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

    // 持久化存储
    try {
      uni.setStorageSync(STORAGE_KEY_AD_UNITS, adUnits.value)
    } catch (e) {
      console.error('[useAdManager] 存储广告配置失败', e)
    }
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

  /**
   * 根据场景ID查找广告位
   *
   * @param sceneId 场景ID
   * @returns 广告位配置，如果没有找到返回null
   */
  function getAdBySceneId(sceneId: number): AdUnitConfig | null {
    return adUnits.value.find(unit => unit.ad_scene_id === sceneId) || null
  }

  /**
   * 检查场景广告是否应该显示（频次门禁）
   *
   * - 插屏广告（SLOT_ID_WEAPP_INTERSTITIAL）且开启 freq_control 时：
   *   按 max_daily（单日最大次数）、min_interval（最小间隔秒数）限流，
   *   间隔时间内或当日次数用尽则返回 null（不再弹出）。
   * - 其他类型（模板广告、激励视频等）不做频次控制，直接返回。
   *
   * @param sceneId 场景ID
   * @returns 广告位配置（如果应该显示），否则返回null
   */
  function shouldShowAdByScene(sceneId: number): AdUnitConfig | null {
    const unit = getAdBySceneId(sceneId)
    if (!unit) return null

    // 插屏广告且开启频次控制时，按 max_daily(每日次数) / min_interval(间隔秒数) 限流
    if (unit.ad_type === 'SLOT_ID_WEAPP_INTERSTITIAL' && unit.freq_control) {
      const freqKey = `scene_${sceneId}_${unit.ad_unit_id}`
      const check = canShow(freqKey, unit.max_daily, unit.min_interval)
      if (!check.canShow) {
        console.log(`[useAdManager] 场景${sceneId}插屏广告被频次限制: ${check.reason}`)
        return null
      }
      recordExposure(freqKey)
      return unit
    }

    // 其他类型不做频次控制，直接返回
    return unit
  }

  return {
    adUnits,
    triggerKeyMap,
    initFromConfig,
    shouldShowAd,
    getAdBySceneId,
    shouldShowAdByScene,
  }
}
