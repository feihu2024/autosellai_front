<route lang="json5" type="page">
{
  layout: 'default',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '我的智能体',
  },
}
</route>

<template>
  <view class="min-h-screen bg-white flex flex-col">
    <!-- 顶部栏（保持不变） -->
    <view
      class="flex justify-between items-center px-4 pt-12 pb-4 fixed top-0 w-full bg-white/90 backdrop-blur-md z-30">
      <view @click="goBack" class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
        <wd-icon name="thin-arrow-left" size="20px"></wd-icon>
      </view>
      <view class="flex gap-2">
        <view class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
          <wd-icon name="star" size="20px"></wd-icon>
        </view>
        <view class="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
          <wd-icon name="more" size="20px"></wd-icon>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="overflow-y-auto" style="height: calc(100vh - 140px);" :scroll-top="scrollTopValue"
      :scroll-with-animation="false">
      <view class="px-4 pt-28 pb-36" id="chat-container">
        <!-- 智能体信息、效果预览等内容保持不变 -->
        <view class="flex gap-5 items-start mb-10">
          <image :src="agent.cover"
            class="w-24 h-24 rounded-[2.2rem] shadow-xl shadow-indigo-100 object-cover border-4 border-white"
            mode="aspectFill" />
          <view class="flex-1">
            <h2 class="text-2xl font-bold text-slate-800">{{ agent.at_name }}</h2>
            <p class="text-[11px] text-slate-400 mt-2 leading-relaxed">{{ agent.describe }}</p>
            <view class="flex gap-2 mt-3 flex-wrap">
              <text v-for="tag in (agent.auto_tag || '').split(',')" :key="tag"
                class="text-[10px] px-3 py-1 bg-indigo-50 text-indigo-400 rounded-full font-bold">{{ tag }}</text>
            </view>
          </view>
        </view>

        <!-- 效果预览区域保持不变 -->
        <view class="mb-10">
          <view class="flex items-center gap-1 mb-4">
            <text class="font-bold text-slate-800">效果预览</text>
            <text class="text-indigo-400">✦</text>
          </view>
          <swiper class="video-swiper" style="height: 128px;" :display-multiple-items="2.1" :previous-margin="'24rpx'"
            :next-margin="'24rpx'" :circular="false" :autoplay="false" :duration="300" easing-function="easeOutCubic">
            <swiper-item v-for="(video, idx) in getVideoList()" :key="idx">
              <view style="height: 128px; padding: 0 16rpx; box-sizing: border-box;">
                <view class="relative"
                  style="width: 100%; height: 100%; border-radius: 32rpx; overflow: hidden; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);"
                  @click="playVideo(video)">
                  <image :src="video.thumb" mode="aspectFill" style="width: 100%; height: 100%;" />
                  <view class="absolute inset-0 flex items-center justify-center">
                    <view class="flex items-center justify-center"
                      style="width: 72rpx; height: 72rpx; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: 50%; border: 1px solid rgba(255,255,255,0.3);">
                      <wd-icon name="play-circle" size="32rpx" color="white"></wd-icon>
                    </view>
                  </view>
                </view>
              </view>
            </swiper-item>
          </swiper>
        </view>

        <!-- 对话区域 -->
        <view class="space-y-8">
          <view class="flex items-center gap-1">
            <text class="font-bold text-slate-800">对话</text>
            <text class="text-indigo-400">✦</text>
          </view>

          <template v-for="(chat, idx) in chatList" :key="idx">
            <!-- 用户消息 -->
            <view v-if="chat.role === 'user'" :id="'msg-' + idx" class="flex justify-end items-start">
              <view class="flex flex-col items-end gap-2">
                <view
                  class="bg-#818cf8 text-white px-5 py-3 text-sm max-w-70vw rounded-20px rounded-tr-4px shadow-lg shadow-indigo-100">
                  <text selectable>{{ chat.content }}</text>
                </view>
                <view @click.stop="copyText(chat.content)"
                  class="flex items-center gap-1 px-3 py-1.5 bg-white/80 rounded-full border border-slate-100 text-[11px] text-slate-400 active:bg-slate-50">
                  <wd-icon name="copy" size="12px"></wd-icon>
                  复制
                </view>
              </view>
            </view>

            <!-- 助手消息 -->
            <view v-else :id="'msg-' + idx" class="flex justify-start gap-3 items-start">
              <view
                class="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-100 flex-shrink-0">
                <wd-icon name="robot" size="24px"></wd-icon>
              </view>
              <view class="flex-1 max-w-70vw">
                <view
                  class="bg-slate-50 border border-slate-100 px-5 py-3 text-sm text-slate-600 mb-3 rounded-20px rounded-tl-4px">
                  {{ agent.at_name }}：
                </view>
                <view class="bg-indigo-50/40 border border-indigo-100 rounded-[2rem] p-5">
                  <view v-for="(line, lineIdx) in chat.content.split('\n')" :key="lineIdx" class="mb-2">
                    <text class="text-sm text-black leading-relaxed font-medium" selectable selection-start="-1"
                      selection-end="-1">{{ line }}</text>
                  </view>

                  <view class="flex justify-between items-center mt-5 pt-4 border-t border-indigo-100/50">
                    <view @click="copyText(chat.content)"
                      class="flex items-center gap-1.5 text-[11px] text-indigo-500 font-bold">
                      <wd-icon name="copy" size="14px"></wd-icon>
                      复制提示词
                    </view>

                    <view class="flex gap-4">
                      <view class="text-slate-300">
                        <wd-icon name="thumbs-up" size="16px"></wd-icon>
                      </view>
                      <view class="text-slate-300">
                        <wd-icon name="thumbs-down" size="16px"></wd-icon>
                      </view>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <!-- 加载状态 -->
          <view v-if="loading" class="flex justify-start gap-3 items-start">
            <view
              class="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-100 flex-shrink-0">
              <wd-icon name="robot" size="24px"></wd-icon>
            </view>
            <view class="flex-1 max-w-70vw">
              <view
                class="bg-slate-50 border border-slate-100 px-5 py-3 text-sm text-slate-600 rounded-20px rounded-tl-4px">
                正在思考中...
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入栏保持不变 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md px-4 py-5 z-40 border-t border-slate-50">
      <view class="relative flex items-end gap-2 bg-slate-50 rounded-2xl p-1.5 pl-4 pr-1">
        <!-- <textarea :style="dynamicHeightStyle" ref="textareaRef" v-model="inputText" @linechange="onLineChange" /> -->
        <!-- 外层滚动容器 -->
        <scroll-view scroll-y :style="{ maxHeight: maxHeight + 'px' }" class="w-full" :show-scrollbar="false"
          :enhanced="true">
          <!-- 内层 textarea：auto-height，不设高度限制 -->
          <textarea v-model="inputText" placeholder="输入你的创意想法..." placeholder-class="text-xs" auto-height
            :maxlength="-1" adjust-position
            class="w-full bg-transparent text-sm focus:outline-none leading-relaxed py-1.5"
            @linechange="onLineChange" />
        </scroll-view>
        <view @click="sendMessage"
          class="w-9 h-9 bg-#818cf8 rounded-full flex items-center justify-center text-white flex-shrink-0 mb-0.5">
          <wd-icon name="arrow-right" size="18px" color="#fff"></wd-icon>
        </view>
      </view>
    </view>

    <!-- 算力不足弹窗 -->
    <!-- 遮罩 -->
    <view v-if="showCoinModal" class="fixed inset-0 bg-black/50 z-999" @click="showCoinModal = false"></view>

    <!-- 弹窗 -->
    <view v-if="showCoinModal" class="fixed bottom-0 left-0 w-full bg-white rounded-t-16px z-1000 pb-safe shadow-lg">
      <!-- 提示栏 -->
      <view class="bg-#FFF5F5 text-#FA5151 text-13px px-20px py-10px flex items-center gap-6px rounded-t-16px">
        <wd-icon name="warning" size="14px" color="#FA5151"></wd-icon>
        <text>当前算力余额不足</text>
      </view>

      <!-- 商品头部 -->
      <view class="flex px-20px py-20px pb-15px items-center">
        <view class="w-64px h-64px rounded-8px bg-#f9f9f9 flex items-center justify-center">
          <wd-icon name="gift" size="32px" color="#FF9500"></wd-icon>
        </view>
        <view class="ml-12px flex-1">
          <view class="text-16px font-semibold text-#191919">{{ currentTier.name }}充值卡</view>
          <view class="mt-4px text-#FA5151">
            <text class="text-14px font-bold">¥</text>
            <text class="text-24px font-bold">{{ currentTier.price }}</text>
          </view>
        </view>
      </view>

      <!-- 档位切换 -->
      <view class="px-20px pb-15px">
        <view class="text-12px text-#888 mb-10px">选择充值档位</view>
        <view class="grid grid-cols-3 gap-10px">
          <view v-for="(tier, index) in tiers" :key="index" :class="[
            'border rounded-6px py-10px text-center text-14px bg-#F9F9F9 transition-all',
            activeTierIndex === index ? 'bg-#F1FBF5 border-#07C160 text-#07C160 font-medium' : 'border-#EAEAEA text-#191919'
          ]" @click="activeTierIndex = index">
            {{ tier.name }}
          </view>
        </view>
      </view>

      <!-- 权益清单 -->
      <view class="mx-20px py-15px border-t border-#F0F0F0 flex flex-col gap-12px">
        <view class="flex justify-between text-13px">
          <view class="text-#191919 flex items-center">
            <view class="w-3px h-3px bg-#ccc rounded-full mr-8px"></view>
            <text>达人权限</text>
          </view>
          <text class="text-#888">永久解锁</text>
        </view>
        <view class="flex justify-between text-13px">
          <view class="text-#191919 flex items-center">
            <view class="w-3px h-3px bg-#ccc rounded-full mr-8px"></view>
            <text>智能体使用权</text>
          </view>
          <text class="text-#888">全量开放</text>
        </view>
        <view class="flex justify-between text-13px">
          <view class="text-#191919 flex items-center">
            <view class="w-3px h-3px bg-#ccc rounded-full mr-8px"></view>
            <text>本次充值算力</text>
          </view>
          <text class="text-#888">{{ currentTier.coin }}点 (约{{ currentTier.coin * 10 }}条视频)</text>
        </view>
        <view class="flex justify-between text-13px">
          <view class="text-#191919 flex items-center">
            <view class="w-3px h-3px bg-#ccc rounded-full mr-8px"></view>
            <text>后续智能体算力消耗</text>
          </view>
          <text class="text-#FF9500 font-bold">享 {{ activeTierIndex === 0 ? '9' : '8' }}折 优惠</text>
        </view>
      </view>

      <!-- 操作区 -->
      <view class="px-20px py-10px">
        <view @click="handlePay"
          class="w-full h-48px bg-#07C160 text-white rounded-8px text-16px font-semibold flex items-center justify-center active:opacity-80">
          立即支付 ¥{{ currentTier.price }}
        </view>
        <view class="text-center text-#ccc text-11px mt-10px">🛡️ 微信安全支付</view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, nextTick, computed } from 'vue'
