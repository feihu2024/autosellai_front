<template>
  <view class="detail-page">
    <!-- 顶部主区域：视频 / 封面 -->
    <view class="media-area" v-if="detail.video_url || detail.cover_url">
      <!-- 有视频：先显示封面，点击后播放 -->
      <template v-if="detail.video_url">
        <view v-if="!videoPlaying" class="video-cover" @click="videoPlaying = true">
          <image v-if="detail.video_cover_url" :src="detail.video_cover_url" class="cover-img" mode="aspectFill" />
          <image v-else-if="detail.cover_url" :src="detail.cover_url" class="cover-img" mode="aspectFill" />
          <view class="play-overlay">
            <view class="play-icon"><text>▶</text></view>
          </view>
        </view>
        <video
          v-else
          class="video-player"
          :src="detail.video_url"
          controls
          autoplay
        ></video>
      </template>

      <!-- 无视频但有封面：仅显示封面大图 -->
      <view v-else class="cover-image">
        <image :src="detail.cover_url" class="cover-img-full" mode="widthFix" />
      </view>
    </view>

    <!-- 标题 -->
    <text class="article-title">{{ detail.title }}</text>

    <!-- 元信息行（分类） -->
    <view class="meta-row" v-if="detail.category">
      <text class="meta-tag">{{ detail.category }}</text>
    </view>

    <!-- 内容模块区：按 content_modules 顺序渲染 -->
    <view class="modules" v-if="parsedModules.length">
      <template v-for="(mod, idx) in parsedModules" :key="idx">
        <!-- 富文本模块 -->
        <rich-text v-if="mod.type === 'editor'" class="module-editor" :nodes="mod.content"></rich-text>

        <!-- 可复制文本模块 -->
        <view v-else-if="mod.type === 'copytext'" class="copy-text-module">
          <view class="copy-text-head">
            <text class="copy-label" v-if="mod.label">{{ mod.label }}</text>
            <view class="copy-btn" @click="copyText(mod.content)"><text>一键复制</text></view>
          </view>
          <text class="copy-text-content">{{ mod.content }}</text>
        </view>
      </template>
    </view>

    <!-- 无模块时的空提示 -->
    <text class="empty-modules" v-if="!parsedModules.length && detail.title">暂无更多内容</text>

    <!-- 权限不足提示页 -->
    <view class="permission-denied" v-if="permissionDenied">
      <view class="lock-circle">
        <text class="lock-icon">🔒</text>
      </view>
      <text class="pd-title">内容已锁定</text>
      <text class="pd-desc">{{ permissionMsg }}</text>
      <text class="pd-hint">请升级权益等级后查看完整内容</text>
      <view class="pd-btn" @click="goBack"><text>返回列表</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getInfoDetail } from '@/api/miniapp'
import { useShare } from '@/composables/useShare'
import { navigator, copyToClipboard, showToast } from '@/utils'

const infoId = ref(0)

// 注册信息分享：分享当前信息详情 + 自动携带邀请参数
useShare(() => ({
  title: detail.value?.title || '快来看看这篇资讯',
  path: '/pages/info/detail',
  pathParams: { id: infoId.value },
  imageUrl: detail.value?.cover_url,
}))

const detail = ref<any>({
  title: '',
  cover_url: '',
  video_url: '',
  video_cover_url: '',
  content_modules: [],
  category: '',
  view_count: 0,
})

const videoPlaying = ref(false)
const permissionDenied = ref(false)
const permissionMsg = ref('')

const parsedModules = computed(() => {
  const mods = detail.value.content_modules
  if (!Array.isArray(mods)) return []
  return mods
})

function goBack() {
  navigator.back()
}

function copyText(text: string) {
  if (!text) return
  copyToClipboard(text)
}

onLoad(async (options: any) => {
  const id = Number(options?.id)
  infoId.value = id
  if (!id) return
  try {
    const res: any = await getInfoDetail(id)
    if (res.data) {
      detail.value = res.data
    }
  } catch (err: any) {
    // 权限不足时展示锁定提示页
    if (err?.message && err.message.includes('身份')) {
      permissionMsg.value = err.message
      permissionDenied.value = true
    }
  }
})
</script>

<style scoped>
.detail-page {
  padding: 18px 16px 42px;
}

/* ===== 顶部主区域 ===== */
.media-area {
  margin-bottom: 16px;
}

.video-cover {
  position: relative;
  width: 100%;
  height: 210px;
  border-radius: 20px;
  overflow: hidden;
  background: #172a48;
  box-shadow: 0 10px 30px rgba(60, 119, 196, 0.12);
}

.cover-img {
  width: 100%;
  height: 100%;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.28);
}

.play-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}
.play-icon text { color: #287be9; font-size: 26px; }

.video-player {
  width: 100%;
  height: 210px;
  border-radius: 20px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 10px 30px rgba(60, 119, 196, 0.12);
}

.cover-image {
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(60, 119, 196, 0.1);
}

.cover-img-full {
  width: 100%;
  display: block;
}

/* ===== 标题 ===== */
.article-title {
  font-size: 22px;
  line-height: 1.45;
  margin: 8px 0 10px;
  font-weight: 700;
  color: #1e293b;
}

/* ===== 元信息行 ===== */
.meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  margin-bottom: 4px;
  border-bottom: 1px solid #e8eef7;
}

.meta-tag {
  font-size: 12px;
  color: #287be9;
  background: #eaf4ff;
  border-radius: 7px;
  padding: 3px 9px;
}

/* ===== 内容模块 ===== */
.modules {
  padding-top: 6px;
}

.module-editor {
  color: #36465c;
  font-size: 15px;
  line-height: 1.8;
}

/* 可复制文本模块 */
.copy-text-module {
  margin: 14px 0;
  background: #fff;
  border: 1px solid #dfeaf7;
  border-radius: 16px;
  padding: 13px;
  box-shadow: 0 7px 20px rgba(75, 111, 150, 0.045);
}

.copy-text-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
}

.copy-label { font-size: 13px; color: #1e293b; font-weight: 600; }

.copy-btn {
  background: #edf6ff;
  border-radius: 9px;
  padding: 6px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}
.copy-btn text { color: #3384ed; font-size: 11px; }

.copy-text-content {
  padding: 11px 12px;
  border-radius: 12px;
  background: #f6faff;
  color: #4d5b6e;
  font-size: 13px;
  line-height: 1.75;
}

.empty-modules {
  text-align: center;
  color: #98a4b5;
  font-size: 13px;
  padding: 30px 0;
}

/* 权限不足提示页 */
.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
}
.lock-circle {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.lock-icon { font-size: 32px; }
.pd-title {
  font-size: 19px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}
.pd-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 4px;
}
.pd-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 22px;
}
.pd-btn {
  padding: 0 28px;
  height: 44px;
  border-radius: 13px;
  background: #6658f5;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(102, 88, 245, 0.25);
}
.pd-btn text { color: #fff; font-size: 14px; font-weight: 600; }
</style>
