<template>
  <view class="page">
    <!-- 装饰元素 -->
    <view class="orb top"></view>
    <view class="orb left"></view>
    <view class="orb right"></view>
    <text class="sparkle gold">✦</text>
    <text class="sparkle white">✦</text>
    <view class="dot-field">
      <text class="dot" v-for="(item, index) in 30" :key="index"></text>
    </view>

    <!-- 主要内容 -->
    <view class="content">
      <!-- 顶部图片 -->
      <view class="login-banner">
        <image class="banner-img"
          src="https://mlcfjihuaqn.yxiaozhu.com/saas/4e0fde35ece441219973e6268959c44e.png?e=1786590050&token=8HYKX7kOi_0yI5lbCm9L15PD17ROW4bDVRCIXtCA:Qx2IFQyGxHULLJo7QG1Dr66wWRU=" />
      </view>

      <!-- 标题区域 -->
      <view class="hero">
        <view class="title-row">
          <text class="title">欢迎回来</text>
          <view class="cheers">
            <text class="cheer-bar"></text>
            <text class="cheer-bar"></text>
          </view>
        </view>
        <view class="subtitle">
          遇见美好，从此刻开始 <text class="heart">♥</text>
        </view>
      </view>

      <!-- 登录卡片 -->
      <view class="card">
        <button class="login-button" @click="handleLogin">
          <view class="wechat-logo">
            <view class="bubble big">
              <text class="dot-left"></text>
              <text class="dot-right"></text>
            </view>
            <view class="bubble small">
              <text class="dot-left"></text>
              <text class="dot-right"></text>
            </view>
          </view>
          <text>{{ loginText }}</text>
        </button>

        <view class="security">
          <view class="line"></view>
          <view class="shield">
            <text>✓</text>
          </view>
          <text>安全登录，保护你的账号信息</text>
          <view class="line"></view>
        </view>
      </view>

      <!-- 协议区域 -->
      <view class="agreement">
        <view class="agreement-main">
          <view class="checkbox" :class="{ checked: agreed }" @click="toggleAgreement">
            <text v-if="agreed">✓</text>
          </view>
          <text>我已阅读并同意 <text class="link" @click="showPolicy('privacy_policy')">《隐私政策》</text> 和 <text class="link"
              @click="showPolicy('user_agreement')">《用户协议》</text></text>
        </view>
        <text class="tip">未注册的微信账号将自动创建并绑定</text>
      </view>
    </view>

    <!-- 装饰云朵 -->
    <view class="clouds">
      <view class="cloud c1"></view>
      <view class="cloud c2"></view>
      <view class="cloud c3"></view>
      <view class="cloud c4"></view>
    </view>
    <view class="wave back"></view>
    <view class="wave front"></view>

    <!-- Toast 提示 -->
    <view class="toast" :class="{ show: toastVisible }">{{ toastMessage }}</view>

    <!-- 信息收集弹窗 -->
    <view class="auth-popup-mask" v-if="showAuthPopup" @click.stop></view>
    <view class="auth-popup" v-if="showAuthPopup">
      <view class="auth-popup-content">
        <text class="auth-popup-title">获取您的昵称、头像、手机号</text>
        <text class="auth-popup-desc">获取用户头像、昵称、手机号信息，主要用于完善个人资料，向用户提供更好使用体验</text>

        <!-- 头像 -->
        <view class="auth-item">
          <text class="auth-label">头像</text>
          <button class="auth-avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
            <image v-if="userAvatar" class="auth-avatar-img" :src="userAvatar" mode="aspectFill" />
            <text v-else class="auth-placeholder">请选择头像</text>
          </button>
        </view>

        <!-- 昵称 -->
        <view class="auth-item">
          <text class="auth-label">昵称</text>
          <input class="auth-input" type="nickname" v-model="userNickname" placeholder="请输入昵称"
            @blur="onNicknameInput" />
        </view>

        <!-- 按钮 -->
        <view class="auth-buttons">
          <button class="auth-cancel-btn" @click="closeAuthPopup" :disabled="loggingIn">取消</button>
          <button v-if="!showPhoneBtn" class="auth-confirm-btn" @click="handleSave" :loading="loggingIn">
            保存
          </button>
          <button v-else class="auth-confirm-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber"
            :disabled="loggingIn">
            <text :class="{ 'btn-loading': loggingIn }">{{ loggingIn ? '保存中...' : '保存' }}</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 协议弹窗 -->
    <!-- 隐私政策弹窗 -->
    <view class="dialog-mask" v-if="privacyDialogVisible" @click.stop></view>
    <view class="privacy-dialog" v-if="privacyDialogVisible">
      <view class="privacy-dialog-header">
        <text class="privacy-dialog-title">{{ privacyDialogTitle }}</text>
      </view>
      <scroll-view class="privacy-dialog-content" scroll-y :scroll-top="scrollTop" @scroll="onScroll"
        @scrolltolower="onScrollToLower">
        <rich-text :nodes="privacyDialogContent"></rich-text>
      </scroll-view>
      <view class="privacy-dialog-footer">
        <view class="scroll-hint" v-if="!canAgree && contentIsLong">
          <text>请向下滚动阅读完整协议</text>
        </view>
        <view class="countdown-hint" v-if="!canAgree && !contentIsLong && countdown > 0">
          <text>{{ countdown }}秒后可点击</text>
        </view>
        <button class="privacy-dialog-btn" :class="{ disabled: !canAgree }" :disabled="!canAgree" @click="agreePrivacy">
          我已阅读并同意
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { uploadFile, updateMiniappProfile, getUserAgreements } from '@/api/miniapp'
import { bindPhoneWithWx } from '@/utils/auth'