import { onLoad, onReady } from '@dcloudio/uni-app'
import { getUserInfoWebUserGetUserInfoGet } from '@/service/app'
import { recharegeProListWebHomeGoodRecharegeListGet } from '@/service/app/home'
import { createOrderWebOrderCreatePost, createRecharegeOrderWebOrderCreateRecharegeOrderPost, getAddressWebOrderAddressGetGet } from '@/service/app/order'
import { useUserStore } from '@/store/user'
const useStore: any = useUserStore()

const agent = ref<any>({
  at_name: '电影大师',
  describe: '生成具有电影质感的提示词，光影氛围拉满',
  auto_tag: '电影感,光影',
  cover: 'https://picsum.photos/400/400?random=10',
  preview_video: '',
  preview_cover: '',
  id: 1
})
const inputText = ref('')
const sessionId = ref(null)
const chatList = ref<{ role: 'user' | 'assistant', content: string }[]>([])
const loading = ref(false)
const scrollTopValue = ref(0)
const maxHeight = 120 // 最大高度（px），可调整
const agentTemplate = ref<any>({})

// 算力不足弹窗
const showCoinModal = ref(false)
const activeTierIndex = ref(0)
const rechargeProList = ref<any[]>([])

// 从zdyspec中解析售价
const parsePriceFromZdyspec = (zdyspec: string) => {
  try {
    const [t1, t2, t3, t4] = zdyspec.split('@@')
    const list = JSON.parse(t4)
    if (list.length > 0 && list[0]['售价']) {
      return list[0]['售价']
    }
  } catch (e) {
    console.error('解析售价失败', e)
  }
  return null
}

