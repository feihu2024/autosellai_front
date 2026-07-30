/**
 * 跨端导航封装
 *
 * 统一封装 uni-app 的页面跳转 API，提供与 vue-router 类似的接口。
 *
 * 核心映射：
 *   router.push(path)     → uni.navigateTo({ url })
 *   router.replace(path)  → uni.redirectTo({ url })
 *   router.back()         → uni.navigateBack()
 *   switchTab(path)       → uni.switchTab({ url })
 */

/** 路由路径 → uni-app pages.json 路径映射 */
const ROUTE_MAP: Record<string, string> = {
  '/m/home': '/pages/home/index',
  '/m/info': '/pages/info/index',
  '/m/info/:id': '/pages/info/detail',
  '/m/mall': '/pages/mall/index',
  '/m/mall/checkout': '/pages/mall/checkout',
  '/m/mall/:id': '/pages/mall/detail',
  '/m/mcn-authorization': '/pages/mcn/authorization',
  '/m/mcn-tutorial': '/pages/mcn/tutorial',
  '/m/mcn-auth-webview': '/pages/mcn/auth-webview',
  '/m/profile': '/pages/profile/index',
  '/m/orders': '/pages/orders/index',
  '/m/order/:id': '/pages/orders/detail',
  '/m/logistics/:order_id': '/pages/orders/logistics',
  '/m/agent/:id': '/pages/agent/chat',
  '/m/agent-workbench': '/pages/agent/workbench',
  '/m/revenue-detail': '/pages/agent/revenue-detail',
  '/m/referrals': '/pages/agent/referrals',
  '/m/member-detail/:id': '/pages/agent/member-detail',
  '/m/activate': '/pages/user/activate',
  '/m/cards': '/pages/user/cards',
  '/m/balance': '/pages/user/balance',
  '/m/compute': '/pages/user/compute',
  '/m/contacts': '/pages/user/contacts',
  '/m/payments': '/pages/user/payments',
  '/m/addresses': '/pages/user/addresses',
  '/m/privacy': '/pages/user/privacy',
  '/m/withdraw': '/pages/user/withdraw',
  '/m/share': '/pages/user/share',
}

/**
 * 将 vue-router 风格的路径转换为 uni-app pages.json 路径
 *
 * 支持路径参数：
 *   '/m/mall/123'     → '/pages/mall/detail?id=123'
 *   '/m/order/456'    → '/pages/orders/detail?id=456'
 *   '/m/member-detail/789' → '/pages/agent/member-detail?id=789'
 */
export function resolveRoute(vuePath: string): string {
  // 去掉 query 参数
  const [pathWithoutQuery, queryString] = vuePath.split('?')

  // 精确匹配
  if (ROUTE_MAP[vuePath]) {
    return ROUTE_MAP[vuePath]
  }

  // 模式匹配（带参数）
  for (const [pattern, uniPath] of Object.entries(ROUTE_MAP)) {
    if (pattern.includes(':')) {
      // 将路由模式转为正则
      const paramNames: string[] = []
      const regexPattern = pattern
        .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\:(\w+)/g, (_, name) => {
          paramNames.push(name)
          return '([^/]+)'
        })

      const regex = new RegExp(`^${regexPattern}$`)
      const match = pathWithoutQuery.match(regex)

      if (match) {
        // 提取参数
        const params: Record<string, string> = {}
        paramNames.forEach((name, i) => {
          params[name] = match[i + 1]
        })

        // 将参数转为 query string
        let result = uniPath
        // 替换路径中的 :id 占位
        for (const [key, value] of Object.entries(params)) {
          result = result.replace(`:${key}`, value)
        }

        // 如果路径中还有未替换的占位符（说明 uniPath 模式与 vue 模式不同），
        // 则用 query 参数传递
        if (result.includes(':')) {
          const queryParts = Object.entries(params)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          if (queryString) {
            queryParts.push(queryString)
          }
          // 回退到基础路径
          const basePath = result.split(':')[0].replace(/\/$/, '')
          return `${basePath}?${queryParts.join('&')}`
        }

        // 追加原始 query 参数
        if (queryString) {
          result += (result.includes('?') ? '&' : '?') + queryString
        }
        return result
      }
    }
  }

  // 未匹配到，直接返回原路径（去掉 /m 前缀）
  return vuePath.replace('/m/', '/pages/')
}

/** 判断是否为 tabBar 页面 */
const TAB_BAR_PATHS = [
  '/pages/home/index',
  '/pages/info/index',
  '/pages/mall/index',
  '/pages/mcn/authorization',
  '/pages/profile/index',
]

function isTabBarPage(uniPath: string): boolean {
  const basePath = uniPath.split('?')[0]
  return TAB_BAR_PATHS.includes(basePath)
}

export const navigator = {
  /**
   * 跳转到新页面（压入栈）
   * 对应 router.push(path)
   */
  push(path: string): void {
    const uniPath = resolveRoute(path)
    if (isTabBarPage(uniPath)) {
      uni.switchTab({ url: uniPath })
    } else {
      uni.navigateTo({ url: uniPath })
    }
  },

  /**
   * 替换当前页面（不压入栈）
   * 对应 router.replace(path)
   */
  replace(path: string): void {
    const uniPath = resolveRoute(path)
    if (isTabBarPage(uniPath)) {
      uni.switchTab({ url: uniPath })
    } else {
      uni.redirectTo({ url: uniPath })
    }
  },

  /**
   * 返回上一页
   * 对应 router.back()
   */
  back(delta: number = 1): void {
    uni.navigateBack({ delta })
  },

  /**
   * 切换 Tab 页
   */
  switchTab(path: string): void {
    const uniPath = resolveRoute(path)
    uni.switchTab({ url: uniPath })
  },

  /**
   * 重启到指定页面（清空页面栈）
   */
  reLaunch(path: string): void {
    const uniPath = resolveRoute(path)
    uni.reLaunch({ url: uniPath })
  },
}
