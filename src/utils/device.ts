/**
 * 跨端设备能力封装
 *
 * 统一封装剪贴板、电话拨打、图片预览等原生能力。
 * 使用条件编译区分 H5 和小程序端的差异。
 */

/**
 * 复制文本到剪贴板
 *
 * H5 端：优先使用 navigator.clipboard，降级到 textarea + execCommand
 * 小程序端：使用 uni.setClipboardData
 */
export function copyToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    // #ifdef H5
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => resolve(true))
        .catch(() => {
          // 降级到 textarea 方案
          fallbackCopy(text)
          resolve(true)
        })
    } else {
      fallbackCopy(text)
      resolve(true)
    }
    // #endif

    // #ifndef H5
    uni.setClipboardData({
      data: text,
      success: () => resolve(true),
      fail: () => resolve(false),
    })
    // #endif
  })
}

/** H5 降级复制方案 */
function fallbackCopy(text: string): void {
  // #ifdef H5
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
  } catch {
    // ignore
  }
  document.body.removeChild(textarea)
  // #endif
}

/**
 * 拨打电话
 *
 * H5 端：使用 window.location.href = 'tel:xxx'
 * 小程序端：使用 uni.makePhoneCall
 */
export function makePhoneCall(phone: string): void {
  // #ifdef H5
  window.location.href = `tel:${phone}`
  // #endif

  // #ifndef H5
  uni.makePhoneCall({
    phoneNumber: phone,
    fail: () => {
      uni.showToast({ title: '拨号取消', icon: 'none' })
    },
  })
  // #endif
}

/**
 * 预览图片
 *
 * @param urls 图片地址列表
 * @param current 当前显示的图片索引
 */
export function previewImage(urls: string[], current?: number): void {
  uni.previewImage({
    urls,
    current: current !== undefined ? urls[current] : undefined,
  })
}

/**
 * 显示轻提示
 */
export function showToast(title: string, icon: 'none' | 'success' | 'error' = 'none'): void {
  uni.showToast({ title, icon, duration: 2000 })
}

/**
 * 显示加载中
 */
export function showLoading(title: string = '加载中...'): void {
  uni.showLoading({ title, mask: true })
}

/**
 * 隐藏加载中
 */
export function hideLoading(): void {
  uni.hideLoading()
}

/**
 * 显示模态框
 */
export function showConfirm(title: string, content: string): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(!!res.confirm)
      },
      fail: () => {
        resolve(false)
      },
    })
  })
}

/**
 * 获取页面 query 参数
 *
 * 在 uni-app 中，页面参数通过 onLoad/onShow 的 options 传入，
 * 此方法用于在非生命周期内获取当前页面的参数。
 */
export function getPageQuery(): Record<string, string> {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  if (!currentPage) return {}

  // #ifdef H5
  // H5 端从 URL 获取
  const url = new URL(window.location.href)
  const params: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
  // #endif

  // #ifndef H5
  // 小程序端从 onLoad options 获取（需要页面中自行保存）
  return (currentPage as any).$page?.options || (currentPage as any).options || {}
  // #endif
}