const parseRechargeCoinFromZdyspec = (zdyspec: string) => {
  try {
    const [t1, t2, t3, t4] = zdyspec.split('@@')
    const list = JSON.parse(t4)
    if (list.length > 0 && list[0]['购券']) {
      return list[0]['购券']
    }
  } catch (e) {
    console.error('解析购券失败', e)
  }
  return null
}

// 动态计算tiers
const tiers = computed(() => {
  const productIdMap = {
    0: 1305, // 达人
    1: 1306, // 店长
    2: 1307  // 代理
  }

  const defaultTiers = [
    { name: '达人', price: '5.00', coin: 5 },
    { name: '店长', price: '19.90', coin: 20 },
    { name: '代理', price: '99.00', coin: 100 }
  ]

  if (rechargeProList.value.length === 0) {
    return defaultTiers
  }

  return [0, 1, 2].map(index => {
    const productId = productIdMap[index]
    const product = rechargeProList.value.find(item => item.id === productId)

    if (product && product.zdyspec) {
      const price = parsePriceFromZdyspec(product.zdyspec)
      const coin = parseRechargeCoinFromZdyspec(product.zdyspec)
      return {
        name: defaultTiers[index].name,
        price: price || defaultTiers[index].price,
        coin: coin || defaultTiers[index].coin
      }
    }

    return defaultTiers[index]
  })
})

