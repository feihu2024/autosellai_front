/**
 * 全局分享混入（Options API）
 *
 * 在 main.ts 中通过 app.mixin() 全局注册，为所有页面提供默认分享能力。
 * 分享链接自动携带邀请参数（referrer_id + enterprise_id）。
 *
 * 注意：
 * - 页面级 useShare() 或 onShareAppMessage 会覆盖此默认实现
 * - 关键页面（首页/商品详情等）建议显式调用 useShare() 自定义分享内容
 * - 此 mixin 作为兜底，确保未显式配置的页面也能带邀请参数
 */
import { useGlobalState } from '@/composables/useGlobalState'

export const shareMixin = {
  onShareAppMessage(_res: any) {
    const { getInviteQuery, currentUserName } = useGlobalState()
    const query = getInviteQuery()
    const name = currentUserName.value
    return {
      title: name ? `${name} 邀请你一起体验` : '邀请你一起体验',
      path: `/pages/home/index${query ? '?' + query : ''}`,
    }
  },
  onShareTimeline() {
    const { getInviteQuery, currentUserName } = useGlobalState()
    const query = getInviteQuery()
    const name = currentUserName.value
    return {
      title: name ? `${name} 邀请你一起体验` : '邀请你一起体验',
      query,
    }
  },
}
