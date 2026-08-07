/**
 * 小程序端 API 接口层 — uni-app 跨端版本
 *
 * 与原版差异：底层从 axios 改为 uni.request 封装
 * 接口签名完全一致，页面组件可无修改迁移。
 */

import request from '@/utils/request'
import { createWebSocket, getWsToken } from '@/utils/ws'

// ========== 认证 ==========

export function miniappLogin(data: { phone: string; code: string; referrer_id?: number; enterprise_id?: number }) {
  return request.post('/v1/miniapp/auth/login', data)
}

export function sendSmsCode(data: { phone: string }) {
  return request.post('/v1/miniapp/auth/send-code', data)
}

export function getMiniappProfile() {
  return request.get('/v1/miniapp/auth/profile')
}

export function updateMiniappProfile(data: { nickname?: string; avatar?: string }) {
  return request.post('/v1/miniapp/auth/update-profile', data)
}

export function uploadFile(filePath: string) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: 'https://aiplatformsslapi.yxiaozhu.com/api/v1/miniapp/auth/upload-avatar',
      filePath,
      name: 'file',
      header: {
        'Authorization': `Bearer ${uni.getStorageSync('miniapp_token')}`
      },
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) {
            resolve(data.data)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        } catch {
          reject(new Error('解析上传结果失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '上传失败'))
      }
    })
  })
}

export function wxLogin(data: { code: string; enterprise_id?: number; referrer_id?: number }) {
  return request.post('/v1/miniapp/auth/wx-login', data)
}

export function bindPhone(data: { code?: string; encrypted_data?: string; iv?: string }) {
  return request.post('/v1/miniapp/auth/bind-phone', data)
}

// ========== 智能体 ==========

export function getMiniappAgents(params?: any) {
  return request.get('/v1/miniapp/agents', { params })
}

export function getMiniappAgentCategories() {
  return request.get('/v1/miniapp/agents/categories')
}

export function getMiniappAgentDetail(id: number) {
  return request.get(`/v1/miniapp/agents/${id}`)
}

export function getAgentGreeting(id: number) {
  return request.get(`/v1/miniapp/agents/${id}/greeting`)
}

export function favoriteAgent(id: number) {
  return request.post(`/v1/miniapp/agents/${id}/favorite`)
}

export function unfavoriteAgent(id: number) {
  return request.delete(`/v1/miniapp/agents/${id}/favorite`)
}

export function chatWithAgent(id: number, data: { message: string }) {
  return request.post(`/v1/miniapp/agents/${id}/chat`, data)
}

/**
 * 流式对话（WebSocket）
 *
 * 跨端兼容：H5 通过 Vite proxy 代理 ws，小程序直接连接后端 wss。
 * 与原 fetch SSE 版签名完全一致，页面组件无需修改。
 */
export async function chatWithAgentStream(
  id: number,
  message: string,
  onChunk: (text: string) => void,
  onDone?: () => void,
  onError?: (err: Error) => void,
): Promise<void> {
  const token = getWsToken()

  return new Promise<void>((resolve) => {
    let settled = false

    const socket = createWebSocket(
      `/v1/miniapp/agents/${id}/chat/ws`,
      token,
      {
        onOpen: () => {
          socket.send({ data: JSON.stringify({ message }) })
        },
        onMessage: (raw: string) => {
          try {
            const parsed = JSON.parse(raw)
            if (parsed.done) {
              settled = true
              onDone?.()
              socket.close({})
              resolve()
              return
            }
            if (parsed.error) {
              settled = true
              onError?.(new Error(parsed.error))
              socket.close({})
              resolve()
              return
            }
            if (parsed.content) {
              onChunk(parsed.content)
            }
          } catch {
            // 忽略解析失败的行
          }
        },
        onClose: () => {
          if (!settled) {
            settled = true
            onDone?.()
            resolve()
          }
        },
        onError: () => {
          if (!settled) {
            settled = true
            onError?.(new Error('网络连接异常'))
            resolve()
          }
        },
      },
    )
  })
}

// ========== 套餐与订单 ==========

export function getMiniappPackages() {
  return request.get('/v1/miniapp/packages')
}

export function createMiniappOrder(packageId: number) {
  return request.post('/v1/miniapp/orders', { package_id: packageId })
}

