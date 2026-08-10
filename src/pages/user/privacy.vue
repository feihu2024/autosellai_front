<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">{{ policyTitle }}</text>
    </view>

    <scroll-view class="privacy-scroll" scroll-y :scroll-top="scrollTop" :lower-threshold="100" @scroll="onScroll"
      @scrolltolower="onScrollToLower">
      <view class="privacy-content">
        <text class="privacy-h2">{{ policyTitle }}</text>
        <text class="update-time" v-if="updateTime">更新日期：{{ updateTime }}</text>

        <!-- 协议内容 -->
        <view class="agreement-content" v-if="agreementContent">
          <rich-text :nodes="agreementContent" class="rich-text-content"></rich-text>
        </view>

        <!-- 占位，确保内容足够长 -->
        <view style="height: 100rpx;"></view>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view v-if="fromLogin" class="privacy-footer">
      <view class="scroll-hint" v-if="!hasScrolledToBottom">
        <text>请向下滚动阅读完整协议</text>
      </view>
      <button class="agree-btn" :class="{ disabled: !hasScrolledToBottom }" :disabled="!hasScrolledToBottom"
        @click="handleAgree">
        我已阅读并同意{{ policyTitle }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getUserAgreements } from '@/api/miniapp'

const policyTitle = ref('隐私政策')
const fromLogin = ref(false)
const hasScrolledToBottom = ref(false)
const scrollTop = ref(0)
const policyType = ref('')
const agreementContent = ref('')
const updateTime = ref('')

onLoad((options: any) => {
  if (options?.type) {
    policyType.value = options.type
    // 设置标题
    policyTitle.value = policyType.value === 'privacy_policy' ? '隐私政策' : '用户协议'
  }
  // 判断是否从登录页进入
  const pages = getCurrentPages()
  if (pages.length > 1) {
    const prevPage = pages[pages.length - 2]
    fromLogin.value = prevPage.route === 'pages/login/index'
  }

  // 加载协议内容
  loadAgreement()
})

async function loadAgreement() {
  try {
    const params: any = {}
    if (policyType.value) {
      params.type = policyType.value
    }
    const res: any = await getUserAgreements(params)
    if (res.code === 200 && res.data) {
      const data = Array.isArray(res.data) ? res.data[0] : res.data
      if (data) {
        agreementContent.value = data.content || ''
        updateTime.value = data.update_time || ''
        if (data.title) {
          policyTitle.value = data.title
        }
      }
    }
  } catch (e) {
    console.error('加载协议失败', e)
  }
}

function goBack() {
  uni.navigateBack()
}

function onScroll(e: any) {
  // 滚动监听
  const { scrollTop: st, scrollHeight, scrollWidth } = e.detail
  scrollTop.value = st

  // 手动检测是否滚动到底部
  // 获取 scroll-view 的实际高度（需要通过查询节点获取）
  uni.createSelectorQuery()
    .select('.privacy-scroll')
    .boundingClientRect((rect: any) => {
      if (rect) {
        const scrollViewHeight = rect.height
        // 如果滚动距离 + 可见高度 >= 内容高度 - 100px，认为到达底部
        if (st + scrollViewHeight >= scrollHeight - 100) {
          hasScrolledToBottom.value = true
        }
      }
    })
    .exec()
}

function onScrollToLower() {
  // 滚动到底部
  hasScrolledToBottom.value = true
}

function handleAgree() {
  if (!hasScrolledToBottom.value) {
    uni.showToast({
      title: '请先阅读完整协议',
      icon: 'none'
    })
    return
  }

  // 保存隐私政策阅读状态到本地存储
  // 固定使用 'policy_read_隐私政策' 作为键名
  const agreementReadKey = 'policy_read_隐私政策'

  console.log('存储键名:', agreementReadKey)
  uni.setStorageSync(agreementReadKey, true)

  // 验证存储是否成功
  const storedValue = uni.getStorageSync(agreementReadKey)
  console.log('存储后的值:', storedValue)

  uni.showToast({
    title: '已同意协议',
    icon: 'success'
  })

  setTimeout(() => {
    uni.navigateBack()
  }, 1000)
}
</script>

<style scoped lang="scss">
.sub-page {
  height: 100vh;
  background: #f4f7fc;
  display: flex;
  flex-direction: column;
}

.page-head {
  display: flex;
  align-items: center;
  min-height: 50px;
  gap: 8px;
  padding: 0 16px;
  padding-top: env(safe-area-inset-top);
  background: #fff;
  flex-shrink: 0;
}

.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

.back text {
  font-size: 22px;
  color: #1e293b;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.privacy-scroll {
  flex: 1;
  height: 0; // 重要：让 flex 生效
  padding: 16px;
}

.privacy-content {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(67, 109, 157, 0.05);
  border: 1px solid rgba(211, 224, 241, 0.5);
}

.privacy-h2 {
  display: block;
  font-size: 18px;
  color: #1e293b;
  text-align: center;
  margin-bottom: 8px;
}

.update-time {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 20px;
}

.privacy-h3 {
  display: block;
  font-size: 15px;
  color: #1e293b;
  margin-top: 18px;
  margin-bottom: 8px;
  font-weight: 600;
}

.privacy-p {
  display: block;
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 10px;
}

.agreement-content {
  margin-top: 20px;
}

.rich-text-content {
  font-size: 13px;
  color: #475569;
  line-height: 1.7;
}

.privacy-footer {
  padding: 16px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.scroll-hint {
  text-align: center;
  margin-bottom: 12px;
  font-size: 13px;
  color: #94a3b8;
}

.agree-btn {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border: none;
}

.agree-btn.disabled {
  background: #cbd5e1;
  color: #94a3b8;
}
</style>
