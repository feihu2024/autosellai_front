<template>
  <view class="sub-page">
    <view class="page-head">
      <view class="back" @click="goBack"><text>‹</text></view>
      <text class="page-title">隐私协议</text>
    </view>

    <view class="privacy-content">
      <text class="privacy-h2">隐私政策</text>
      <text class="update-time">更新日期：2024年6月1日</text>

      <text class="privacy-h3">1. 信息收集</text>
      <text class="privacy-p">我们会收集您在使用服务过程中提供的个人信息，包括但不限于手机号码、昵称、头像等。这些信息用于为您提供更好的服务体验。</text>

      <text class="privacy-h3">2. 信息使用</text>
      <text class="privacy-p">我们收集的信息将用于：提供、维护和改进我们的服务；与您沟通，包括发送通知和更新；保护用户安全和平台安全。</text>

      <text class="privacy-h3">3. 信息保护</text>
      <text class="privacy-p">我们采取合理的技术和管理措施来保护您的个人信息安全，防止信息遭到未经授权的访问、使用或泄露。</text>

      <text class="privacy-h3">4. 信息共享</text>
      <text class="privacy-p">未经您的同意，我们不会与第三方共享您的个人信息，除非法律法规要求或为维护我们的合法权益。</text>

      <text class="privacy-h3">5. 您的权利</text>
      <text class="privacy-p">您有权访问、更正或删除您的个人信息。如需行使这些权利，请联系我们的客服团队。</text>

      <text class="privacy-h3">6. 未成年人保护</text>
      <text class="privacy-p">我们重视未成年人的个人信息保护。如果您是未成年人，请在监护人的指导下使用我们的服务。</text>

      <text class="privacy-h3">7. 协议更新</text>
      <text class="privacy-p">我们可能会不时更新本隐私政策。更新后的政策将在平台上公布，建议您定期查阅。</text>

      <text class="privacy-h3">8. 联系我们</text>
      <text class="privacy-p">如对本隐私政策有任何疑问，请通过平台内的客服联系方式与我们联系。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { navigator } from '@/utils'

function goBack() {
  navigator.back()
}
</script>

<style scoped lang="scss">
.sub-page {
  min-height: 100vh;
  background: #f4f7fc;
  padding: 0 16px 80px;
}
.page-head {
  display: flex;
  align-items: center;
  min-height: 50px;
  gap: 8px;
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
</style>
