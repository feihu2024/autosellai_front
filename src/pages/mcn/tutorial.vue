<template>
  <view class="sub-page">
    <!-- 加载中 -->
    <view class="state-card" v-if="loading">
      <view class="spinner"></view>
      <text class="state-text">正在加载教程…</text>
    </view>

    <!-- 错误提示 -->
    <view class="state-card error" v-else-if="errorMsg">
      <view class="err-icon"><text>!</text></view>
      <text class="state-text">{{ errorMsg }}</text>
      <view class="retry-btn" @click="loadAll"><text>重试</text></view>
    </view>

    <!-- 渲染：video 模式 -->
    <view class="tutorial-card" v-else-if="currentBinding?.type === 'video'">
      <view class="video-wrap" v-if="currentBinding.url">
        <video
          :src="currentBinding.url"
          controls
          class="video-player"
        ></video>
      </view>
      <view class="video-empty" v-else>
        <view class="empty-icon"><text>▶</text></view>
        <text class="empty-title">暂无教程视频</text>
        <text class="empty-desc">请联系企业管理员上传对应教程</text>
      </view>

      <text class="tutorial-title">{{ title }}</text>
      <text class="tutorial-desc">
        按照视频步骤完成操作后，再返回授权页面继续授权或绑定。
      </text>

      <view class="tutorial-save" v-if="currentBinding.url" @click="onCopy">
        <text>复制视频链接</text>
      </view>
    </view>

    <!-- 渲染：article 模式（商学院图文） -->
    <view class="article-card" v-else-if="currentBinding?.type === 'article' && article">
      <!-- 文章封面/视频 -->
      <view class="article-cover" v-if="article.video_url">
        <video :src="article.video_url" controls class="article-video"></video>
      </view>
      <view class="article-cover" v-else-if="article.cover_url">
        <image :src="article.cover_url" class="article-cover-img" mode="widthFix" />
      </view>

      <text class="article-title">{{ article.title }}</text>
      <view class="article-meta">
        <text class="meta-tag">{{ article.category || '未分类' }}</text>
        <text class="meta-view">{{ article.view_count || 0 }} 浏览</text>
      </view>

      <!-- 图文模块：按 content_modules 顺序渲染 -->
      <view class="modules" v-if="modules.length">
        <template v-for="(mod, idx) in modules" :key="idx">
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
      <text class="article-empty" v-else>该文章暂无详细内容</text>

      <!-- 底部说明 -->
      <view class="tutorial-tip">
        <text>阅读以上内容后，返回授权页面继续操作即可。</text>
      </view>
    </view>

    <!-- 绑定了文章但文章加载失败 -->
    <view class="state-card error" v-else-if="currentBinding?.type === 'article'">
      <view class="err-icon"><text>!</text></view>
      <text class="state-text">教程文章加载失败或已被移除</text>
      <text class="state-sub">请联系企业管理员检查商学院文章配置</text>
    </view>

    <!-- 兜底：没有任何绑定 -->
    <view class="tutorial-card" v-else>
      <view class="video-empty">
        <view class="empty-icon"><text>▶</text></view>
        <text class="empty-title">暂未配置教程</text>
        <text class="empty-desc">请联系企业管理员配置该教程位</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getMcnTutorials, getTutorialArticle } from '@/api/miniapp'
import { copyToClipboard, showToast } from '@/utils'

interface SlotBinding {
  type: 'video' | 'article'
  url: string
  article_id: number | null
  article_title: string | null
}

const title = ref('开通教程')
const slotKey = ref('mcn')

const loading = ref(true)
const errorMsg = ref('')
const tutorials = ref<Record<string, SlotBinding>>({
  mp: { type: 'video', url: '', article_id: null, article_title: null },
  channels: { type: 'video', url: '', article_id: null, article_title: null },
  mcn: { type: 'video', url: '', article_id: null, article_title: null },
  window: { type: 'video', url: '', article_id: null, article_title: null },
})

const article = ref<any>(null)

const currentBinding = computed(() => tutorials.value[slotKey.value] || null)
const modules = computed(() => {
  if (!article.value?.content_modules) return []
  return Array.isArray(article.value.content_modules) ? article.value.content_modules : []
})

onLoad((options: any) => {
  if (options?.title) {
    title.value = decodeURIComponent(options.title)
  }
  if (options?.type) {
    slotKey.value = options.type
  }
  // 更新导航栏标题
  uni.setNavigationBarTitle({ title: title.value })
  loadAll()
})

