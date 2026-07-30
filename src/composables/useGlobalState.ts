/**
 * 全局状态管理（单例模式）
 *
 * 管理小程序运行期间需要全局共享的关键信息：
 * - 当前用户 ID（分享时作为 referrer_id 携带）
 * - 当前企业 ID（分享时携带，登录时自动带入）
 * - 待使用的邀请人 ID（从启动参数解析，登录时消费）
 *
 * 采用模块级单例 + storage 持久化，与 useMiniappTemplate 同样的模式。
 */
import { ref } from 'vue'
import { storage } from '@/utils/storage'

// ===== storage keys =====
const SK_USER_ID = 'miniapp_user_id'
const SK_ENTERPRISE_ID = 'miniapp_enterprise_id'
const SK_USERNAME = 'miniapp_username'
const SK_PENDING_REFERRER = 'pending_referrer_id'

// ===== 模块级单例状态 =====
const currentUserId = ref<number | null>(null)
const currentEnterpriseId = ref<number | null>(2)  // 默认企业ID
const currentUserName = ref<string>('')
const pendingReferrerId = ref<number | null>(null) // 待使用的邀请人ID
const loginInitialized = ref<boolean>(false) // 登录初始化完成标志

/** 从 storage 初始化（模块加载时自动执行） */
function initFromStorage() {
  const uid = storage.getItem(SK_USER_ID)
  if (uid) currentUserId.value = Number(uid)

  const eid = storage.getItem(SK_ENTERPRISE_ID)
  if (eid) currentEnterpriseId.value = Number(eid)

  const name = storage.getItem(SK_USERNAME)
  if (name) currentUserName.value = name

  const pendingRef = storage.getItem(SK_PENDING_REFERRER)
  if (pendingRef) pendingReferrerId.value = Number(pendingRef)
}

initFromStorage()

export function useGlobalState() {
  /**
   * 设置当前用户信息（登录成功后调用）
   */
  function setUserInfo(user: any) {
    if (user?.id) {
      currentUserId.value = user.id
      storage.setItem(SK_USER_ID, String(user.id))
    }
    if (user?.enterprise_id) {
      currentEnterpriseId.value = user.enterprise_id
      storage.setItem(SK_ENTERPRISE_ID, String(user.enterprise_id))
    }
    if (user?.nickname) {
      currentUserName.value = user.nickname
      storage.setItem(SK_USERNAME, user.nickname)
    }
  }

  /**
   * 设置邀请参数（从启动参数/分享链接解析后调用）
   * referrerId 会被暂存，在后续登录时消费
   */
  function setInviteParams(referrerId?: number | null, enterpriseId?: number | null) {
    if (referrerId && !isNaN(Number(referrerId))) {
      pendingReferrerId.value = Number(referrerId)
      storage.setItem(SK_PENDING_REFERRER, String(referrerId))
    }
    if (enterpriseId && !isNaN(Number(enterpriseId))) {
      currentEnterpriseId.value = Number(enterpriseId)
      storage.setItem(SK_ENTERPRISE_ID, String(enterpriseId))
    }
  }

  /**
   * 消费待处理的邀请人ID（登录成功后调用，清除暂存）
   */
  function consumePendingReferrer(): number | null {
    const refId = pendingReferrerId.value
    pendingReferrerId.value = null
    storage.removeItem(SK_PENDING_REFERRER)
    return refId
  }

  /**
   * 构建邀请参数 query 字符串（用于分享链接）
   * 格式：referrer_id=xxx&enterprise_id=xxx
   */
  function getInviteQuery(extraParams?: Record<string, string | number>): string {
    const params: string[] = []
    if (currentUserId.value) {
      params.push(`referrer_id=${currentUserId.value}`)
    }
    if (currentEnterpriseId.value) {
      params.push(`enterprise_id=${currentEnterpriseId.value}`)
    }
    if (extraParams) {
      for (const [k, v] of Object.entries(extraParams)) {
        params.push(`${k}=${encodeURIComponent(String(v))}`)
      }
    }
    return params.join('&')
  }

  /**
   * 获取当前用户ID（分享时用）
   */
  function getUserId(): number | null {
    return currentUserId.value
  }

  /**
   * 清除所有状态（登出时调用）
   */
  function clearAll() {
    currentUserId.value = null
    currentEnterpriseId.value = null
    currentUserName.value = ''
    pendingReferrerId.value = null
    loginInitialized.value = false
    storage.removeItem(SK_USER_ID)
    storage.removeItem(SK_ENTERPRISE_ID)
    storage.removeItem(SK_USERNAME)
    storage.removeItem(SK_PENDING_REFERRER)
  }

  /**
   * 标记登录初始化完成
   */
  function setLoginInitialized() {
    loginInitialized.value = true
  }

  return {
    currentUserId,
    currentEnterpriseId,
    currentUserName,
    pendingReferrerId,
    loginInitialized,
    setUserInfo,
    setInviteParams,
    consumePendingReferrer,
    getInviteQuery,
    getUserId,
    clearAll,
    setLoginInitialized,
  }
}
