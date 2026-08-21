/**
 * 跨端 HTTP 请求封装
 *
 * 基于 uni.request 实现，完整复刻原 axios 拦截器逻辑：
 * 1. 请求拦截器：根据 URL 自动注入对应 token（miniapp_token / enterprise_token / token）
 * 2. 响应拦截器：解包 {code, message, data} 业务体；401 自动跳转登录
 * 3. 错误提示：使用 uni.showToast 替代 ElMessage
 * 4. 401 自动恢复：小程序端 token 过期时自动 wx.login 静默换取新 token 并重试原请求
 *
 * 对外接口与 axios 保持一致，使迁移的 api/miniapp.ts 无需修改。
 */

import { storage } from './storage'
import { useGlobalState } from '@/composables/useGlobalState'

/** 后端统一响应格式 */
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 请求配置 */
export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  data?: any
  params?: Record<string, any>
  headers?: Record<string, string>
  timeout?: number
}

/** 拦截器类型 */
type RequestInterceptor = (config: RequestOptions) => RequestOptions
type ResponseInterceptor = (response: ApiResponse) => ApiResponse

// ============ 配置 ============

const BASE_URL = 'https://aiplatformsslapi.yxiaozhu.com/api'
const DEFAULT_TIMEOUT = 60000

// ============ 拦截器 ============

/** 请求拦截器：token 注入 */
const requestInterceptor: RequestInterceptor = (config) => {
  const url = config.url || ''
  let token: string | null = null

  if (url.includes('/enterprise/')) {
    token = storage.getItem('enterprise_token')
  } else if (url.includes('/miniapp')) {
    token = storage.getItem('miniapp_token')
  } else {
    token = storage.getItem('token')
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  return config
}

/** 响应拦截器：业务码处理 + 401 跳转 */
const responseInterceptor: ResponseInterceptor = (response) => {
  // 非成功码
  if (response.code && response.code !== 0 && response.code !== 200) {
    showError(response.message || '请求失败')

    if (response.code === 401) {
      handleUnauthorized()
    }
    throw new Error(response.message || '请求失败')
  }

  return response
}

/** 401 处理：根据当前页面判断清除哪个 token */
function handleUnauthorized() {
  // 获取当前页面路由
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const route = currentPage ? `/${currentPage.route}` : ''

  if (route.includes('/user/') || route.includes('/agent/') || route.includes('/mall/') || route.includes('/orders/')) {
    // 小程序端页面 —— 清除 miniapp_token
    storage.removeItem('miniapp_token')
    // H5 端跳转登录页；小程序端重新 wx.login
    // #ifdef H5
    uni.reLaunch({ url: '/pages/home/index' })
    // #endif
  } else if (route.includes('/mcn/')) {
    storage.removeItem('miniapp_token')
  } else {
    storage.removeItem('token')
  }
}

/** 显示错误提示 */
function showError(message: string) {
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2500,
  })
}

/** 构建 URL（拼接 baseURL + query params） */
function buildUrl(url: string, params?: Record<string, any>): string {
  let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  if (params && Object.keys(params).length > 0) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
    if (query) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + query
    }
  }

  return fullUrl
}

// ============ 401 静默重登录 ============

/**
 * 通过 wx.login 静默换取新 token（仅小程序端）
 *
 * 注意：这里必须用原生 uni.request 直接调用登录接口，不能复用 auth.ts 的 wxLogin：
 * 1. auth.ts 引用了本文件，反向引用会形成循环依赖
 * 2. 登录请求若再经过本封装，一旦返回 401 会递归触发重登录，造成死锁卡死
 */
async function doSilentWxRelogin(): Promise<string | null> {
  let token: string | null = null

  // #ifdef MP-WEIXIN
  try {
    // 1. wx.login 获取临时 code
    const loginRes = await new Promise<any>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject,
      })
    })

    // 2. 获取小程序 appid（后端通过 appid 反查企业）
    let appid: string | undefined
    try {
      appid = uni.getAccountInfoSync().miniProgram.appId
    } catch {
      appid = undefined
    }

    // 3. 调用后端 wx-login 接口换取新 token
    const { pendingReferrerId, currentEnterpriseId, setUserInfo, consumePendingReferrer } = useGlobalState()
    const res = await new Promise<any>((resolve, reject) => {
      uni.request({
        url: `${BASE_URL}/v1/miniapp/auth/wx-login`,
        method: 'POST',
        data: {
          code: loginRes?.code,
          referrer_id: pendingReferrerId.value || undefined,
          enterprise_id: currentEnterpriseId.value || undefined,
          appid,
        },
        header: { 'Content-Type': 'application/json' },
        timeout: DEFAULT_TIMEOUT,
        success: resolve,
        fail: reject,
      })
    })

    const body = res?.data
    if (res.statusCode === 200 && body?.code === 200) {
      const newToken = body?.data?.access_token || body?.data?.token
      if (newToken) {
        storage.setItem('miniapp_token', newToken)
        setUserInfo(body.data.user)
        consumePendingReferrer()
        token = newToken
      }
    }
  } catch {
    // 静默失败，交由调用方走原 401 逻辑
  }
  // #endif

  return token
}

