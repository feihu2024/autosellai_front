<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useMiniappTemplate } from '@/composables/useMiniappTemplate'
import { trySilentLogin } from '@/utils/auth'
import { useGlobalState } from '@/composables/useGlobalState'

const { loadTemplateVariant } = useMiniappTemplate()
const { setInviteParams } = useGlobalState()

/**
 * 解析小程序启动参数，提取邀请相关参数（referrer_id / enterprise_id）
 *
 * 微信小程序中，用户通过分享链接进入时：
 * - options.query.referrer_id  → 推荐人ID
 * - options.query.enterprise_id → 企业ID
 *
 * 这些参数需要在小程序首次启动时捕获并暂存，
 * 供后续 trySilentLogin 时传入后端建立推荐关系。
 */
function parseInviteParams(options: any) {
  if (!options) return

  const query = options.query || {}
  // 微信小程序码场景：scene 参数格式如 "r=123&e=1"
  let referrerId: number | null = null
  let enterpriseId: number | null = null

  // 优先从 query 直接读取（分享链接）
  if (query.referrer_id) {
    referrerId = Number(query.referrer_id)
  } else if (query.referrer) {
    referrerId = Number(query.referrer)
  } else if (query.r) {
    referrerId = Number(query.r)
  }

  if (query.enterprise_id) {
    enterpriseId = Number(query.enterprise_id)
  } else if (query.e) {
    enterpriseId = Number(query.e)
  }

  // 如果 scene 参数存在（小程序码场景），尝试解析
  const scene = options.scene
  if (scene && !referrerId) {
    const sceneStr = decodeURIComponent(String(scene))
    // 手动解析 URL 参数（小程序环境不支持 URLSearchParams）
    const sceneParams: Record<string, string> = {}
    sceneStr.split('&').forEach(param => {
      const [key, value] = param.split('=')
      if (key && value) {
        sceneParams[key] = value
      }
    })
    if (sceneParams['r']) referrerId = Number(sceneParams['r'])
    if (sceneParams['e']) enterpriseId = Number(sceneParams['e'])
    if (sceneParams['referrer_id']) referrerId = Number(sceneParams['referrer_id'])
    if (sceneParams['enterprise_id']) enterpriseId = Number(sceneParams['enterprise_id'])
  }

  // 写入全局状态（只在有值时写入）
  if (referrerId || enterpriseId) {
    setInviteParams(referrerId, enterpriseId)
  }
}

onLaunch(async (options: any) => {
  console.log('App Launch', JSON.stringify(options?.query || {}))
  // 1. 解析启动参数，提取邀请参数
  parseInviteParams(options)
  // 2. 尝试静默登录（自动从全局状态读取邀请参数）
  await trySilentLogin()
  // 3. 登录成功后，加载模板变体（需要 token）
  loadTemplateVariant()
  // 4. 标记登录初始化完成
  const { setLoginInitialized } = useGlobalState()
  setLoginInitialized()
})

onShow((options: any) => {
  console.log('App Show')
  // 用户可能从分享卡片重新进入，补充解析参数
  parseInviteParams(options)
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
/* 全局样式重置（仅放跨端通用的，具体组件样式在各页面 scoped 中定义） */
page {
  background-color: #f4f7fc;
  min-height: 100%;
}
</style>
