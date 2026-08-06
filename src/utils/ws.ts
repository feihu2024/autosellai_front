/**
 * 跨端 WebSocket 封装
 *
 * 基于 uni.connectSocket 实现，统一 H5 与微信小程序的 WebSocket 接口。
 *
 * 核心用途：智能体流式对话（替代原 fetch SSE 方案）
 */

import { storage } from './storage'

/**
 * 构建 WebSocket 基础 URL
 *
 * H5：从当前页面地址推导（开发时通过 Vite proxy 代理 ws）
 * 小程序：使用配置的后端域名（生产 wss）
 */
function getWsBaseUrl(): string {
  // #ifdef H5
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.host
  return `${protocol}//${host}/api`
  // #endif

  // #ifndef H5
  // 微信小程序：需配置真实后端域名（在微信后台添加 socket 合法域名）
  // 开发期可通过 manifest.json → mp-weixin → setting → urlCheck: false 跳过校验
  return 'wss://aiplatformsslapi.yxiaozhu.com/api'
  // #endif
}

/** WebSocket 回调选项 */
export interface WsOptions {
  onOpen?: () => void
  onMessage?: (data: string) => void
  onClose?: (code: number, reason: string) => void
  onError?: (errMsg: string) => void
}

/** uni.connectSocket 返回的 SocketTask 类型 */
export interface UniSocketTask {
  send: (opts: { data: string }) => void
  close: (opts?: { code?: number; reason?: string }) => void
  onOpen: (cb: () => void) => void
  onMessage: (cb: (res: { data: string | ArrayBuffer }) => void) => void
  onClose: (cb: (res: { code: number; reason: string }) => void) => void
  onError: (cb: (res: { errMsg: string }) => void) => void
}

/**
 * 创建 WebSocket 连接
 *
 * @param path  API 路径（不含 /api 前缀），如 '/v1/miniapp/agents/1/chat/ws'
 * @param token  鉴权 token（通过 query 参数传递）
 * @param options  回调
 * @returns SocketTask 实例
 */
export function createWebSocket(path: string, token?: string, options?: WsOptions): UniSocketTask {
  const baseUrl = getWsBaseUrl()
  let url = `${baseUrl}${path}`
  if (token) {
    url += (url.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`
  }

  const socketTask = uni.connectSocket({
    url,
    complete: () => { },
  }) as unknown as UniSocketTask

  if (options?.onOpen) {
    socketTask.onOpen(() => options.onOpen!())
  }

  if (options?.onMessage) {
    const cb = options.onMessage
    socketTask.onMessage((res) => {
      const data = typeof res.data === 'string' ? res.data : ''
      if (data) cb(data)
    })
  }

  if (options?.onClose) {
    const cb = options.onClose
    socketTask.onClose((res) => cb(res.code, res.reason))
  }

  if (options?.onError) {
    const cb = options.onError
    socketTask.onError((res) => cb(res.errMsg || 'WebSocket错误'))
  }

  return socketTask
}

/**
 * 获取 miniapp token（用于 WebSocket 鉴权）
 */
export function getWsToken(): string | undefined {
  return storage.getItem('miniapp_token') || undefined
}
