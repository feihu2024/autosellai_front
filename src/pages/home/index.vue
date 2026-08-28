<template>
  <!-- 模板变体加载中：显示占位，避免先渲染默认模板再切换导致的闪动 -->
  <view v-if="!templateLoaded" class="template-placeholder">
    <text>加载中...</text>
  </view>

  <!-- ===== 金色模板 F-1（模板2） ===== -->
  <view v-else-if="isGoldTemplate" class="gold-home">
    <!-- Banner 轮播 -->
    <view v-if="homeBanners.length > 0" class="g-banner-carousel">
      <view class="g-banner-track" :style="{ transform: `translateX(-${currentBanner * 100}%)` }">
        <view v-for="(banner, idx) in homeBanners" :key="banner.id || idx" class="g-banner-slide"
          @click="onBannerClick(banner)">
          <image :src="getImageUrl(banner.image_url)" class="g-banner-img" mode="aspectFill" />
        </view>
      </view>
      <view class="g-banner-dots" v-if="homeBanners.length > 1">
        <view v-for="(banner, idx) in homeBanners" :key="idx"
          :class="['g-banner-dot', { active: currentBanner === idx }]" @click="currentBanner = idx" />
      </view>
    </view>

    <!-- 静态 Hero 回退 -->
    <view v-else class="g-hero">
      <image
        src="https://mlcfjihuaqn.yxiaozhu.com/saas/180e0974d62e429ebf16dd1818f2872a.png?e=1786247524&token=8HYKX7kOi_0yI5lbCm9L15PD17ROW4bDVRCIXtCA:o9KGrYnDxlUsa2tWEqTwROeEQlM="
        class="g-hero-img" mode="widthFix" />
    </view>

    <!-- 搜索框 -->
    <view class="g-search-box">
      <image class="g-search-ico" src="/static/tpl-gold/icon-search.png" mode="aspectFit" />
      <input v-model="searchKeyword" type="text" confirm-type="search"
        :placeholder="agentVisible ? '搜索智能体 / 功能' : '搜索商品'" @input="onSearch" />
      <view v-if="searchKeyword" class="g-search-clear" @click="
        searchKeyword = '';
      onSearch();
      "><text>×</text></view>
    </view>

    <!-- 金刚区 -->
    <view class="g-quick-panel">
      <view class="g-quick-action" v-for="tool in quickTools" :key="tool.name" @click="onToolClick(tool)">
        <image :src="goldQuickIcon(tool.name)" mode="aspectFit" />
        <text>{{ tool.name }}</text>
      </view>
    </view>

    <!-- 智能体区域 -->
    <template v-if="agentVisible">
      <view class="g-tabs-row">
        <view v-for="tab in categories" :key="tab.value" class="g-tab" :class="{ active: activeCategory === tab.value }"
          @click="switchCategory(tab.value)"><text>{{ tab.label }}</text></view>
      </view>

      <view class="g-tool-list" v-if="agents.length">
        <template v-for="(agent, index) in agents" :key="agent.id">
          <view class="g-tool-card">
            <view class="g-favorite" :class="{ active: agent.is_favorite }" @click.stop="toggleFavorite(agent)">
              <image src="/static/tpl-gold/icon-star.png" mode="aspectFit" />
            </view>
            <image class="g-tool-thumb" :src="getImageUrl(agent.cover_url || agent.icon) ||
              '/static/icons/common/robot.png'
              " mode="aspectFill" />
            <view class="g-tool-copy">
              <text class="g-tool-name">{{ agent.name }}</text>
              <text class="g-tool-desc">{{ agent.description }}</text>
            </view>
            <view class="g-use-btn" @click="goToChat(agent)"><text>使用</text></view>
          </view>

          <!-- 在第二个智能体后插入模板广告 -->
          <view v-if="index === 1 && templateAdUnit" class="g-ad-container">
            <ad-custom :unit-id="templateAdUnit.ad_unit_id" @load="onAdLoad" @error="onAdError"
              @close="onAdClose"></ad-custom>
          </view>
        </template>
      </view>

      <view v-if="!loading && agents.length === 0" class="g-empty-state">
        <text class="g-empty-title">没有找到对应智能体</text>
        <text class="g-empty-desc">换一个关键词或分类试试</text>
      </view>
      <view v-if="loading" class="g-loading"><text>加载中...</text></view>
    </template>

    <!-- 商品推荐占位 -->
    <template v-else>
      <view class="g-tabs-row">
        <text class="g-tab active">精选好物</text>
      </view>

      <view class="g-tool-list" v-if="products.length">
        <view class="g-tool-card" v-for="product in products" :key="product.id" @click="goToProduct(product)">
          <image class="g-tool-thumb" :src="getImageUrl(product.main_image) ||
            '/static/icons/common/robot.png'
            " mode="aspectFill" />
          <view class="g-tool-copy">
            <text class="g-tool-name">{{ product.name }}</text>
            <text class="g-tool-desc">{{
              product.subtitle || "点击查看详情"
            }}</text>
          </view>
          <view class="g-use-btn" @click.stop="goToProduct(product)"><text>¥{{ product.min_price || product.retail_price
            || 0 }}</text></view>
        </view>
      </view>

      <view v-if="!productsLoading && products.length === 0" class="g-empty-state">
        <text class="g-empty-title">暂无推荐商品</text>
      </view>
      <view v-if="productsLoading" class="g-loading"><text>加载中...</text></view>
    </template>
  </view>

  <!-- ===== 紫色模板（模板1，默认） ===== -->
  <view v-else class="page-shell home-page">
    <!-- 欢迎行 -->
    <view class="welcome-row">
      <view>
        <text class="hello">{{ greetingText }} 👋</text>
        <view class="welcome-title">今天想创作什么？</view>
      </view>
      <view class="notice">●<text></text></view>
    </view>

    <!-- 搜索框 -->
    <view class="search surface">
      <text class="search-icon">⌕</text>
      <input v-model="searchKeyword" :placeholder="agentVisible ? '搜索智能体，或输入你想完成的任务' : '搜索商品，或输入你想找的宝贝'"
        confirm-type="search" @input="onSearch" />
      <button v-if="searchKeyword" class="clear" @tap="
        searchKeyword = '';
      onSearch();
      ">
        ×
      </button>
    </view>

    <!-- 金刚区标题 -->
    <view class="section-head"><text>快捷创作</text></view>

    <!-- 金刚区 -->
    <view class="quick-grid">
      <button v-for="tool in quickTools" :key="tool.name" class="quick-card" @tap="onToolClick(tool)">
        <view :class="['quick-icon', tool.tone]">
          <image :src="tool.icon" mode="aspectFit" />
        </view>
        <text>{{ tool.name }}</text>
      </button>
    </view>

    <!-- 智能体区域 -->
    <template v-if="agentVisible">
      <view class="agent-head">
        <text>智能体推荐</text>
        <text class="result-count">{{ agents.length }} 个结果</text>
      </view>

      <scroll-view class="categories" scroll-x :show-scrollbar="false">
        <button v-for="tab in categories" :key="tab.value"
          :class="['category', { active: activeCategory === tab.value }]" @tap="switchCategory(tab.value)">
          {{ tab.label }}
        </button>
      </scroll-view>

      <view class="agent-list">
        <template v-for="(agent, index) in agents" :key="agent.id">
          <view class="agent-card surface" @tap="goToChat(agent)">
            <image class="agent-icon"
              :src="getImageUrl(agent.cover_url || agent.icon) || '/static/icons/common/robot.png'" mode="aspectFill" />
            <view class="agent-copy">
              <view class="agent-title">
                {{ agent.name }}
                <text v-if="agent.category">{{ agent.category }}</text>
              </view>
              <view class="agent-desc ellipsis">{{ agent.description }}</view>
            </view>
            <button :class="['favorite', { active: agent.is_favorite }]" @tap.stop="toggleFavorite(agent)">
              {{ agent.is_favorite ? '★' : '☆' }}
            </button>
          </view>

          <!-- 在第二个智能体后插入模板广告 -->
          <view v-if="index === 1 && templateAdUnit" class="ad-container">
            <ad-custom :unit-id="templateAdUnit.ad_unit_id" @load="onAdLoad" @error="onAdError"
              @close="onAdClose"></ad-custom>
          </view>
        </template>

        <view v-if="!loading && agents.length === 0" class="empty surface">
          没有找到相关智能体
        </view>
        <view v-if="loading" class="empty surface">加载中...</view>
      </view>
    </template>

    <!-- 商品推荐占位 -->
    <template v-else>
      <view class="agent-head">
        <text>精选好物</text>
        <text class="result-count">{{ products.length }} 个结果</text>
      </view>

      <view class="agent-list">
        <view v-for="product in products" :key="product.id" class="agent-card surface" @tap="goToProduct(product)">
          <image class="agent-icon" :src="getImageUrl(product.main_image) || '/static/icons/common/robot.png'"
            mode="aspectFill" />
          <view class="agent-copy">
            <view class="agent-title">{{ product.name }}</view>
            <view class="agent-desc ellipsis">{{ product.subtitle || '点击查看详情' }}</view>
            <view class="product-price-row">
              <text class="product-price">¥{{ product.min_price || product.retail_price || 0 }}</text>
            </view>
          </view>
        </view>

        <view v-if="!productsLoading && products.length === 0" class="empty surface">
          暂无推荐商品
        </view>
        <view v-if="productsLoading" class="empty surface">加载中...</view>
      </view>
    </template>
  </view>

  <!-- 底部跑马灯登录条（未绑定手机号时显示） -->
  <LoginMarqueeBar />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  getMiniappAgents,
  getMiniappAgentCategories,
  favoriteAgent,
  unfavoriteAgent,
  getMiniappConfig,
  getUserProfile,
  getMiniappMallProducts,
  getAdUnits,
  miniappLogin,
} from "@/api/miniapp";
import { useAdManager } from "@/composables/useAdManager";
import { useMiniappTemplate } from "@/composables/useMiniappTemplate";
import LoginMarqueeBar from "@/components/LoginMarqueeBar.vue";
import { useShare } from "@/composables/useShare";
import { useGlobalState } from "@/composables/useGlobalState";
import { navigator } from "@/utils";
import { getImageUrl } from "@/utils/image";
import { onShow } from "@dcloudio/uni-app";