export default {
  data() {
    return {
      userAvatar: '',
      userNickname: '',
      agreed: false,
      showPop: false,
      privacyDialogVisible: false,
      privacyDialogTitle: '隐私政策',
      privacyDialogContent: '',
      canAgree: false,
      contentIsLong: false,
      countdown: 5,
      scrollTop: 0,
      countdownTimer: null,
      hasScrolledToBottom: false,
      uploadedAvatarUrl: '',
      avatarActive: false,
      agreed: false,
      loggingIn: false,
      loggedIn: false,
      loginText: '微信授权登录',
      toastVisible: false,
      toastMessage: '',
      toastTimer: null,
      dialogVisible: false,
      dialogTitle: '',
      dialogContent: '',
      showAuthPopup: false,
      showPhoneBtn: false
    }
  },
  methods: {
    showToast(message) {
      if (this.toastTimer) {
        clearTimeout(this.toastTimer)
      }
      this.toastMessage = message
      this.toastVisible = true
      this.toastTimer = setTimeout(() => {
        this.toastVisible = false
      }, 1700)
    },

    handleLogin() {
      // 验证是否勾选协议
      if (!this.agreed) {
        this.showToast('请先勾选同意协议')
        return
      }

      // 显示隐私政策弹窗
      this.showPrivacyDialog()
    },

    async showPrivacyDialog() {
      try {
        // 调用接口获取隐私政策内容
        const res = await getUserAgreements('privacy_policy')
        if (res.code === 200 && res.data) {
          this.privacyDialogTitle = res.data.title || '隐私政策'
          this.privacyDialogContent = res.data.privacy_policy || ''

          // 判断内容是否很长（简单判断：字符数大于500）
          this.contentIsLong = this.privacyDialogContent.length > 500

          // 显示弹窗
          this.privacyDialogVisible = true
          this.canAgree = false
          this.hasScrolledToBottom = false

          // 如果内容不长，开始倒计时
          if (!this.contentIsLong) {
            this.startCountdown()
          }
        } else {
          this.showToast('获取隐私政策失败')
        }
      } catch (e) {
        console.error('获取隐私政策失败', e)
        this.showToast('获取隐私政策失败')
      }
    },

    startCountdown() {
      this.countdown = 5
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
      }
      this.countdownTimer = setInterval(() => {
        this.countdown--
        if (this.countdown <= 0) {
          this.canAgree = true
          clearInterval(this.countdownTimer)
        }
      }, 1000)
    },

    onScroll(e) {
      const { scrollTop: st, scrollHeight } = e.detail
      this.scrollTop = st

      // 获取 scroll-view 的实际高度
      uni.createSelectorQuery()
        .select('.privacy-dialog-content')
        .boundingClientRect((rect) => {
          if (rect) {
            const scrollViewHeight = rect.height
            // 如果滚动距离 + 可见高度 >= 内容高度 - 100px，认为到达底部
            if (st + scrollViewHeight >= scrollHeight - 100) {
              this.hasScrolledToBottom = true
              this.canAgree = true
            }
          }
        })
        .exec()
    },

    onScrollToLower() {
      // 滚动到底部
      this.hasScrolledToBottom = true
      this.canAgree = true
    },

    agreePrivacy() {
      if (!this.canAgree) {
        return
      }

      // 清除倒计时定时器
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
      }

      // 保存隐私政策阅读状态
      uni.setStorageSync('policy_read_隐私政策', true)

      // 关闭隐私政策弹窗
      this.privacyDialogVisible = false

      // 显示信息收集弹窗
      this.showAuthPopup = true
    },

    closeAuthPopup() {
      this.showAuthPopup = false
    },

    async onChooseAvatar(e) {
      const { avatarUrl } = e.detail
      this.userAvatar = avatarUrl

      try {
        // 上传头像
        const result = await uploadFile(avatarUrl)
        this.uploadedAvatarUrl = result.url
        this.showToast('头像已上传')

        // 检查是否显示手机号按钮
        this.checkShowPhoneBtn()
      } catch (error) {
        console.error('上传头像失败：', error)
        this.showToast('头像上传失败')
      }
    },

    onNicknameInput(e) {
      this.userNickname = e.detail.value
      // 检查是否显示手机号按钮
      this.checkShowPhoneBtn()
    },

    checkShowPhoneBtn() {
      // 如果头像和昵称都有，显示手机号按钮
      this.showPhoneBtn = !!(this.uploadedAvatarUrl && this.userNickname)
    },

    async handleSave() {
      if (!this.userAvatar) {
        this.showToast('请选择头像')
        return
      }

      if (!this.userNickname) {
        this.showToast('请输入昵称')
        return
      }

      this.showToast('请点击保存按钮获取手机号')
    },

    async updateUserProfile() {
      try {
        const result = await updateMiniappProfile({
          nickname: this.userNickname,
          avatar: this.uploadedAvatarUrl
        })
        if (result.code === 200) {
          this.showToast('用户信息已更新')
        }
      } catch (error) {
        console.error('更新用户信息失败：', error)
        this.showToast('更新失败，请重试')
      }
    },

    toggleAgreement() {
      this.agreed = !this.agreed
    },

    async onGetPhoneNumber(e) {
      // 验证是否已设置昵称
      if (!this.userNickname || !this.userNickname.trim()) {
        this.showToast('请先设置昵称')
        return
      }

      // 验证是否已上传头像
      if (!this.uploadedAvatarUrl) {
        this.showToast('请先上传头像')
        return
      }

      // 检查用户是否取消授权
      if (e.detail.errMsg !== 'getPhoneNumber:ok') {
        this.showToast('已取消授权')
        return
      }

      const { code } = e.detail
      if (!code) {
        this.showToast('获取手机号失败')
        return
      }

      this.loggingIn = true
      this.loginText = '正在绑定手机号...'

      try {
        // 先更新用户信息
        await this.updateUserProfile()

        // 调用绑定手机号接口
        const result = await bindPhoneWithWx(code)
        if (result.code === 200) {
          this.loginText = '绑定成功'
          this.loggedIn = true
          this.showAuthPopup = false
          this.showToast('登录成功')

          // 跳转到首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/home/index'
            })
          }, 1000)
        } else {
          this.loginText = '微信授权登录'
          this.showToast(result.message || '绑定失败')
        }
      } catch (error) {
        console.error('绑定手机号失败：', error)
        this.loginText = '微信授权登录'
        this.showToast('绑定失败，请重试')
      } finally {
        this.loggingIn = false
      }
    },

    showPolicy(title) {
      uni.navigateTo({
        url: `/pages/user/privacy?type=${encodeURIComponent(title)}`
      })
    },

    closeDialog() {
      this.dialogVisible = false
    }
  }
}
</script>

