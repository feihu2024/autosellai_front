/**
 * 全局分享 composable
 *
 * 在页面 <script setup> 中调用，自动注册 onShareAppMessage + onShareTimeline，
 * 分享链接中自动携带邀请参数（referrer_id + enterprise_id）。
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
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useGlobalState } from '@/composables/useGlobalState'

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

export function useShare(options?: ShareOptionsInput) {
  const { getInviteQuery, currentUserName } = useGlobalState()

  /** 获取当前生效的分享选项 */
  function getOptions(): ShareOptions {
    if (typeof options === 'function') return options()
    return options || {}
  }

  /** 拼接完整分享路径：基础路径 + 页面参数 + 邀请参数 */
  function buildSharePath(): string {
    const opts = getOptions()
    const basePath = opts.path || '/pages/home/index'
    const inviteQuery = getInviteQuery()

    // 页面参数（如商品ID）
    const pageParams: string[] = []
    if (opts.pathParams) {
      for (const [k, v] of Object.entries(opts.pathParams)) {
        pageParams.push(`${k}=${encodeURIComponent(String(v))}`)
      }
    }

    // 合并 query：页面参数 + 邀请参数
    const allQuery = [...pageParams]
    if (inviteQuery) {
      allQuery.push(inviteQuery)
    }

    const queryString = allQuery.length > 0 ? '?' + allQuery.join('&') : ''
    return basePath + queryString
  }

  /** 构建 onShareTimeline 的 query 字符串 */
  function buildTimelineQuery(): string {
    const opts = getOptions()
    const inviteQuery = getInviteQuery()
    const parts: string[] = []
    if (opts.pathParams) {
      for (const [k, v] of Object.entries(opts.pathParams)) {
        parts.push(`${k}=${encodeURIComponent(String(v))}`)
      }
    }
    if (inviteQuery) {
      parts.push(inviteQuery)
    }
    return parts.join('&')
  }

  /** 构建分享标题 */
  function buildShareTitle(): string {
    const opts = getOptions()
    if (opts.title) return opts.title
    const name = currentUserName.value
    return name ? `${name} 邀请你一起体验` : '邀请你一起体验'
  }

  // 注册微信转发好友
  onShareAppMessage((_res: any) => {
    const opts = getOptions()
    return {
      title: buildShareTitle(),
      path: buildSharePath(),
      imageUrl: opts.imageUrl,
    }
  })

  // 注册微信分享朋友圈
  onShareTimeline(() => {
    const opts = getOptions()
    return {
      title: buildShareTitle(),
      query: buildTimelineQuery(),
      imageUrl: opts.imageUrl,
    }
  })
}