/** 并发去重：多个请求同时 401 时，只发起一次静默重登录 */
let refreshingPromise: Promise<string | null> | null = null

function silentRelogin(): Promise<string | null> {
  if (!refreshingPromise) {
    refreshingPromise = doSilentWxRelogin().finally(() => {
      refreshingPromise = null
    })
  }
  return refreshingPromise
}

/** 发起底层 uni.request（网络异常统一提示并 reject） */
function rawRequest<T = any>(fullUrl: string, config: RequestOptions): Promise<any> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method: config.method || 'GET',
      data: config.data,
      header: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      timeout: config.timeout || DEFAULT_TIMEOUT,
      success: resolve,
      fail: (err) => {
        showError('网络连接异常')
        reject(new Error(err.errMsg || '网络连接异常'))
      },
    })
  })
}

/**
 * 核心请求方法
 *
 * @param isRetry 是否为 401 重登录后的重试（防止 token 一直无效时无限循环重试）
 */
async function request<T = any>(options: RequestOptions, isRetry = false): Promise<ApiResponse<T>> {
  // 1. 执行请求拦截器（从 storage 读取最新 token 注入）
  const config = requestInterceptor(options)

  // 2. 构建 URL
  const fullUrl = buildUrl(config.url, config.params)

  // 3. 发起请求
  const res = await rawRequest<T>(fullUrl, config)
  const body = res.data as ApiResponse<T> | undefined

  // 4. 401（HTTP 状态码或业务码）：小程序端先静默重新登录，成功后用新 token 自动重试一次
  const isUnauthorized = res.statusCode === 401 || body?.code === 401
  if (isUnauthorized && !isRetry && (config.url || '').includes('/miniapp')) {
    const newToken = await silentRelogin()
    if (newToken) {
      return request<T>(options, true)
    }
  }

  // 5. HTTP 状态码检查
  if (res.statusCode === 401) {
    handleUnauthorized()
    // showError('登录已过期，请重新登录')
    throw new Error('登录已过期')
  }
  if (res.statusCode === 403) {
    showError('没有权限访问')
    throw new Error('没有权限访问')
  }
  if (res.statusCode === 500) {
    showError('服务器错误')
    throw new Error('服务器错误')
  }
  if (res.statusCode < 200 || res.statusCode >= 300) {
    const errMsg = body?.message || `请求失败(${res.statusCode})`
    showError(errMsg)
    throw new Error(errMsg)
  }

  // 6. 执行响应拦截器
  return responseInterceptor(body as ApiResponse<T>)
}

/**
 * 快捷方法工厂
 *
 * 生成与 axios 实例方法签名一致的 get/post/put/delete 函数，
 * 让 api/miniapp.ts 中的 request.get('/path') 调用可以无修改运行。
 */
function createMethod(method: string) {
  return <T = any>(url: string, configOrData?: any): Promise<ApiResponse<T>> => {
    // GET / DELETE：第二个参数是 config（含 params）
    // POST / PUT / PATCH：第二个参数是 data
    if (method === 'GET' || method === 'DELETE') {
      return request<T>({
        url,
        method: method as any,
        params: configOrData?.params,
        headers: configOrData?.headers,
        timeout: configOrData?.timeout,
      })
    } else {
      return request<T>({
        url,
        method: method as any,
        data: configOrData,
        headers: configOrData?.headers,
      })
    }
  }
}

/**
 * request 对象（与 axios 实例接口完全一致）
 *
 * 用法：
 *   request.get('/v1/miniapp/config')
 *   request.post('/v1/miniapp/auth/login', { phone, code })
 *   request.put('/v1/miniapp/agent-revenue/ratio', { ratio: 0.5 })
 *   request.delete('/v1/miniapp/agents/1/favorite')
 */
const httpRequest = {
  get: createMethod('GET'),
  post: createMethod('POST'),
  put: createMethod('PUT'),
  delete: createMethod('DELETE'),
  patch: createMethod('PATCH'),
  request: <T = any>(options: RequestOptions) => request<T>(options),
}

export default httpRequest