<style scoped>
.page {
  position: relative;
  min-height: 100vh;
  background: radial-gradient(circle at 48% 32%, rgba(255, 255, 255, .96) 0, rgba(255, 252, 239, .84) 21%, rgba(255, 240, 198, .47) 47%, transparent 68%),
    linear-gradient(155deg, #fff2c9 0%, #fff9ed 46%, #ffdf88 100%);
  overflow: hidden;
}

/* 装饰球体 */
.orb {
  position: absolute;
  border: 2rpx solid rgba(255, 255, 255, .52);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.orb.top {
  width: 680rpx;
  height: 680rpx;
  top: -220rpx;
  right: -290rpx;
  background: rgba(255, 210, 74, .18);
}

.orb.left {
  width: 880rpx;
  height: 880rpx;
  top: 480rpx;
  left: -700rpx;
  background: rgba(255, 255, 255, .22);
}

.orb.right {
  width: 680rpx;
  height: 680rpx;
  right: -520rpx;
  bottom: 260rpx;
  background: rgba(255, 255, 255, .2);
}

/* 闪烁装饰 */
.sparkle {
  position: absolute;
  line-height: 1;
  user-select: none;
  z-index: 1;
}

.sparkle.gold {
  top: 152rpx;
  left: 94rpx;
  color: #ffbd28;
  font-size: 56rpx;
}

.sparkle.white {
  top: 452rpx;
  right: 130rpx;
  color: rgba(255, 255, 255, .96);
  font-size: 58rpx;
}

/* 点阵装饰 */
.dot-field {
  position: absolute;
  top: 540rpx;
  right: -10rpx;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 50rpx;
  opacity: .25;
  z-index: 0;
}

.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #ffd274;
  margin: 8rpx;
}

/* 主内容区 */
.content {
  position: relative;
  z-index: 2;
  padding: 152rpx 52rpx 30rpx;
}

/* 顶部图片 */
.login-banner {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 32rpx;
  margin-left: -52rpx;
  margin-right: -52rpx;
  width: calc(100% + 104rpx);
}

.banner-img {
  width: 500rpx;
  height: 300rpx;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 32rpx rgba(255, 177, 30, 0.2);
}

/* 头像区域 */
.avatar-wrap {
  position: relative;
  width: 328rpx;
  height: 328rpx;
  margin: 0 auto;
  padding: 0;
  border: none;
  background: transparent;
  line-height: 1;
}

.avatar-wrap::after {
  border: none;
}

.avatar-glow {
  position: absolute;
  top: 40rpx;
  left: 36rpx;
  right: 36rpx;
  bottom: 0;
  border-radius: 96rpx;
  background: rgba(255, 177, 30, .27);
  filter: blur(20px);
  transform: translateY(32rpx);
  transition: .25s ease;
}

.avatar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 8rpx solid rgba(255, 255, 255, .97);
  border-radius: 94rpx;
  background: linear-gradient(145deg, rgba(255, 255, 255, .86), rgba(255, 248, 232, .7));
  box-shadow: 0 32rpx 62rpx rgba(213, 151, 36, .18);
  transition: .25s ease;
}