// 注册页面分享：分享首页 + 自动携带邀请参数
useShare();

const { isGoldTemplate, templateLoaded } = useMiniappTemplate();

const { loginInitialized } = useGlobalState();

const searchKeyword = ref("");
const activeCategory = ref("");
const agents = ref<any[]>([]);
const loading = ref(false);

// Banner 轮播
const homeBanners = ref<any[]>([]);
const currentBanner = ref(0);
let bannerTimer: ReturnType<typeof setInterval> | null = null;

// 权益身份级别排序
const LEVEL_RANK: Record<string, number> = {
  普通: 0,
  达人: 1,
  店长: 2,
  分销商: 3,
};

// 智能体可见性控制
const userBenefitLevel = ref<string>("普通");
const agentVisibleLevel = ref<string>("普通");
const agentVisible = computed(() => {
  const userRank = LEVEL_RANK[userBenefitLevel.value] ?? 0;
  const requiredRank = LEVEL_RANK[agentVisibleLevel.value] ?? 0;
  return userRank >= requiredRank;
});

// 商品推荐占位
const products = ref<any[]>([]);
const productsLoading = ref(false);

const quickTools = [
  { name: "提取链接", icon: "/static/icons/functions/extract-link.png", tone: "blue" },
  { name: "文案提取", icon: "/static/icons/functions/copywriting.png", tone: "orange" },
  { name: "反推提示词", icon: "/static/icons/functions/reverse-prompt.png", tone: "purple" },
  { name: "高端制图", icon: "/static/icons/functions/image-create.png", tone: "green" },
];

