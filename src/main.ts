import { createSSRApp } from 'vue'
import App from './App.vue'
import { shareMixin } from './utils/shareMixin'

export function createApp() {
  const app = createSSRApp(App)

  // 全局注入分享 mixin：所有页面分享自动携带邀请参数（referrer_id + enterprise_id）
  // 页面级 useShare() 或 onShareAppMessage 可覆盖此默认实现
  app.mixin(shareMixin)

  return {
    app,
  }
}