.avatar-wrap.active .avatar {
  transform: translateY(-8rpx) scale(1.025);
  box-shadow: 0 38rpx 76rpx rgba(226, 147, 19, .26);
}

.avatar-wrap.active .avatar-glow {
  transform: translateY(42rpx) scale(1.12);
}

.avatar-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 32rpx;
  border: 2rpx dashed rgba(255, 177, 30, .5);
  border-radius: 24rpx;
  color: #b8860b;
  font-size: 28rpx;
  font-weight: 600;
  background: rgba(255, 248, 232, .5);
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-wrap:not(.active) .avatar-mark {
  display: block;
}

/* 昵称输入区域 */
.nickname-wrap {
  margin-top: 32rpx;
  text-align: center;
}

.nickname-input {
  display: inline-block;
  width: 300rpx;
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 24rpx;
  border: 2rpx solid rgba(255, 177, 30, .3);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, .7);
  color: #4d2704;
  font-size: 28rpx;
  text-align: center;
}

.nickname-input::placeholder {
  color: #c6ad91;
}

/* 标题区域 */
.hero {
  margin-top: 32rpx;
  text-align: center;
}

.title-row {
  position: relative;
  display: inline-block;
}

.title {
  color: #4d2704;
  font-size: 86rpx;
  line-height: 1.12;
  font-weight: 850;
  letter-spacing: 2rpx;
}

.cheers {
  position: absolute;
  top: -18rpx;
  right: -62rpx;
  width: 54rpx;
  height: 50rpx;
}

.cheer-bar {
  position: absolute;
  width: 16rpx;
  height: 38rpx;
  border-radius: 18rpx;
  background: #ffb516;
}

.cheer-bar:first-child {
  left: 4rpx;
  transform: rotate(37deg);
}