// 根据当前时间生成问候语
const greetingText = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return "凌晨好";
  if (h < 9) return "早上好";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 17) return "下午好";
  if (h < 19) return "傍晚好";
  return "晚上好";
});

function goldQuickIcon(name: string): string {
  const map: Record<string, string> = {
    提取链接: "/static/tpl-gold/quick-link.png",
    高端制图: "/static/tpl-gold/quick-image.png",
    文案提取: "/static/tpl-gold/quick-copy.png",
    反推提示词: "/static/tpl-gold/quick-prompt.png",
  };
  return map[name] || "/static/tpl-gold/quick-link.png";
}

const categories = ref<{ label: string; value: string }[]>([
  { label: "全部", value: "" },
]);

let searchTimer: ReturnType<typeof setTimeout> | null = null;

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (agentVisible.value) {
      fetchAgents();
    } else {
      fetchProducts();
    }
  }, 300);
}

function switchCategory(category: string) {
  activeCategory.value = category;
  fetchAgents();
}

// 广告事件处理
function onAdLoad() {
  console.log('模板广告加载成功')
}

function onAdError(e: any) {
  console.error('模板广告加载失败', e)
}

function onAdClose() {
  console.log('模板广告关闭')
}

async function fetchCategories() {
  try {
    const res = await getMiniappAgentCategories();
    const cats = res.data?.categories || [];
    const dynamicTabs = cats.map((c: any) => ({
      label: c.name,
      value: c.name,
    }));
    categories.value = [
      { label: "全部", value: "" },
      ...dynamicTabs,
      { label: "收藏", value: "收藏" },
    ];
  } catch (e) {
    console.error("获取分类失败", e);
    categories.value = [
      { label: "全部", value: "" },
      { label: "收藏", value: "收藏" },
    ];
  }
}

