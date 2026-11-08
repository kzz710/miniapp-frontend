<template>
  <view class="page" :style="themeVars">
    <!-- 大标题区：只保留标题 + 一行说明，靠排版而非色块建立第一眼印象 -->
    <view class="intro">
      <view class="intro-title">买车，<text class="accent">别上头</text></view>
      <view class="intro-sub">查底价 · 算月供 · 听大家怎么说</view>
    </view>

    <!-- 查价：一个输入框 + 一个动作，其余都是快捷项 -->
    <view class="card search-card">
      <view class="search">
        <text class="search-ico">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="输入车型，如 比亚迪 海豹"
          placeholder-class="ph"
          confirm-type="search"
          @confirm="onQuery"
        />
      </view>
      <button class="btn primary" :loading="loading" :disabled="loading" @tap="onQuery">查 价</button>
      <view v-if="loading" class="loading-tip">正在查询报价，通常 15 秒内返回；超时将先给缓存/示例并后台更新 秒</view>

      <view class="quick" v-if="history.length">
        <view class="quick-head">
          <text class="quick-title">最近搜索</text>
          <text class="quick-clear" @tap="clearHist">清空</text>
        </view>
        <view class="chips" :class="{ disabled: loading }">
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
        <view class="chips" :class="{ disabled: loading }">
          <view
            v-for="q in presets"
            :key="'p-' + q"
            class="chip"
            :class="{ active: keyword === q }"
            @tap="quickPick(q)"
          >{{ q }}</view>
        </view>
      </view>
    </view>

    <!-- 结果：价格是绝对主角，超大数字 + 品牌色点睛 -->
    <view class="card price-card" v-if="store.car">
      <view class="pc-head">
        <text class="pc-label">参考优惠价</text>
        <text class="pc-energy" :class="'tag-' + store.car.energy_type">{{ energyLabel }}</text>
      </view>
      <view class="pc-main">
        <text class="display-num brand-num">{{ store.car.ref_discount_price }}</text>
        <text class="display-unit">万</text>
      </view>
      <view class="pc-save" v-if="saveAmount">比指导价省 {{ saveAmount }} 万</view>
      <view class="pc-car">{{ store.car.brand }} {{ store.car.model }}</view>
      <view class="pc-config" v-if="store.car.config">{{ store.car.config }}</view>
      <view class="pc-foot">
        <view class="pc-cell">
          <text class="pc-k">指导价</text>
          <text class="pc-v">{{ store.car.guide_price }} 万</text>
        </view>
        <view class="pc-cell">
          <text class="pc-k">数据来源</text>
          <text class="pc-v">{{ store.car.source }}</text>
        </view>
      </view>
    </view>

    <view class="next" v-if="store.car">
      <button class="btn primary" @tap="goPlan">下一步 · 选方案</button>
      <view class="tip" v-if="store.priceNote || store.isReference">⚠️ {{ store.priceNote || '当前为参考价，接入实时检索后显示真实报价' }}</view>
    </view>

    <!-- 多版本：精简列表，去边框，靠底色区分选中 -->
    <view class="card" v-if="store.options.length > 1">
      <view class="section-label">选择具体版本 · {{ store.options.length }} 个</view>
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
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onShow, onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';
import { store } from '@/store';
import { useAppTheme } from '@/composables/useAppTheme';
import { fetchHotKeywords, queryCarPrice } from '@/api';
import type { CarPrice, EnergyType } from '@/types/car';
import { getHistory, addHistory, clearHistory } from '@/utils/history';

const keyword = ref('');
const loading = ref(false);
const selectedId = ref('');
let lastQueryAt = 0;
// 当前应用 profile（品牌名 / 主题色 / 域名 / 功能开关，由编译期 MP_APP 选定）
const { app, themeVars } = useAppTheme();
// 本地搜索历史（最近优先），与下方“热门车型”共同组成快捷列表
const history = ref<string[]>(getHistory());
// 热门车型由后端按真实搜索量返回；接口失败时保留这份本地兜底
const DEFAULT_PRESETS = ['比亚迪 海豹', '特斯拉 Model 3', '丰田 凯美瑞', '本田 雅阁', '理想 L6'];
const presets = ref<string[]>(DEFAULT_PRESETS);

async function loadHotKeywords() {
  try {
    const items = await fetchHotKeywords();
    if (items.length) presets.value = items;
  } catch {
    /* 保持本地默认，不影响主流程 */
  }
}

const ENERGY_MAP: Record<string, string> = { gas: '油车', ev: '电车', hybrid: '混动' };
const energyLabel = computed(() => (store.car ? ENERGY_MAP[store.car.energy_type] || '油车' : '油车'));
function energyLabelOf(t: EnergyType) {
  return ENERGY_MAP[t] || '油车';
}

// 相对指导价省了多少，用于结果卡的年轻化表达
const saveAmount = computed(() => {
  if (!store.car) return '';
  const diff = Number(store.car.guide_price) - Number(store.car.ref_discount_price);
  return diff > 0 ? diff.toFixed(2) : '';
});

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
  loadHotKeywords();
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
  // 查价进行中忽略快捷词，避免长请求期间误点热门词导致输入框与结果脱节
  if (loading.value) return;
  keyword.value = q;
}