const currentTier = computed(() => tiers.value[activeTierIndex.value])

const scrollToBottom = () => {
  nextTick(() => {
    uni.createSelectorQuery()
      .select('#chat-container')
      .boundingClientRect((rect: any) => {
        if (rect) {
          scrollTopValue.value = rect.height + 1000
        }
      })
      .exec()
  })
}

// 获取视频列表（保持不变）
const getVideoList = () => {
  if (!agent.value.preview_video) return []
  return agent.value.preview_video.split(',').map((item: string) => {
    const parts = item.split('|')
    return {
      url: parts[0] || '',
      thumb: parts[1] || '',
      title: agent.value.at_name || ''
    }
  })
}

// 流式对话逻辑（保持不变，增加滚动回调）
let accumulatedContent = ''
let tempSessionId = ''

const streamChat = (params: {
  body_id: number | string
  session_id: string
  prompt: string
  onChunk?: (text: string) => void
}): Promise<{ content: string; session_id: string }> => {
  return new Promise((resolve, reject) => {
    accumulatedContent = ''
    let url = ''
    if (sessionId.value) {
      url = `https://yxiaozhu.com/bailian/stream?session_id=${sessionId.value}&body_id=${params.body_id}&prompt='${params.prompt}'`
    } else {
      url = `https://yxiaozhu.com/bailian/stream?session_id=&body_id=${params.body_id}&prompt='${params.prompt}'`
    }
    const requestTask: any = uni.request({
      url,
      method: 'POST',
      // header: {
      //   'content-type': 'application/x-www-form-urlencoded' // 根据你的 API 要求设置内容类型，对于 JSON 数据通常是 application/json
      // },
      // data: {
      //   body_id: params.body_id,
      //   prompt: params.prompt
      // },
      responseType: 'arraybuffer',
      enableChunked: true,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve({
            content: accumulatedContent,
            session_id: tempSessionId
          })
        } else {
          reject(new Error('请求失败'))
        }
      },
      fail: (err) => {
        console.error('流式请求失败', err)
        reject(err)
      }
    })

    requestTask.onChunkReceived((res) => {
      let text = ''
      if (typeof res.data === 'string') {
        text = res.data
      } else if (res.data instanceof ArrayBuffer) {
        text = decodeUtf8(res.data)
      } else if (Array.isArray(res.data)) {
        text = String.fromCharCode.apply(null, res.data)
      } else {
        text = JSON.stringify(res.data)
      }

      const jsonObjects = text.match(/\{"text":"[\s\S]*?", "session_id":"[^"]*"\}/g)
      if (jsonObjects) {
        for (const jsonObj of jsonObjects) {
          try {
            const escapedJson = jsonObj.replace(/\r?\n/g, '\\n')
            const data = JSON.parse(escapedJson)
            if (data.text && data.text !== 'None') {
              const cleanText = data.text.replace(/\*/g, '')
              accumulatedContent += cleanText
              params.onChunk?.(cleanText)
              scrollToBottom()
            }
            if (!sessionId.value && data.session_id) {
              sessionId.value = data.session_id
              console.log('已存储 session_id:', sessionId.value)
            }
          } catch (e) {
            console.error('JSON解析失败', e)
          }
        }
      }
    })
  })
}

