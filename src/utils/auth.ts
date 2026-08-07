/**
 * 跨端认证封装
 *
 * H5 端：保留手机号验证码登录流程
 * 微信小程序端：wx.login → code2session → getPhoneNumber 授权
 *
 * 关键改进：
 * - wxLogin 自动携带小程序 appid（后端通过 appid 反查企业，解决直接打开的死锁）
 * - trySilentLogin 从全局状态读取邀请参数并透传
 * - 登录成功后自动将用户信息写入全局状态（供分享时使用 referrer_id）
 */

import request from './request'
import { storage } from './storage'
import type { ApiResponse } from './request'
import { useGlobalState } from '@/composables/useGlobalState'

/** 用户认证信息 */
export interface AuthInfo {
  token: string
  userId?: number
  phone?: string
  isNewUser?: boolean
}

/**
 * 获取当前小程序的 AppID（仅小程序端可用）
 */
export function getMiniAppId(): string | undefined {
  // #ifdef MP-WEIXIN
  try {
    const info = uni.getAccountInfoSync()
    return info.miniProgram.appId
  } catch {
    return undefined
  }
  // #endif
  return undefined
}

/**
 * H5 端：发送短信验证码
 */
export function sendSmsCode(phone: string): Promise<ApiResponse> {
  return request.post('/v1/miniapp/auth/send-code', { phone })
}

/**
 * H5 端：手机号验证码登录
 */
export function loginWithPhone(
  phone: string,
  code: string,
  referrerId?: number,
  enterpriseId?: number,
): Promise<ApiResponse<AuthInfo>> {
  return request.post('/v1/miniapp/auth/login', {
    phone,
    code,
    referrer_id: referrerId,
    enterprise_id: enterpriseId,
  }).then((res: any) => {
    // 登录成功后存储用户信息
    if (res.code === 200 && res.data?.access_token) {
      storage.setItem('miniapp_token', res.data.access_token)
      const { setUserInfo } = useGlobalState()
      setUserInfo(res.data.user)
    }
    return res
  })
}

/**
 * 微信小程序端：wx.login 静默登录
 *
 * 流程：
 * 1. wx.login() 获取临时 code
 * 2. 调用后端 /v1/miniapp/auth/wx-login 交换 token（自动携带 appid + 邀请参数）
 * 3. 后端返回 JWT Token + 用户信息
 */
export function wxLogin(referrerId?: number, enterpriseId?: number): Promise<ApiResponse<AuthInfo>> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.login({
      provider: 'weixin',
      success: (loginRes) => {
        const code = loginRes.code
        // 自动获取小程序 appid，后端可通过它反查企业
        const appid = getMiniAppId()
        request
          .post<AuthInfo>('/v1/miniapp/auth/wx-login', {
            code,
            referrer_id: referrerId,
            enterprise_id: enterpriseId,
            appid,
          })
          .then((res: any) => {
            // 登录成功后存储用户信息到全局状态
            if (res.code === 200 && res.data?.access_token) {
              storage.setItem('miniapp_token', res.data.access_token)
              const { setUserInfo, consumePendingReferrer } = useGlobalState()
              setUserInfo(res.data.user)
              consumePendingReferrer() // 清除已使用的邀请参数
            }
            resolve(res)
          })
          .catch(reject)
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '微信登录失败'))
      },
    })
    // #endif

    // #ifndef MP-WEIXIN
    reject(new Error('wxLogin 仅在微信小程序端可用'))
    // #endif
  })
}

/**
 * 微信小程序端：绑定手机号（getPhoneNumber 授权）
 *
 * 用户点击 <button open-type="getPhoneNumber"> 后，从事件中获取 code，
 * 调用后端绑定接口。
 */
export function bindPhoneWithWx(code: string): Promise<ApiResponse<AuthInfo>> {
  return request.post('/v1/miniapp/auth/bind-phone', { code }).then((res: any) => {
    if (res.code === 200 && res.data?.phone) {
      // 更新全局状态中的手机号
      const { setUserInfo } = useGlobalState()
      setUserInfo({ phone: res.data.phone })
    }
    return res
  })
}

/**
 * 检查登录状态
 */
export function isLoggedIn(): boolean {
  // #ifdef H5
  // H5 端支持 URL query 注入 token（开发便利）
  const urlParams = new URLSearchParams(window.location.search)
  const queryToken = urlParams.get('miniapp_token')
  if (queryToken) {
    storage.setItem('miniapp_token', queryToken)
  }
  // #endif

  return !!storage.getItem('miniapp_token')
}

/**
 * 获取当前 token
 */
export function getToken(): string | null {
  return storage.getItem('miniapp_token')
}

/**
 * 登出
 */
export function logout(): void {
  storage.removeItem('miniapp_token')
  const { clearAll } = useGlobalState()
  clearAll()
}

/**
 * 尝试静默登录（小程序端自动 wx.login）
 *
 * 在 App.onLaunch 中调用，用户无感知地完成登录。
 * 自动从全局状态读取邀请参数（referrer_id / enterprise_id）并透传。
 * 如果后端返回需要绑定手机号，则不自动处理，等用户主动操作。
 */
export async function trySilentLogin(): Promise<boolean> {
  if (isLoggedIn()) {
    return true
  }

  // #ifdef MP-WEIXIN
  try {
    // 从全局状态读取邀请参数
    const { pendingReferrerId, currentEnterpriseId } = useGlobalState()
    const res = await wxLogin(
      pendingReferrerId.value || undefined,
      currentEnterpriseId.value || undefined,
    )
    if (res.code === 200 && res.data?.token) {
      storage.setItem('miniapp_token', res.data.token)
      return true
    }
  } catch {
    // 静默失败
  }
  // #endif

  return false
}

/**
 * 检查用户是否已绑定手机号
 * 如果没有手机号，显示提示
 */
export function checkPhoneRequired(): boolean {
  const { currentUserPhone } = useGlobalState()

  if (!currentUserPhone.value) {
    uni.showToast({
      title: '请先绑定手机号',
      icon: 'none',
      duration: 2000
    })

    return false
  }

  return true
}

