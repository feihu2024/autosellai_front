/**
 * 跨端 HTTP 请求封装
 *
 * 基于 uni.request 实现，完整复刻原 axios 拦截器逻辑：
 * 1. 请求拦截器：根据 URL 自动注入对应 token（miniapp_token / enterprise_token / token）
 * 2. 响应拦截器：解包 {code, message, data} 业务体；401 自动跳转登录
 * 3. 错误提示：使用 uni.showToast 替代 ElMessage
 *
 * 对外接口与 axios 保持一致，使迁移的 api/miniapp.ts 无需修改。
 */

import { storage } from './storage'

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

/**
 * 核心请求方法
 */
function request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
  // 1. 执行请求拦截器
  let config = requestInterceptor(options)

  // 2. 构建 URL
  const fullUrl = buildUrl(config.url, config.params)

  // 3. 发起 uni.request
  return new Promise<ApiResponse<T>>((resolve, reject) => {
    uni.request({
      url: fullUrl,
      method: config.method || 'GET',
      data: config.data,
      header: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      timeout: config.timeout || DEFAULT_TIMEOUT,
      success: (res) => {
        // HTTP 状态码检查
        const statusCode = res.statusCode
        if (statusCode === 401) {
          handleUnauthorized()
          showError('登录已过期，请重新登录')
          reject(new Error('登录已过期'))
          return
        }
        if (statusCode === 403) {
          showError('没有权限访问')
          reject(new Error('没有权限访问'))
          return
        }
        if (statusCode === 500) {
          showError('服务器错误')
          reject(new Error('服务器错误'))
          return
        }
        if (statusCode < 200 || statusCode >= 300) {
          const errMsg = (res.data as any)?.message || `请求失败(${statusCode})`
          showError(errMsg)
          reject(new Error(errMsg))
          return
        }

        // 4. 执行响应拦截器
        try {
          const processed = responseInterceptor(res.data as ApiResponse<T>)
          resolve(processed)
        } catch (err) {
          reject(err)
        }
      },
      fail: (err) => {
        showError('网络连接异常')
        reject(new Error(err.errMsg || '网络连接异常'))
      },
    })
  })
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