const filterStarsAndTrailingNone = (str) => {
  if (typeof str !== 'string') return '';
  // 1. 删除所有星号
  let filtered = str.replace(/\*/g, '');
  // 2. 删除末尾出现的 "None"（忽略其前后的空白，包括换行）
  filtered = filtered.replace(/\s*None\s*$/, '');
  return filtered;
}

const decodeUtf8 = (arrayBuffer: ArrayBuffer) => {
  const uint8 = new Uint8Array(arrayBuffer);
  let str = '';
  let i = 0;
  while (i < uint8.length) {
    const byte1 = uint8[i++];
    if (byte1 < 0x80) {
      str += String.fromCharCode(byte1);
    } else if (byte1 >= 0xC2 && byte1 < 0xE0) {
      const byte2 = uint8[i++];
      str += String.fromCharCode(((byte1 & 0x1F) << 6) | (byte2 & 0x3F));
    } else if (byte1 >= 0xE0 && byte1 < 0xF0) {
      const byte2 = uint8[i++];
      const byte3 = uint8[i++];
      str += String.fromCharCode(((byte1 & 0x0F) << 12) | ((byte2 & 0x3F) << 6) | (byte3 & 0x3F));
    } else if (byte1 >= 0xF0 && byte1 < 0xF5) {
      const byte2 = uint8[i++];
      const byte3 = uint8[i++];
      const byte4 = uint8[i++];
      const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3F) << 12) | ((byte3 & 0x3F) << 6) | (byte4 & 0x3F);
      // 将码点转换为代理对
      if (codePoint > 0xFFFF) {
        const high = 0xD800 + ((codePoint - 0x10000) >> 10);
        const low = 0xDC00 + ((codePoint - 0x10000) & 0x3FF);
        str += String.fromCharCode(high, low);
      } else {
        str += String.fromCharCode(codePoint);
      }
    }
  }
  return str;
}