async function fetchAgents() {
  loading.value = true;
  try {
    const res = await getMiniappAgents({
      page: 1,
      page_size: 50,
      category: activeCategory.value || undefined,
      keyword: searchKeyword.value || undefined,
    });
    agents.value = res.data?.items || [];
  } catch (e) {
    console.error("获取智能体列表失败", e);
  } finally {
    loading.value = false;
  }
}

async function toggleFavorite(agent: any) {
  const wasFavorite = agent.is_favorite;
  agent.is_favorite = !wasFavorite;
  try {
    if (wasFavorite) {
      await unfavoriteAgent(agent.id);
    } else {
      await favoriteAgent(agent.id);
    }
  } catch (e) {
    agent.is_favorite = wasFavorite;
    console.error("收藏操作失败", e);
  }
}

function goToChat(agent: any) {
  navigator.push(`/m/agent/chat?id=${agent.id}`);
}

function onBannerClick(banner: any) {
  if (banner.link_url) {
    navigator.push(banner.link_url);
  }
}

function goToProduct(product: any) {
  navigator.push(`/m/mall/${product.id}`);
}

async function fetchProducts() {
  productsLoading.value = true;
  try {
    const res = await getMiniappMallProducts({
      keyword: searchKeyword.value || undefined,
    });
    products.value = res.data?.list || [];
  } catch (e) {
    console.error("获取商品列表失败", e);
  } finally {
    productsLoading.value = false;
  }
}

// ===== 广告频次门禁 =====
const { initFromConfig, shouldShowAdByScene } = useAdManager();

// 模板广告配置（场景ID 13）
const templateAdUnit = ref<any>(null)

const TOOL_TRIGGER_MAP: Record<string, string> = {
  提取链接: "btn_extract_link",
  反推提示词: "btn_reverse_prompt",
  文案提取: "btn_extract_text",
  高端制图: "btn_image_gen",
};

function onToolClick(tool: any) {
  // console.log('点击工具:', tool)
  const triggerKey = TOOL_TRIGGER_MAP[tool.name];
  if (triggerKey == "btn_extract_link") {
    console.log("点击提取链接");
    navigator.push("/m/aiAgent/linkParser");
  } else if (triggerKey == "btn_reverse_prompt") {
    console.log("点击反推提示词");
    navigator.push("/m/aiAgent/promptReverse");
  } else if (triggerKey == "btn_extract_text") {
    console.log("点击文案提取");
    navigator.push("/m/aiAgent/textExtract");
  } else if (triggerKey == "btn_image_gen") {
    navigator.push("/m/aiAgent/highEndImage");
    console.log("点击高端制图");
  } else {
    console.log("其他工具点击:", tool);
  }
}

async function init() {
  try {
    const [configRes, profileRes]: any[] = await Promise.all([
      getMiniappConfig(),
      getUserProfile(),
    ]);
    const configData = configRes.data || {};
    const userData = profileRes.data || {};
    agentVisibleLevel.value = configData.agent_visible_level || "普通";
    userBenefitLevel.value = userData.benefit_level || "普通";

    initFromConfig(configData);

    // 获取模板广告配置（场景ID 13）
    const templateAd = shouldShowAdByScene(13)
    if (templateAd && templateAd.ad_type === 'SLOT_ID_WEAPP_TEMPLATE') {
      templateAdUnit.value = templateAd
    }

    const allBanners = configData.banners || [];
    homeBanners.value = allBanners.filter(
      (b: any) => b.category === "home" && b.image_url,
    );
    if (homeBanners.value.length > 1) {
      bannerTimer = setInterval(() => {
        currentBanner.value =
          (currentBanner.value + 1) % homeBanners.value.length;
      }, 3500);
    }

  } catch (e) {
    console.error("获取配置/用户信息失败", e);
  }

  if (agentVisible.value) {
    await fetchCategories();
    fetchAgents();
  } else {
    fetchProducts();
  }
}

onShow(() => {
  init()
})

