/**
 * 工具层统一导出
 *
 * 所有跨端封装工具从此文件统一导出，页面中只需 import from '@/utils'
 */

export { default as request } from './request'
export type { ApiResponse, RequestOptions } from './request'

export { storage, localStorageCompat } from './storage'

export { navigator, resolveRoute } from './navigator'

export {
  copyToClipboard,
  makePhoneCall,
  previewImage,
  showToast,
  showLoading,
  hideLoading,
  showConfirm,
  getPageQuery,
} from './device'

export {
  isLoggedIn,
  getToken,
  logout,
  trySilentLogin,
  wxLogin,
  bindPhoneWithWx,
  sendSmsCode,
  loginWithPhone,
  getMiniAppId,
} from './auth'

export { pay, simulatePay, simulatePackagePay, wxPay } from './payment'
export type { WxPayParams } from './payment'

export { ROUTES, TAB_BAR_PATHS, isTabBarPage } from './routes'

export {
  canShow,
  recordExposure,
  getTodayCount,
  resetFrequency,
} from './adFrequency'

export { createWebSocket, getWsToken } from './ws'
export type { WsOptions, UniSocketTask } from './ws'