export function simulateOrderPay(orderId: number) {
  return request.post(`/v1/miniapp/orders/${orderId}/simulate-pay`)
}

export function getMiniappOrders() {
  return request.get('/v1/miniapp/orders')
}

// ========== 商城（实物商品）==========

export function getMiniappMallProducts(params?: any) {
  return request.get('/v1/miniapp/mall/products', { params })
}

export function getMiniappMallProduct(id: number) {
  return request.get(`/v1/miniapp/mall/products/${id}`)
}

export function createMallOrder(data: {
  product_id: number
  sku_id: number
  qty?: number
  receiver_name?: string
  receiver_phone?: string
  receiver_address?: string
  use_balance?: boolean
}) {
  return request.post('/v1/miniapp/mall/orders', data)
}

/** 创建商城订单 V2（与原 miniapp_mall.ts 的 createMallOrderV2 对齐） */
export function createMallOrderV2(data: {
  product_id: number
  sku_id: number
  qty?: number
  receiver_name: string
  receiver_phone: string
  receiver_address: string
  use_balance?: boolean
}) {
  return request.post('/v1/miniapp/mall/orders', data)
}

export function simulateMallPay(orderId: number) {
  return request.post(`/v1/miniapp/mall/orders/${orderId}/simulate-pay`)
}

/** 别名，兼容原 miniapp_mall.ts 调用名 */
export const requestMallPayment = simulateMallPay

export function getMyMallOrders(status: string = '') {
  return request.get('/v1/miniapp/mall/orders', { params: { status } })
}

/** 商城订单详情 */
export function getMallOrderDetail(orderId: number) {
  return request.get(`/v1/miniapp/mall/orders/${orderId}`)
}
/** 别名 */
export const getMyMallOrderDetail = getMallOrderDetail

/** 确认收货 */
export function confirmMallReceive(orderId: number) {
  return request.post(`/v1/miniapp/mall/orders/${orderId}/confirm-receive`)
}

/** 物流轨迹（对接快递100） */
export function getLogisticsTrack(orderId: number) {
  return request.get(`/v1/miniapp/mall/orders/${orderId}/logistics-track`)
}

/** 物流公司列表 */
export function getLogisticsCompanies() {
  return request.get('/v1/miniapp/mall/logistics-companies')
}

// ========== 信息 ==========

export function getMiniappInfoCategories() {
  return request.get('/v1/miniapp/info/categories')
}

export function getMiniappInfoList(params?: any) {
  return request.get('/v1/miniapp/info', { params })
}

export function getInfoDetail(id: number) {
  return request.get(`/v1/miniapp/info/${id}`)
}

// ========== 代理工作台 ==========

export function getAgentWorkbench() {
  return request.get('/v1/miniapp/agent-workbench')
}

export function getAgentRevenue() {
  return request.get('/v1/miniapp/agent-revenue')
}

export function setLeaderToMemberRatio(data: { leader_to_member_ratio: number }) {
  return request.put('/v1/miniapp/agent-revenue/ratio', data)
}

export function getAgentReferrals(params?: any) {
  return request.get('/v1/miniapp/agent-referrals', { params })
}

export function getMemberDetail(memberUserId: number) {
  return request.get(`/v1/miniapp/member-detail/${memberUserId}`)
}

// ========== 用户功能 ==========

export function getMiniappUserProfile() {
  return request.get('/v1/miniapp/user/profile')
}

export function getUserProfile() { return request.get('/v1/miniapp/user/profile') }
export function getUserCards() { return request.get('/v1/miniapp/user/cards') }
export function activateCard(data: { card_code: string }) { return request.post('/v1/miniapp/user/activate', data) }
export function getBalanceRecords() { return request.get('/v1/miniapp/user/balance') }
export function getComputeRecords(params?: { page?: number; page_size?: number }) { return request.get('/v1/miniapp/user/compute', { params }) }
export function getPayments() { return request.get('/v1/miniapp/user/payments') }
export function getContacts() { return request.get('/v1/miniapp/user/contacts') }
export function getWithdrawRecords() { return request.get('/v1/miniapp/user/withdraw-records') }
export function requestWithdraw(data: { amount: number }) { return request.post('/v1/miniapp/user/withdraw', data) }

