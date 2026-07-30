/**
 * 图片地址处理工具
 */

const IMAGE_BASE_URL = 'https://aiplatformsslapi.yxiaozhu.com'

/**
 * 处理图片地址
 *
 * @param url 原始图片地址
 * @returns 处理后的完整图片地址
 *
 * 如果地址不包含 http，则拼接基础域名
 * 如果地址已包含 http，则直接返回原地址
 *
 * @example
 * getImageUrl('/uploads/image.png') // 'https://aiplatformsslapi.yxiaozhu.com/uploads/image.png'
 * getImageUrl('https://example.com/image.png') // 'https://example.com/image.png'
 * getImageUrl('') // ''
 * getImageUrl(null) // ''
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) {
    return ''
  }

  // 如果已经包含 http 或 https，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // 拼接基础域名
  // 确保路径以 / 开头
  const path = url.startsWith('/') ? url : `/${url}`
  return `${IMAGE_BASE_URL}${path}`
}