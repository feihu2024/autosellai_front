/**
 * 全局分享 composable
 *
 * 在页面 <script setup> 中调用，自动注册 onShareAppMessage + onShareTimeline，
 * 分享链接中自动携带邀请参数（referrer_id + enterprise_id）。
 *
 * 参数来源：getShareParams 接口（模块级缓存，全局只请求一次）
 *
 * 用法：
 *   // 默认分享（分享首页 + 邀请参数）
 *   useShare()
 *
 *   // 自定义静态分享
 *   useShare({ title: '...', path: '/pages/mall/detail', pathParams: { id: 123 } })
 *
 *   // 响应式分享（数据异步加载的页面，如商品详情）
 *   useShare(() => ({
 *     title: product.value?.name || '...',
 *     path: '/pages/mall/detail',
 *     pathParams: { id: productId.value },
 *     imageUrl: product.value?.image_list?.[0],
 *   }))
 */
import { ref, getCurrentInstance } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { getShareParams } from '@/api/miniapp'

interface ShareOptions {
  /** 分享标题 */
  title?: string
  /** 分享落地页路径（不含query），默认 /pages/home/index */
  path?: string
  /** 落地页路径参数（如 { id: 123 } → ?id=123） */
  pathParams?: Record<string, string | number>
  /** 分享封面图 URL */
  imageUrl?: string
}

/** 支持静态对象或 getter 函数（响应式场景） */
type ShareOptionsInput = ShareOptions | (() => ShareOptions)

// ===== 模块级缓存：getShareParams 接口结果（全局只请求一次） =====
interface ShareParams {
  referrer_id?: number
  enterprise_id?: number
  title?: string
  imageUrl?: string
}

const shareParams = ref<ShareParams | null>(null)
let shareParamsPromise: Promise<void> | null = null

/** 确保 shareParams 已加载（带缓存，多页面共用一次请求） */
function ensureShareParams(): Promise<void> {
  if (shareParams.value) return Promise.resolve()
  if (shareParamsPromise) return shareParamsPromise
  shareParamsPromise = getShareParams()
    .then((res: any) => {
      const data = res.data || {}
      shareParams.value = {
        referrer_id: data.referrer_id,
        enterprise_id: data.enterprise_id,
        title: data.title,
        imageUrl: data.image_url,
      }
    })
    .catch((e: any) => {
      console.error('[useShare] 获取分享参数失败', e)
    })
    .finally(() => {
      shareParamsPromise = null
    })
  return shareParamsPromise
}

export function useShare(options?: ShareOptionsInput) {
  const instance = getCurrentInstance()
  if (instance) {
    const componentOptions = instance.type as any
    // 覆盖页面的 onShareAppMessage 和 onShareTimeline
    componentOptions.onShareAppMessage = function (res: any) {
      const opts = getOptions()
      return {
        title: buildShareTitle(),
        path: buildSharePath(),
        imageUrl: opts.imageUrl || shareParams.value?.imageUrl,
      }
    }
    componentOptions.onShareTimeline = function () {
      const opts = getOptions()
      return {
        title: buildShareTitle(),
        query: buildTimelineQuery(),
        imageUrl: opts.imageUrl || shareParams.value?.imageUrl,
      }
    }
  }
  // 进入页面时预加载分享参数（用户点分享时已就绪）
  ensureShareParams()

  /** 获取当前生效的分享选项 */
  function getOptions(): ShareOptions {
    if (typeof options === 'function') return options()
    return options || {}
  }

  /** 拼接完整分享路径：基础路径 + 页面参数 + 邀请参数 */
  function buildSharePath(): string {
    const opts = getOptions()
    const basePath = opts.path || '/pages/home/index'
    const params = shareParams.value

    // 页面参数（如资讯ID、商品ID）
    const pageParams: string[] = []
    if (opts.pathParams) {
      for (const [k, v] of Object.entries(opts.pathParams)) {
        pageParams.push(`${k}=${encodeURIComponent(String(v))}`)
      }
    }

    // 邀请参数（来自 getShareParams 接口）
    if (params?.referrer_id) {
      pageParams.push(`referrer_id=${params.referrer_id}`)
    }
    if (params?.enterprise_id) {
      pageParams.push(`enterprise_id=${params.enterprise_id}`)
    }

    const queryString = pageParams.length > 0 ? '?' + pageParams.join('&') : ''
    return basePath + queryString
  }

  /** 构建 onShareTimeline 的 query 字符串 */
  function buildTimelineQuery(): string {
    const opts = getOptions()
    const params = shareParams.value
    const parts: string[] = []
    if (opts.pathParams) {
      for (const [k, v] of Object.entries(opts.pathParams)) {
        parts.push(`${k}=${encodeURIComponent(String(v))}`)
      }
    }
    if (params?.referrer_id) {
      parts.push(`referrer_id=${params.referrer_id}`)
    }
    if (params?.enterprise_id) {
      parts.push(`enterprise_id=${params.enterprise_id}`)
    }
    return parts.join('&')
  }

  /** 构建分享标题 */
  function buildShareTitle(): string {
    const opts = getOptions()
    // 页面自定义标题优先，其次用接口返回的标题，最后兜底
    if (opts.title) return opts.title
    if (shareParams.value?.title) return shareParams.value.title
    return '邀请你一起体验'
  }

  // 注册微信转发好友
  onShareAppMessage((_res: any) => {
    const opts = getOptions()
    console.log('分享好友', buildSharePath())
    return {
      title: '2222',
      path: buildSharePath(),
      imageUrl: opts.imageUrl || shareParams.value?.imageUrl || '',
    }
  })

  // 注册微信分享朋友圈
  onShareTimeline(() => {
    const opts = getOptions()
    return {
      title: buildShareTitle(),
      query: buildTimelineQuery(),
      imageUrl: opts.imageUrl || shareParams.value?.imageUrl || '',
    }
  })
}
