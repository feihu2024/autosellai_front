/**
 * 小程序模板变体（UI Variant）全局状态 — uni-app 跨端版本
 *
 * 通过后端 /miniapp/config 下发的 template.ui_variant 字段判断当前企业使用哪套模板：
 *   - 'gold' → 模板2（金色风格）
 *   - 其它/缺省 → 模板1（默认紫色风格）
 *
 * 与原版差异：改用 uni storage 封装替代 localStorage
 */
import { ref, computed } from 'vue'
import request from '@/utils/request'

/** 模块级共享状态（单例）：当前 UI 变体标识，null 表示未获取/模板1 */
const uiVariant = ref<string | null>(null)

/** 模板变体是否已加载完成（用于避免首页先渲染默认模板再切换导致的闪动） */
const templateLoaded = ref<boolean>(false)

/** 是否已拉取过配置（防止并发重复请求） */
let loaded = false

export function useMiniappTemplate() {
  /** 是否为金色模板（模板2） */
  // const isGoldTemplate = computed(() => uiVariant.value === 'gold')
  const isGoldTemplate = false
  /**
   * 异步拉取 config 并设置 uiVariant。
   * 全局只请求一次（单例缓存），后续调用直接返回，不重复发起网络请求。
   */
  async function loadTemplateVariant() {
    if (loaded) return
    loaded = true
    try {
      const res = await request.get('/v1/miniapp/config')
      uiVariant.value = res.data?.template?.ui_variant || null
    } catch (e) {
      console.error('[useMiniappTemplate] 获取模板变体失败', e)
    } finally {
      // 无论成功失败都标记为已加载，避免页面一直停留在 loading 占位
      templateLoaded.value = true
    }
  }

  return {
    uiVariant,
    isGoldTemplate,
    templateLoaded,
    loadTemplateVariant,
  }
}