// 监听登录状态，登录完成后初始化页面
watch(
  loginInitialized,
  async (initialized) => {
    if (initialized) {
      await init();
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (bannerTimer) clearInterval(bannerTimer);
});
</script>

<style scoped lang="scss">
/* 模板加载占位（避免闪动） */
.template-placeholder {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #75829c;
  font-size: 14px;
}

/* ===== HomeView 紫色模板样式（对齐参考布局） ===== */
.home-page {
  padding: 80rpx 24rpx 0;
  box-sizing: border-box;
}

.welcome-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6rpx 4rpx 24rpx;
}

.hello {
  color: #74849a;
  font-size: 27rpx;
}

.welcome-title {
  margin-top: 7rpx;
  font-size: 46rpx;
  font-weight: 800;
  line-height: 1.25;
}

.notice {
  width: 84rpx;
  height: 84rpx;
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  color: #4774b7;
  background: #eaf2ff;
  font-size: 34rpx;
}

.notice text {
  position: absolute;
  right: 16rpx;
  top: 13rpx;
  width: 14rpx;
  height: 14rpx;
  border: 3rpx solid white;
  border-radius: 50%;
  background: #ff6b6b;
}

.search {
  height: 108rpx;
  padding: 12rpx 16rpx 12rpx 26rpx;
  display: flex;
  align-items: center;
}

.search-icon {
  color: #58708e;
  font-size: 42rpx;
}

.search input {
  flex: 1;
  min-width: 0;
  padding: 0 18rpx;
  font-size: 27rpx;
}

.clear {
  width: 70rpx;
  height: 70rpx;
  line-height: 66rpx;
  padding: 0;
  border-radius: 22rpx;
  color: white;
  background: #3479ed;
  font-size: 38rpx;
}

.clear::after {
  border: none;
}

.section-head {
  margin: 28rpx 4rpx 18rpx;
  font-size: 36rpx;
  font-weight: 800;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.quick-card {
  min-width: 0;
  margin: 0;
  padding: 18rpx 5rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1rpx solid #e7edf6;
  border-radius: 24rpx;
  color: #27364b;
  background: white;
  font-size: 24rpx;
  font-weight: 650;
  line-height: 1.4;
}

.quick-card::after {
  border: none;
}

.quick-icon {
  width: 76rpx;
  height: 76rpx;
  margin-bottom: 13rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 23rpx;
  background: #eaf2ff;
}

.quick-icon image {
  width: 44rpx;
  height: 44rpx;
}

.quick-icon.orange {
  background: #fff1e3;
}

.quick-icon.purple {
  background: #eef0ff;
}

.quick-icon.green {
  background: #e5f8f1;
}

.agent-head {
  margin: 30rpx 4rpx 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 35rpx;
  font-weight: 800;
}

.result-count {
  color: #78889e;
  font-size: 24rpx;
  font-weight: 400;
}

.categories {
  width: 100%;
  margin-bottom: 17rpx;
  white-space: nowrap;
}

.category {
  min-width: 112rpx;
  height: 62rpx;
  margin: 0 12rpx 0 0;
  padding: 0 24rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 31rpx;
  color: #718096;
  background: #edf1f7;
  font-size: 24rpx;
}

.category::after {
  border: none;
}

.category.active {
  color: white;
  background: #2f76ec;
}

.ad-container {
  margin: 16rpx 0;
  padding: 0 24rpx;
}

.agent-list {
  padding-bottom: 40rpx;
}

.agent-card {
  min-height: 160rpx;
  margin-bottom: 17rpx;
  padding: 22rpx 24rpx;
  display: flex;
  align-items: center;
}

.agent-icon {
  width: 118rpx;
  height: 118rpx;
  flex: 0 0 auto;
  border-radius: 30rpx;
  background: #e9f2ff;
}

.agent-copy {
  flex: 1;
  min-width: 0;
  margin-left: 24rpx;
}

.agent-title {
  font-size: 33rpx;
  font-weight: 750;
  line-height: 1.3;
}

.agent-title text {
  margin-left: 10rpx;
  padding: 5rpx 10rpx;
  border-radius: 8rpx;
  color: #e57e37;
  background: #fff1e7;
  font-size: 20rpx;
  vertical-align: middle;
}

.agent-desc {
  margin-top: 14rpx;
  color: #768399;
  font-size: 25rpx;
  line-height: 1.4;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite {
  width: 76rpx;
  height: 76rpx;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #8d9aab;
  background: #f3f6fa;
  font-size: 38rpx;
}

.favorite::after {
  border: none;
}

.favorite.active {
  color: #f3a529;
  background: #fff6e5;
}

.empty {
  padding: 70rpx;
  text-align: center;
  color: #8b97a9;
}

/* 商品价格 */
.product-price-row {
  margin-top: 14rpx;
}

.product-price {
  font-size: 31rpx;
  font-weight: 800;
  color: #ff4d4f;
}

/* surface 卡片通用背景 */
.surface {
  background: white;
  border-radius: 28rpx;
  box-shadow: 0 10rpx 30rpx rgba(39, 54, 75, 0.06);
}

/* ===== HomeView 金色模板样式 ===== */
.gold-home {
  padding: 40px 15px 20px;
  background: #fffaf2;
}

.g-banner-carousel {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(253, 178, 41, 0.15);
}

.g-banner-track {
  display: flex;
  transition: transform 0.4s ease;
}

.g-banner-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 170px;
}

.g-banner-img {
  width: 100%;
  height: 100%;
}

.g-banner-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 5;
}