async function loadAll() {
  loading.value = true
  errorMsg.value = ''
  article.value = null
  try {
    // 1. 拉教程绑定配置
    const res: any = await getMcnTutorials()
    const data = res.data || {}
    tutorials.value = {
      mp: normalize(data.mp),
      channels: normalize(data.channels),
      mcn: normalize(data.mcn),
      window: normalize(data.window),
    }

    const binding = currentBinding.value
    // 2. 如果是文章引用，拉文章详情
    if (binding?.type === 'article' && binding.article_id) {
      try {
        const aRes: any = await getTutorialArticle(binding.article_id)
        article.value = aRes.data || null
        // 用文章标题覆盖页头
        if (article.value?.title) {
          title.value = article.value.title
          uni.setNavigationBarTitle({ title: title.value })
        }
      } catch {
        // 文章加载失败保持空 article，模板会显示对应错误
      }
    } else if (binding?.article_title) {
      title.value = binding.article_title
      uni.setNavigationBarTitle({ title: title.value })
    }
  } catch (e: any) {
    errorMsg.value = e.message || '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

function normalize(raw: any): SlotBinding {
  if (!raw || typeof raw !== 'object') {
    return { type: 'video', url: '', article_id: null, article_title: null }
  }
  return {
    type: (raw.type === 'article' ? 'article' : 'video'),
    url: raw.url || '',
    article_id: raw.article_id ?? null,
    article_title: raw.article_title ?? null,
  }
}

function copyText(text: string) {
  if (!text) return
  copyToClipboard(text)
}

function onCopy() {
  const url = currentBinding.value?.url
  if (!url) return
  copyToClipboard(url)
  showToast('视频链接已复制')
}
</script>

<style scoped>
.sub-page { padding: 16px 16px 80px; }

.tutorial-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 14px;
  box-shadow: 0 8px 22px rgba(75,111,150,.05);
}

.video-wrap {
  border-radius: 15px; overflow: hidden;
  background: linear-gradient(135deg,#18283f,#3b6b98);
}
.video-player {
  width: 100%; height: 210px; display: block; background: #000;
}

.video-empty {
  height: 210px; border-radius: 15px;
  background: linear-gradient(135deg,#18283f,#3b6b98);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #fff; gap: 8px;
}
.empty-icon {
  width: 56px; height: 56px; border-radius: 50%;
  background: rgba(255,255,255,0.18); display: flex;
  align-items: center; justify-content: center; font-size: 26px;
}
.empty-title { font-size: 14px; font-weight: 600; }
.empty-desc { font-size: 11px; opacity: 0.7; }

.tutorial-title { margin: 14px 0 6px; font-size: 18px; color: #1e293b; }
.tutorial-desc { color: #64748b; font-size: 12px; line-height: 1.7; }

.tutorial-save {
  width: 100%; height: 44px; margin-top: 14px; border-radius: 12px;
  background: #3488ff; display: flex; align-items: center; justify-content: center;
}
.tutorial-save text { color: #fff; font-weight: 700; font-size: 14px; }

/* 文章模式样式 */
.article-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 14px;
  box-shadow: 0 8px 22px rgba(75,111,150,.05);
}
.article-cover { border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
.article-cover-img { width: 100%; display: block; }
.article-video { width: 100%; height: 210px; background: #000; display: block; }

.article-title { margin: 6px 0 8px; font-size: 19px; color: #1e293b; line-height: 1.4; }
.article-meta { display: flex; gap: 10px; margin-bottom: 14px; }
.meta-tag { background: #eef2ff; color: #6366f1; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; }
.meta-view { font-size: 12px; color: #94a3b8; }

/* 富文本模块样式 */
.modules { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }
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
  color: #3384ed;
  border-radius: 9px;
  padding: 6px 10px;
  font-size: 11px;
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

.article-empty { padding: 20px; text-align: center; color: #94a3b8; font-size: 13px; }
.tutorial-tip {
  margin-top: 16px; padding: 10px 12px;
  background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px;
  color: #0369a1; font-size: 12px; line-height: 1.6;
}
.tutorial-tip text { color: #0369a1; font-size: 12px; }

/* 加载/错误状态 */
.state-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 18px;
  padding: 32px 14px; display: flex; flex-direction: column;
  align-items: center; gap: 10px;
}
.state-card.error .state-text { color: #dc2626; }
.err-icon {
  width: 44px; height: 44px; border-radius: 50%; background: #fee2e2;
  display: flex; align-items: center; justify-content: center;
}
.err-icon text { color: #dc2626; font-weight: 800; font-size: 22px; }
.state-text { font-size: 14px; color: #64748b; }
.state-sub { font-size: 11px; color: #94a3b8; }
.spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid #e0e7ff; border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.retry-btn {
  margin-top: 6px; padding: 0 18px; height: 36px; border-radius: 10px;
  background: #3488ff; display: flex; align-items: center; justify-content: center;
}
.retry-btn text { color: #fff; font-weight: 600; font-size: 14px; }
</style>