// 初始化对话（首次请求）
const initChat = async () => {
  chatList.value.push({
    role: 'assistant',
    content: ''
  })
  const currentIndex = chatList.value.length - 1

  try {
    const result = await streamChat({
      body_id: agent.value.id,
      session_id: sessionId.value,
      prompt: 'init',
      onChunk: (text) => {
        chatList.value[currentIndex].content += text
        scrollToBottom()
      }
    })
  } catch (e) {
    console.error('初始化对话失败', e)
    chatList.value.pop()
  }
}

const goBack = () => {
  uni.navigateBack()
}

const copyText = (text: string) => {
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '复制成功', icon: 'success' })
    }
  })
}

// 发送消息
const sendMessage = async () => {
  if (!useStore.userInfo.phone) {
    uni.navigateTo({
      url: '/pages/login/index'
    })
    return
  }

  // 检查算力是否充足
  if (useStore.userInfo.coin < 5 && agentTemplate.value?.stat == 0) {
    showCoinModal.value = true
    return
  }

  if (!inputText.value.trim()) {
    uni.showToast({ title: '请输入内容', icon: 'none' })
    return
  }

  const userMessage = inputText.value.trim()
  chatList.value.push({ role: 'user', content: userMessage })
  inputText.value = ''
  scrollToBottom()

  chatList.value.push({ role: 'assistant', content: '' })
  const currentIndex = chatList.value.length - 1
  loading.value = true

  try {
    const result = await streamChat({
      body_id: agent.value.id,
      session_id: sessionId.value,
      prompt: userMessage,
      onChunk: (text) => {
        chatList.value[currentIndex].content += text
        scrollToBottom()
      }
    })

    // 发送成功后更新用户信息（更新coin）
    try {
      const userInfoRes: any = await getUserInfoWebUserGetUserInfoGet({})
      useStore.userInfo = userInfoRes
      useStore.setUserInfo(userInfoRes)
    } catch (e) {
      console.error('更新用户信息失败', e)
    }
  } catch (e) {
    console.error('对话接口调用失败', e)
    chatList.value.pop()
    uni.showToast({ title: '发送失败', icon: 'none' })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

// 获取充值商品列表
async function getRechargeProList() {
  const res: any = await recharegeProListWebHomeGoodRecharegeListGet({ params: {} })
  rechargeProList.value = res.data || []
}

// 支付处理
const handlePay = async () => {
  try {
    // 获取充值商品列表
    if (rechargeProList.value.length === 0) {
      await getRechargeProList()
    }

    if (rechargeProList.value.length === 0) {
      uni.showToast({
        title: '暂无充值商品',
        icon: 'none'
      })
      return
    }

    // 根据档位获取对应商品
    // 第一档（达人）-> id 1305
    // 第二档（店长）-> id 1306
    // 第三档（代理）-> id 1307
    const productIdMap = {
      0: 1305, // 达人
      1: 1306, // 店长
      2: 1307  // 代理
    }
    const targetProductId = productIdMap[activeTierIndex.value]
    const product = rechargeProList.value.find(item => item.id === targetProductId)

    if (!product) {
      uni.showToast({
        title: '未找到对应档位的商品',
        icon: 'none'
      })
      return
    }

    // 从zdyspec中解析售价和规格信息
    let zdyspecData = {}
    try {
      const [t1, t2, t3, t4] = product.zdyspec.split('@@')
      const list = JSON.parse(t4)
      if (list.length > 0) {
        zdyspecData = list[0]
      }
    } catch (e) {
      console.error('解析zdyspec失败', e)
    }

    // 获取用户地址
    const addressRes: any = await getAddressWebOrderAddressGetGet({})
    const addressId = addressRes && addressRes.length > 0 ? addressRes[0].id : 0

    if (!addressId) {
      uni.showModal({
        title: '提示',
        content: '请先添加收货地址',
        confirmText: '去添加',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages-sub/my/editAddress?type=add'
            })
          }
        }
      })
      return
    }

    // 使用currentTier中动态计算的价格
    const price = currentTier.value.price

    // 构造订单数据
    const orderData = {
      user_id: useStore.userInfo.id,
      address_id: addressId,
      data: [{
        good_id: product.id || product.good_id,
        use_balance: 0,
        use_coin: 0,
        amount: 1,
        recommender_id: 0,
        good_option_id: 0,
        good_option_name: "null",
        user_detail: "null",
        zdyspec: JSON.stringify(zdyspecData) || "",
        zdyspec_good_index: '"{\"1\":1}"'
      }],
      total_price: parseFloat(price) * 100 || 0,
    }

    // 调用创建订单接口
    const res: any = await createRecharegeOrderWebOrderCreateRecharegeOrderPost({
      body: orderData
    })

    if (res.appId) {
      // 拉起支付
      uni.showToast({
        title: '正在拉起支付...',
        icon: 'none'
      })
      wx.requestPayment({
        provider: 'wxpay',
        timeStamp: res.timeStamp,
        nonceStr: res.nonceStr,
        package: res.package,
        signType: res.signType,
        paySign: res.paySign,
        success: async (res) => {
          uni.showToast({ title: '支付成功' });
          // 发送成功后更新用户信息（更新coin）
          try {
            const userInfoRes: any = await getUserInfoWebUserGetUserInfoGet({})
            useStore.userInfo = userInfoRes
            useStore.setUserInfo(userInfoRes)

            // 支付成功后的业务逻辑
            showCoinModal.value = false
          } catch (e) {
            console.error('更新用户信息失败', e)
          }

        },
        fail: (err) => {
          console.error('支付失败', err);
          uni.showToast({ title: '支付失败', icon: 'none' });
        }
      })

    } else {
      uni.showToast({
        title: res.msg || '创建订单失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('支付失败', error)
    uni.showToast({
      title: '支付失败，请稍后重试',
      icon: 'none'
    })
  }
}

const dynamicHeightStyle = ref('height: 40px')
const MAX_HEIGHT = 120
const LINE_HEIGHT = 20 // 实际行高，根据你的 line-height 调整

const onLineChange = (e) => {
  // e.detail = { lineCount, height, heightRpx }
  // const lineCount = e.detail?.lineCount || 1
  // let newHeight = lineCount * LINE_HEIGHT + 12 // 上下 padding
  // newHeight = Math.min(newHeight, MAX_HEIGHT)
  // newHeight = Math.max(newHeight, 40)
  // dynamicHeightStyle.value = `height: ${newHeight}px`
}

const playVideo = (video) => {
  console.log(video)
  uni.navigateTo({
    url: `/pages-sub/project/video?url=${encodeURIComponent(video.url)}&title=${encodeURIComponent(video.title)}`
  })
}

// 页面生命周期
onLoad((options) => {
  if (options.agent) {
    try {
      let obj = JSON.parse(decodeURIComponent(options.agent))
      agent.value = obj.TAutobody
      agentTemplate.value = obj.TAutobodyConsum
    } catch (e) {
      console.error('解析智能体数据失败', e)
    }
  }
  initChat()
  // 页面加载时获取充值商品列表，以便动态计算价格
  getRechargeProList()
})

// 页面渲染完成后确保可以正确滚动
onReady(() => {
  scrollToBottom()
})
</script>

<style lang="scss" scoped>
.rounded-20px {
  border-radius: 20px;
}

.rounded-tr-4px {
  border-top-right-radius: 4px;
}

.rounded-tl-4px {
  border-top-left-radius: 4px;
}

.max-h-120px {
  max-height: 120px;
}

scroll-view {
  width: 100%;
  transition: max-height 0.1s ease;
}

textarea {
  width: 100%;
  box-sizing: border-box;
}
</style>