.g-banner-dot {
  width: 11px;
  height: 3px;
  border-radius: 99px;
  background: #d2d1ce;
  transition: 0.2s;
}

.g-banner-dot.active {
  background: #ff7b1a;
}

.g-hero {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(253, 178, 41, 0.15);
  margin-bottom: 12px;
}

.g-hero-img {
  width: 100%;
}

.g-search-box {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 13px;
  margin-bottom: 12px;
  border: 1px solid #efede8;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 4px 10px rgba(79, 66, 44, 0.08);
}

.g-search-ico {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.g-search-box input {
  min-width: 0;
  flex: 1;
  font-size: 13px;
}

.g-search-clear {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #a4a5a9;
  flex-shrink: 0;
}

.g-quick-panel {
  display: flex;
  gap: 4px;
  padding: 10px 8px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(240, 237, 230, 0.9);
  box-shadow: 0 4px 12px rgba(118, 94, 51, 0.1);
  margin-bottom: 12px;
}

.g-quick-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.g-quick-action image {
  width: 48px;
  height: 48px;
  border-radius: 10px;
}

.g-quick-action text {
  font-size: 12px;
  color: #15171b;
}

.g-tabs-row {
  display: flex;
  align-items: center;
  height: 38px;
  justify-content: space-around;
  border-bottom: 1px solid #f5f2ed;
  padding: 0 7px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 12px 12px 0 0;
  border: 1px solid rgba(240, 237, 230, 0.9);
}

.g-tab {
  position: relative;
  min-width: 60px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #272a2f;
  font-size: 13px;
}

.g-tab.active {
  color: #ff7b1a;
  font-weight: 700;
}

.g-tab.active::after {
  content: "";
  position: absolute;
  height: 2px;
  border-radius: 99px;
  background: linear-gradient(90deg, #ff7b1a, #ffa53d);
  left: 25%;
  right: 25%;
  bottom: 2px;
}

.g-ad-container {
  margin: 16rpx 0;
  padding: 0 16rpx;
}

.g-tool-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
}

.g-tool-card {
  width: calc(50% - 4px);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px 10px;
  border: 1px solid #f1eeea;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 3px 7px rgba(82, 65, 44, 0.06);
}

.g-tool-thumb {
  width: 56px;
  height: 56px;
  border-radius: 14px;
}

.g-tool-copy {
  width: 100%;
  text-align: center;
  margin-top: 8px;
}

.g-tool-name {
  display: block;
  margin-bottom: 3px;
  font-size: 13px;
  font-weight: 700;
  color: #15171b;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.g-tool-desc {
  display: block;
  overflow: hidden;
  color: #7c7f85;
  font-size: 10px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.g-favorite {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 18px;
  height: 18px;
}

.g-favorite image {
  width: 18px;
  height: 18px;
}

.g-favorite.active image {
  filter: sepia(1) saturate(8) hue-rotate(354deg);
}

.g-use-btn {
  width: 100%;
  height: 32px;
  margin-top: 8px;
  border-radius: 16px;
  font-size: 11px;
  color: #15171b;
  font-weight: 600;
  background: linear-gradient(120deg, #ffca38, #ffb62f);
  box-shadow: 0 3px 6px rgba(255, 179, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.g-empty-state,
.g-loading {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  color: #999;
}

.g-empty-title {
  font-size: 13px;
  color: #69758e;
  font-weight: 600;
}

.g-empty-desc {
  font-size: 11px;
  margin-top: 6px;
}
</style>
