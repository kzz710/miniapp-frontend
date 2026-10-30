<template>
  <view class="page">
    <view class="hero" :style="heroStyle">
      <view class="hero-badge">🚗 购车决策助手</view>
      <view class="hero-title">{{ app.brandName }}</view>
      <view class="hero-sub">输入车型，30 秒算清买不买得起</view>
    </view>

    <view class="card">
      <view class="section-label">车型关键词</view>
      <view class="search">
        <text class="search-ico">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="如：比亚迪 海豹 650 长续航版"
          placeholder-class="ph"
          confirm-type="search"
          @confirm="onQuery"
        />
      </view>
      <view class="quick" v-if="history.length">
        <view class="quick-head">
          <text class="quick-title">最近搜索</text>
          <text class="quick-clear" @tap="clearHist">清空</text>
        </view>
        <view class="chips">
          <view
            v-for="q in history"
            :key="'h-' + q"
            class="chip"
            :class="{ active: keyword === q }"
            @tap="quickPick(q)"
          >{{ q }}</view>
        </view>
      </view>
      <view class="quick">
        <view class="quick-head">
          <text class="quick-title">热门车型</text>
        </view>
        <view class="chips">
          <view
            v-for="q in presets"
            :key="'p-' + q"
            class="chip"
            :class="{ active: keyword === q }"
            @tap="quickPick(q)"
          >{{ q }}</view>
        </view>
      </view>
      <button class="btn primary" :style="primaryStyle" :loading="loading" @tap="onQuery">查询价格</button>
    </view>

    <view class="card" v-if="store.car">
      <view class="section-label">查询结果{{ store.isReference ? '（参考值）' : '' }}</view>
      <view class="price-row"><text>品牌车型</text><text>{{ store.car.brand }} {{ store.car.model }} {{ store.car.config }}</text></view>
      <view class="price-row"><text>能源类型</text><text class="hl">{{ energyLabel }}</text></view>
      <view class="price-row"><text>指导价</text><text>{{ store.car.guide_price }} 万</text></view>
      <view class="price-row"><text>参考优惠价</text><text class="hl">{{ store.car.ref_discount_price }} 万</text></view>
      <view class="src">来源：{{ store.car.source }}</view>
      <button class="btn primary" :style="primaryStyle" @tap="goPlan">下一步：选方案</button>
    </view>

    <!-- 多版本选择：仅在搜索到多个版本时展示 -->
    <view class="card" v-if="store.options.length > 1">
      <view class="section-label">选择具体版本（共 {{ store.options.length }} 个）</view>
      <view
        v-for="opt in store.options"
        :key="opt.car_id"
        class="ver"
        :class="{ active: selectedId === opt.car_id }"
        @tap="selectVersion(opt)"
      >
        <view class="ver-left">
          <view class="ver-config">{{ opt.config || '标准版' }}</view>
          <view class="ver-tag" :class="'tag-' + opt.energy_type">{{ energyLabelOf(opt.energy_type) }}</view>
        </view>
        <view class="ver-right">
          <view class="ver-price"><text class="hl">{{ opt.ref_discount_price }}</text><text class="u">万</text></view>
          <view class="ver-guide">指导 {{ opt.guide_price }} 万</view>
        </view>
      </view>
      <view class="src">已选：{{ store.car?.brand }} {{ store.car?.model }} {{ store.car?.config }}</view>
    </view>

    <view class="tip" v-if="store.car && store.isReference">⚠️ 当前为内置示例价，接入实时检索后显示真实报价</view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow, onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { store } from '@/store';
import { useApp } from '@/composables/useApp';
import { queryCarPrice } from '@/api';
import type { CarPrice, EnergyType } from '@/types/car';
import { getHistory, addHistory, clearHistory } from '@/utils/history';

const keyword = ref('');
const loading = ref(false);
const selectedId = ref('');
// 当前应用 profile（品牌名 / 主题色 / 域名 / 功能开关，由编译期 MP_APP 选定）
const app = useApp();
// 本地搜索历史（最近优先），与下方“热门车型”共同组成快捷列表
const history = ref<string[]>(getHistory());
const presets = ['比亚迪 海豹', '特斯拉 Model 3', '丰田 凯美瑞', '本田 雅阁', '理想 L6'];

// 主题色随应用变化（hero 渐变 + 主按钮），无需重写全局 SCSS
const heroStyle = {
  background: `linear-gradient(135deg, ${app.themeColor} 0%, ${app.themeColor2} 100%)`,
  boxShadow: `0 16rpx 40rpx ${app.themeColor}47`,
};
const primaryStyle = {
  background: `linear-gradient(135deg, ${app.themeColor} 0%, ${app.themeColor2} 100%)`,
  boxShadow: `0 12rpx 28rpx ${app.themeColor}52`,
};