// 发起微信免确认收款授权（首次提现前调用）
export function initiateTransferAuthorization() { return request.post('/v1/miniapp/user/transfer-authorization') }
export function getAddresses() { return request.get('/v1/miniapp/user/addresses') }
export function getDefaultAddress() { return request.get('/v1/miniapp/user/addresses/default') }
export function createAddress(data: any) { return request.post('/v1/miniapp/user/addresses', data) }
export function updateAddress(id: number, data: any) { return request.put(`/v1/miniapp/user/addresses/${id}`, data) }
export function deleteAddress(id: number) { return request.delete(`/v1/miniapp/user/addresses/${id}`) }
export function setDefaultAddress(id: number) { return request.post(`/v1/miniapp/user/addresses/${id}/default`) }

// ========== 卡密（cardkey）==========

export interface RecognizedCard {
  batch_id: number
  name: string
  benefit_level: '无' | '达人' | '店长' | '分销商'
  compute_power: number
  expire_date: string
  expire_status: 'active' | 'inactive' | 'expired'
}

export interface MyCard {
  id: number
  batch_id: number
  name: string
  code: string
  benefit_level: '无' | '达人' | '店长' | '分销商'
  compute_power: number
  expire_date: string
  status: 'unused' | 'activated' | 'expired'
  activated_at?: string
}

/** 我的卡密列表 */
export function getMyCards(status?: string) {
  return request.get('/v1/miniapp/cardkey/my-cards', { params: { status } })
}

/** 识别卡密（激活前预览） */
export function recognizeCardCode(code: string) {
  return request.post('/v1/miniapp/cardkey/recognize', { code })
}

/** 确认激活（权益发放） */
export function activateCardCode(code: string) {
  return request.post('/v1/miniapp/cardkey/activate', { code })
}

// ========== 配置下发 ==========

export function getMiniappConfig() { return request.get('/v1/miniapp/config') }

// ========== 激励视频 ==========

export function reportRewardVideo(data: { scene_code: string }) { return request.post('/v1/miniapp/reward-video/report', data) }
export function getRewardVideoStatus() { return request.get('/v1/miniapp/reward-video/status') }

// ========== 推广员管理 ==========

export function togglePromoter(data: { member_user_id: number; is_promoter: boolean }) { return request.post('/v1/miniapp/promoter/toggle', data) }

// ========== 权益级别管理 ==========

export function setIdentity(data: { member_user_id: number; benefit_level: string }) { return request.post('/v1/miniapp/identity/set', data) }

// ========== 分享参数 ==========

export function getShareParams() { return request.get('/v1/miniapp/share-params') }

// ========== 提取链接 / 文案提取 ==========

export function extractLink(data: { url: string }) { return request.post('/v1/miniapp/extract/link', data) }
export function extractText(data: { url: string }) { return request.post('/v1/miniapp/extract/text', data) }

// ========== 视频号带货机构（MCN）==========

export function getMcnStatus() { return request.get('/v1/miniapp/mcn/status') }
export function getMcnTutorials() { return request.get('/v1/miniapp/mcn/tutorials') }
export function bindMcn() { return request.post('/v1/miniapp/mcn/bind') }
export function getMcnAuthorization() { return request.get('/v1/miniapp/mcn/authorization') }

// ========== 教程文章详情 ==========

export function getTutorialArticle(articleId: number) {
  return request.get(`/v1/miniapp/tutorial-article/${articleId}`)
}



// 视频板块1

export function postParseVideo(data: { url: string }) {
  return request.post('/v1/miniapp/video/parse/', data)
}

export async function postDownloadVideo(data: { url: string }) {
  return request.post('/v1/miniapp/video/download/', data)
}

export function postVideoToPrompt(data: { video_url: string }) {
  return request.post('/v1/miniapp/video/to_prompt/', data)
}

export function postWenanExtract(data: { url: string }) {
  return request.post('/v1/miniapp/video/wenan/', data)
}

export async function postGenerateImage(data: any) {
  return request.post('/v1/miniapp/video/generate/', data)
}

export async function postGenerateImageQuery(data: { userid: string }) {
  return request.post('/v1/miniapp/video/generate/query', data)
}