.cheer-bar:last-child {
  right: 2rpx;
  bottom: 2rpx;
  height: 34rpx;
  transform: rotate(80deg);
}

.subtitle {
  margin-top: 26rpx;
  color: #8d7964;
  font-size: 34rpx;
  letter-spacing: 2rpx;
}

.heart {
  margin-left: 16rpx;
  color: #ffad2f;
  font-size: 46rpx;
}

/* 登录卡片 */
.card {
  margin-top: 86rpx;
  padding: 88rpx 62rpx 90rpx;
  border: 6rpx solid rgba(255, 255, 255, .97);
  border-radius: 94rpx;
  background: rgba(255, 255, 255, .82);
  box-shadow: 0 36rpx 72rpx rgba(214, 158, 57, .15);
}

.login-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 172rpx;
  border: 6rpx solid #fff;
  border-radius: 999rpx;
  color: #fff;
  font-size: 50rpx;
  font-weight: 800;
  background: linear-gradient(115deg, #ffd052 0%, #ffb423 48%, #ff9810 100%);
  box-shadow: 0 22rpx 40rpx rgba(255, 164, 19, .28);
}

.login-button[disabled] {
  opacity: .78;
}

/* 微信logo */
.wechat-logo {
  position: relative;
  width: 122rpx;
  height: 80rpx;
  margin-right: 20rpx;
}

.bubble {
  position: absolute;
  border: 4rpx solid white;
  border-radius: 50%;
}

.bubble.big {
  left: 0;
  top: 0;
  width: 72rpx;
  height: 64rpx;
}

.bubble.small {
  right: 0;
  bottom: 0;
  width: 66rpx;
  height: 58rpx;
  background: #ffab1f;
}

.bubble .dot-left,
.bubble .dot-right {
  position: absolute;
  top: 20rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: white;
}

.bubble .dot-left {
  left: 16rpx;
}

.bubble .dot-right {
  right: 16rpx;
}

.bubble.small .dot-left,
.bubble.small .dot-right {
  top: 16rpx;
}

.bubble.small .dot-left {
  left: 14rpx;
}

.bubble.small .dot-right {
  right: 14rpx;
}

/* 安全提示 */
.security {
  display: flex;
  align-items: center;
  margin-top: 78rpx;
  color: #c6ad91;
  font-size: 28rpx;
  white-space: nowrap;
}

.line {
  flex: 1;
  height: 2rpx;
  margin: 0 24rpx;
  background: linear-gradient(90deg, transparent, rgba(224, 195, 154, .65));
}

.line:last-child {
  background: linear-gradient(90deg, rgba(224, 195, 154, .65), transparent);
}

.shield {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  margin-right: 18rpx;
  border-radius: 12rpx 12rpx 18rpx 18rpx;
  color: white;
  font-weight: 800;
  font-size: 24rpx;
  background: #f6d38e;
  transform: rotate(45deg);
}

.shield text {
  transform: rotate(-45deg);
}

/* 协议区域 */
.agreement {
  position: relative;
  z-index: 5;
  margin-top: 70rpx;
  text-align: center;
}

.agreement-main {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #71624e;
  font-size: 26rpx;
  line-height: 42rpx;
  white-space: nowrap;
}

.checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  margin-right: 18rpx;
  border: 4rpx solid #bda987;
  border-radius: 14rpx;
  color: white;
  font-size: 28rpx;
  font-weight: 800;
  transition: .16s ease;
}