const ENERGY_MAP: Record<string, string> = { gas: '油车', ev: '电车', hybrid: '混动' };
const energyLabel = computed(() => (store.car ? ENERGY_MAP[store.car.energy_type] || '油车' : '油车'));
function energyLabelOf(t: EnergyType) {
  return ENERGY_MAP[t] || '油车';
}

function selectVersion(opt: CarPrice) {
  store.car = opt;
  selectedId.value = opt.car_id;
}

// 回到本页时刷新历史（例如从方案页返回）
onShow(() => {
  history.value = getHistory();
});

// 从分享链接（好友/朋友圈）进入时，把车型关键词带回搜索框（不自动查询，遵循既往约定）
onLoad((options) => {
  const kw = options?.kw ? decodeURIComponent(options.kw) : '';
  if (kw) keyword.value = kw;
});

// 分享封面：转发可用本地图；朋友圈封面强制要求 https 网络图，本地路径无效
const SHARE_IMAGE_LOCAL = '/static/logo.png';
const SHARE_IMAGE_NET = `${app.prodDomain}/static/logo.png`;

// 转发给微信好友：已查车时带上车型，未查时给通用文案；path 带 kw 便于好友直达
onShareAppMessage(() => {
  const car = store.car;
  const kw = keyword.value.trim();
  const path = `/pages/input/input${kw ? `?kw=${encodeURIComponent(kw)}` : ''}`;
  if (car) {
    return {
      title: `我查了 ${car.brand} ${car.model}，参考优惠价 ${car.ref_discount_price} 万，测测你买不买得起`,
      path,
      imageUrl: SHARE_IMAGE_LOCAL,
    };
  }
  return {
    title: `${app.brandName} · 30 秒算清买不买得起`,
    path,
    imageUrl: SHARE_IMAGE_LOCAL,
  };
});

// 分享到朋友圈：query 形式带回车型（朋友圈只认 query，不认 path）；封面用 https 网络 logo
onShareTimeline(() => {
  const car = store.car;
  const kw = keyword.value.trim();
  const query = kw ? `kw=${encodeURIComponent(kw)}` : '';
  return {
    title: car
      ? `我查了 ${car.brand} ${car.model}，一起来算算买车账`
      : `${app.brandName} · 30 秒算清买不买得起`,
    query,
    imageUrl: SHARE_IMAGE_NET,
  };
});

// 点击快捷项：仅填入关键词，等待用户点击“查询价格”按钮再查询
function quickPick(q: string) {
  keyword.value = q;
}

function clearHist() {
  clearHistory();
  history.value = [];
}

async function onQuery() {
  const kw = keyword.value.trim();
  if (!kw) {
    uni.showToast({ title: '请输入车型', icon: 'none' });
    return;
  }
  loading.value = true;
  try {
    const res = await queryCarPrice(kw);
    if (res.data) {
      store.options = res.options || [res.data];
      store.car = res.data;
      store.isReference = res.is_reference;
      selectedId.value = res.data.car_id;
      addHistory(kw);
      history.value = getHistory();
      uni.showToast({ title: '查询成功', icon: 'success' });
    } else {
      store.options = [];
      store.car = null;
      uni.showToast({ title: res.note || '未找到车型', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '查询失败，请确认后端已启动', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

function goPlan() {
  uni.navigateTo({ url: '/pages/plan/plan' });
}
</script>

<style scoped lang="scss">
$brand: #2F6BFF;
$brand-2: #6A5CFF;
$brand-soft: #EEF3FF;
$ink-3: #9AA0AE;
$line: rgba(20, 30, 60, 0.07);
.ver {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 20rpx;
  border-radius: 20rpx;
  border: 1rpx solid $line;
  margin-bottom: 16rpx;
  transition: all 0.15s ease;
  &.active {
    border-color: $brand;
    background: $brand-soft;
  }
}
.ver-left {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  min-width: 0;
}
.ver-config {
  font-size: 28rpx;
  font-weight: 600;
  color: #16181D;
}
.ver-tag {
  align-self: flex-start;
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  color: #fff;
  &.tag-gas { background: #5B7CFF; }
  &.tag-ev { background: #16B98A; }
  &.tag-hybrid { background: #F2994A; }
}
.ver-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16rpx;
}
.ver-price {
  font-size: 32rpx;
  font-weight: 800;
  color: #16181D;
  .hl { color: $brand; }
  .u { font-size: 22rpx; color: $ink-3; margin-left: 4rpx; }
}
.ver-guide {
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 6rpx;
}
.quick {
  margin-top: 20rpx;
}
.quick-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4rpx;
}
.quick-title {
  font-size: 24rpx;
  color: $ink-3;
}
.quick-clear {
  font-size: 22rpx;
  color: $brand;
  padding: 4rpx 8rpx;
}
</style>
