/**
 * uni-app 跨端工具：页面路径管理
 *
 * 提供 vue-router 风格的路径常量，便于页面间跳转引用。
 */

export const ROUTES = {
  HOME: '/pages/home/index',
  INFO: '/pages/info/index',
  INFO_DETAIL: '/pages/info/detail',
  MALL: '/pages/mall/index',
  MALL_DETAIL: '/pages/mall/detail',
  MALL_CHECKOUT: '/pages/mall/checkout',
  MCN_AUTH: '/pages/mcn/authorization',
  MCN_TUTORIAL: '/pages/mcn/tutorial',
  MCN_WEBVIEW: '/pages/mcn/auth-webview',
  PROFILE: '/pages/profile/index',
  ORDERS: '/pages/orders/index',
  ORDER_DETAIL: '/pages/orders/detail',
  LOGISTICS: '/pages/orders/logistics',
  AGENT_CHAT: '/pages/agent/chat',
  AGENT_WORKBENCH: '/pages/agent/workbench',
  REFERRALS: '/pages/agent/referrals',
  MEMBER_DETAIL: '/pages/agent/member-detail',
  REVENUE_DETAIL: '/pages/agent/revenue-detail',
  ACTIVATE: '/pages/user/activate',
  CARDS: '/pages/user/cards',
  BALANCE: '/pages/user/balance',
  COMPUTE: '/pages/user/compute',
  CONTACTS: '/pages/user/contacts',
  PAYMENTS: '/pages/user/payments',
  ADDRESSES: '/pages/user/addresses',
  PRIVACY: '/pages/user/privacy',
  WITHDRAW: '/pages/user/withdraw',
  SHARE: '/pages/user/share',
} as const

/** TabBar 页面路径列表 */
export const TAB_BAR_PATHS = [
  ROUTES.HOME,
  ROUTES.INFO,
  ROUTES.MALL,
  ROUTES.MCN_AUTH,
  ROUTES.PROFILE,
]

/** 判断路径是否为 TabBar 页面 */
export function isTabBarPage(path: string): boolean {
  const basePath = path.split('?')[0]
  return TAB_BAR_PATHS.includes(basePath as any)
}