.checkbox.checked {
  border-color: #ffad1f;
  background: linear-gradient(145deg, #ffc43d, #ff9510);
  box-shadow: 0 8rpx 16rpx rgba(255, 158, 16, .25);
}

.link {
  color: #ff8500;
}

.tip {
  display: block;
  margin-top: 26rpx;
  color: #a29079;
  font-size: 26rpx;
}

/* 云朵装饰 */
.clouds {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 62rpx;
  height: 160rpx;
  pointer-events: none;
  z-index: 0;
}

.cloud {
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  background: #fffaf0;
}

.cloud.c1 {
  left: -64rpx;
  width: 200rpx;
  height: 156rpx;
}

.cloud.c2 {
  left: 74rpx;
  width: 138rpx;
  height: 106rpx;
}

.cloud.c3 {
  right: 70rpx;
  width: 168rpx;
  height: 114rpx;
}

.cloud.c4 {
  right: -70rpx;
  width: 204rpx;
  height: 152rpx;
}

/* 波浪装饰 */
.wave {
  position: absolute;
  left: -10%;
  width: 120%;
  height: 320rpx;
  border-radius: 50% 50% 0 0;
  transform: rotate(-3deg);
  pointer-events: none;
  z-index: -1;
}

.wave.back {
  bottom: -210rpx;
  background: linear-gradient(120deg, #ffdc75, #ffb72d);
}

.wave.front {
  bottom: -262rpx;
  background: linear-gradient(120deg, #ffc93f, #ff9b0c);
  box-shadow: inset 0 4rpx rgba(255, 255, 255, .3);
}

/* Toast 提示 */
.toast {
  position: fixed;
  left: 50%;
  bottom: 90rpx;
  max-width: calc(100% - 96rpx);
  padding: 20rpx 34rpx;
  border-radius: 18rpx;
  color: white;
  font-size: 28rpx;
  background: rgba(39, 30, 20, .82);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 24rpx);
  transition: .2s ease;
  z-index: 20;
}

.toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* 弹窗 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(67, 45, 17, .28);
  z-index: 99;
}

.dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: calc(100% - 88rpx);
  max-width: 660rpx;
  border-radius: 38rpx;
  background: white;
  box-shadow: 0 40rpx 140rpx rgba(61, 39, 9, .25);
  z-index: 100;
}

.dialog-body {
  padding: 52rpx 48rpx 36rpx;
  text-align: center;
}

.dialog-title {
  display: block;
  color: #4d2704;
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 24rpx;
}

.dialog-content {
  display: block;
  color: #59432f;
  font-size: 28rpx;
  line-height: 1.65;
}

.dialog-btn {
  width: 100%;
  margin-top: 42rpx;
  padding: 22rpx;
  border: none;
  border-radius: 24rpx;
  color: white;
  font-weight: 700;
  font-size: 32rpx;
  background: linear-gradient(100deg, #ffc03d, #ff9510);
}

/* 信息收集弹窗 */
.auth-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, .5);
  z-index: 99;
}

.auth-popup {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 100;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

.auth-popup-content {
  padding: 40rpx 32rpx;
}

.auth-popup-title {
  display: block;
  font-size: 32rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 16rpx;
}

.auth-popup-desc {
  display: block;
  font-size: 24rpx;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.auth-item {
  display: flex;
  align-items: center;
  min-height: 100rpx;
  padding: 16rpx 0;
  border-bottom: 1px solid #f1f5f9;
}

.auth-label {
  width: 120rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #1e293b;
}

.auth-avatar-btn {
  flex: 1;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
}

.auth-avatar-btn::after {
  border: none;
}

.auth-avatar-img {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
}

.auth-placeholder {
  font-size: 28rpx;
  color: #94a3b8;
}

.auth-input {
  flex: 1;
  height: 60rpx;
  font-size: 28rpx;
  color: #1e293b;
}

.auth-buttons {
  display: flex;
  gap: 24rpx;
  margin-top: 32rpx;
}

.auth-cancel-btn,
.auth-confirm-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  padding: 0;
}

.auth-cancel-btn {
  background: #f1f5f9;
  color: #64748b;
}

.auth-confirm-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.auth-confirm-btn[disabled] {
  opacity: 0.6;
}

.btn-loading {
  opacity: 0.7;
}

/* 隐私政策弹窗 */
.privacy-dialog {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70vh;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}

.privacy-dialog-header {
  padding: 32rpx 32rpx 16rpx;
  border-bottom: 1rpx solid #e5e7eb;
  flex-shrink: 0;
}

.privacy-dialog-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1e293b;
}

.privacy-dialog-content {
  flex: 1;
  padding: 32rpx;
  overflow-y: auto;
}

.privacy-dialog-content rich-text {
  font-size: 28rpx;
  color: #475569;
  line-height: 1.8;
}

.privacy-dialog-footer {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #e5e7eb;
  flex-shrink: 0;
}

.scroll-hint,
.countdown-hint {
  text-align: center;
  margin-bottom: 16rpx;
  font-size: 26rpx;
  color: #94a3b8;
}

.privacy-dialog-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}

.privacy-dialog-btn.disabled {
  background: #cbd5e1;
  color: #94a3b8;
}
</style>