function clearHist() {
  clearHistory();
  history.value = [];
}

async function onQuery() {
  // 防重复提交：查询进行中忽略按钮点击与键盘回车
  if (loading.value) return;

  const kw = keyword.value.trim();
  if (!kw) {
    uni.showToast({ title: '请输入车型', icon: 'none' });
    return;
  }

  // 双击/连点保护：600ms 内只接受一次有效查询
  const now = Date.now();
  if (now - lastQueryAt < 600) return;
  lastQueryAt = now;

  loading.value = true;
  try {
    const res = await queryCarPrice(kw);
    if (res.data) {
      // 回写本次实际查询词，防止等待期间误点快捷词导致输入框与价格卡不一致
      keyword.value = kw;
      store.options = res.options || [res.data];
      store.car = res.data;
      store.isReference = res.is_reference;
      store.priceNote = res.note || '';
      selectedId.value = res.data.car_id;
      addHistory(kw);
      history.value = getHistory();
      uni.showToast({ title: '查询成功', icon: 'success' });
    } else {
      store.options = [];
      store.car = null;
      store.isReference = false;
      store.priceNote = '';
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
$ink: #111318;
$ink-3: #9ba2b0;
$line: rgba(17, 20, 28, 0.07);

// 查价卡：主按钮紧跟输入框，快捷项退到下方，视觉动线更短
.search-card {
  padding-bottom: 40rpx;
}
.loading-tip {
  margin-top: 16rpx;
  text-align: center;
  font-size: 22rpx;
  color: $ink-3;
}
.search-card .btn.primary {
  margin-top: 20rpx;
}

// 价格大卡：白底 + 超大品牌色数字，页面唯一的视觉锚点
.price-card {
  position: relative;
  overflow: hidden;
  padding: 40rpx 36rpx 32rpx;
}
.price-card::after {
  content: "";
  position: absolute;
  right: -90rpx;
  top: -110rpx;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: var(--brand-tint, rgba(47, 107, 255, 0.06));
}
.pc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}
.pc-label {
  font-size: 26rpx;
  color: $ink-3;
  font-weight: 500;
}
.pc-energy {
  font-size: 21rpx;
  font-weight: 600;
  color: #fff;
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
  &.tag-gas { background: #5b7cff; }
  &.tag-ev { background: #16b98a; }
  &.tag-hybrid { background: #f2994a; }
}
.pc-main {
  display: flex;
  align-items: baseline;
  margin-top: 20rpx;
  position: relative;
  z-index: 1;
}
.brand-num {
  color: var(--brand, #2f6bff);
}
.pc-save {
  display: inline-block;
  margin-top: 18rpx;
  font-size: 22rpx;
  font-weight: 600;
  color: var(--brand, #2f6bff);
  background: var(--brand-soft, #eef3ff);
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  position: relative;
  z-index: 1;
}
.pc-car {
  font-size: 34rpx;
  font-weight: 700;
  color: $ink;
  margin-top: 24rpx;
  line-height: 1.4;
  position: relative;
  z-index: 1;
}
.pc-config {
  font-size: 25rpx;
  color: $ink-3;
  margin-top: 8rpx;
  position: relative;
  z-index: 1;
}
.pc-foot {
  display: flex;
  gap: 24rpx;
  margin-top: 32rpx;
  padding-top: 26rpx;
  border-top: 1rpx solid $line;
  position: relative;
  z-index: 1;
}
.pc-cell {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.pc-k {
  font-size: 22rpx;
  color: $ink-3;
}
.pc-v {
  font-size: 26rpx;
  font-weight: 600;
  color: $ink;
  margin-top: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.next {
  margin-bottom: 24rpx;
}
.next .btn.primary {
  margin-top: 0;
}

// 版本列表：去边框，浅灰底 + 选中态品牌浅底
.ver {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 22rpx;
  border-radius: 20rpx;
  background: #f5f7fb;
  margin-bottom: 14rpx;
  transition: all 0.15s ease;
  &:active { transform: scale(0.985); }
  &.active {
    background: var(--brand-soft, #eef3ff);
    box-shadow: inset 0 0 0 2rpx var(--brand-line, rgba(47, 107, 255, 0.35));
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
  color: $ink;
}
.ver-tag {
  align-self: flex-start;
  font-size: 20rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  color: #fff;
  &.tag-gas { background: #5b7cff; }
  &.tag-ev { background: #16b98a; }
  &.tag-hybrid { background: #f2994a; }
}
.ver-right {
  text-align: right;
  flex-shrink: 0;
  margin-left: 16rpx;
}
.ver-price {
  font-size: 32rpx;
  font-weight: 800;
  color: $ink;
  .u { font-size: 22rpx; color: $ink-3; margin-left: 4rpx; font-weight: 500; }
}
.ver-guide {
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 6rpx;
}

.quick {
  margin-top: 32rpx;
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
  color: var(--brand, #2f6bff);
  padding: 4rpx 8rpx;
}
.chips.disabled { pointer-events: none; opacity: 0.55; }
</style>
