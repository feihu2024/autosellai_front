/**
 * 跨端支付封装
 *
 * H5 端：模拟支付（调用后端 simulate-pay 接口）
 * 微信小程序端：wx.requestPayment（需后端统一下单返回支付参数）
 */

import request from './request'
import { storage } from './storage'
import type { ApiResponse } from './request'
import { showToast } from './device'

/** 微信支付参数（由后端统一下单返回） */
export interface WxPayParams {
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
  paySign: string
}

/**
 * 模拟支付（H5 端 / 开发测试用）
 *
 * 直接调用后端 simulate-pay 接口，标记订单为已支付。
 */
export function simulatePay(orderId: number): Promise<ApiResponse> {
  return request.post(`/v1/miniapp/mall/orders/${orderId}/simulate-pay`)
}

/**
 * 模拟支付（套餐订单）
 */
export function simulatePackagePay(orderId: number): Promise<ApiResponse> {
  return request.post(`/v1/miniapp/orders/${orderId}/simulate-pay`)
}

/**
 * 微信小程序支付
 *
 * 流程：
 * 1. 调用后端 /v1/miniapp/mall/orders/{id}/prepay 获取统一下单参数
 * 2. 调用 wx.requestPayment 唤起微信支付
 * 3. 支付成功后返回
 */
export function wxPay(orderId: number): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      // 1. 获取统一下单参数
      const res = await request.post<WxPayParams>(`/v1/miniapp/mall/orders/${orderId}/prepay`)
      const payParams = res.data
      if (!payParams || !payParams.timeStamp) {
        reject(new Error('获取支付参数失败'))
        return
      }

      // 2. 调用微信支付
      // #ifdef MP-WEIXIN
      uni.requestPayment({
        provider: 'wxpay',
        timeStamp: payParams.timeStamp,
        nonceStr: payParams.nonceStr,
        package: payParams.package,
        signType: payParams.signType as 'MD5' | 'HMAC-SHA256',
        paySign: payParams.paySign,
        success: () => {
          showToast('支付成功', 'success')
          resolve(true)
        },
        fail: (err) => {
          if (err.errMsg?.includes('cancel')) {
            showToast('支付已取消')
          } else {
            showToast('支付失败')
          }
          resolve(false)
        },
      })
      // #endif

      // #ifndef MP-WEIXIN
      // H5 端降级为模拟支付
      await simulatePay(orderId)
      showToast('支付成功', 'success')
      resolve(true)
      // #endif
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 统一支付入口（根据平台自动选择支付方式）
 *
 * @param orderId 订单 ID
 * @returns true = 支付成功，false = 支付取消/失败
 */
export async function pay(orderId: number): Promise<boolean> {
  // #ifdef H5
  // H5 端使用模拟支付
  await simulatePay(orderId)
  showToast('支付成功', 'success')
  return true
  // #endif

  // #ifdef MP-WEIXIN
  // 微信小程序端使用真实微信支付
  return wxPay(orderId)
  // #endif
}
