<template>
  <view class="page">
    <view class="hero">
      <view class="hero-badge">🚗 购车决策助手</view>
      <view class="hero-title">买车么</view>
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
      <view class="chips">
        <view
          v-for="q in quick"
          :key="q"
          class="chip"
          :class="{ active: keyword === q }"
          @tap="keyword = q"
        >{{ q }}</view>
      </view>
      <button class="btn primary" :loading="loading" @tap="onQuery">查询价格</button>
    </view>

    <view class="card" v-if="store.car">
      <view class="section-label">查询结果{{ store.isReference ? '（参考值）' : '' }}</view>
      <view class="price-row"><text>品牌车型</text><text>{{ store.car.brand }} {{ store.car.model }} {{ store.car.config }}</text></view>
      <view class="price-row"><text>能源类型</text><text class="hl">{{ energyLabel }}</text></view>
      <view class="price-row"><text>指导价</text><text>{{ store.car.guide_price }} 万</text></view>
      <view class="price-row"><text>参考优惠价</text><text class="hl">{{ store.car.ref_discount_price }} 万</text></view>
      <view class="src">来源：{{ store.car.source }}</view>
      <button class="btn primary" @tap="goPlan">下一步：选方案</button>
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
import { store } from '@/store';
import { queryCarPrice } from '@/api';
import type { CarPrice, EnergyType } from '@/types/car';

const keyword = ref('');
const loading = ref(false);
const selectedId = ref('');
const quick = ['比亚迪 海豹', '特斯拉 Model 3', '丰田 凯美瑞', '本田 雅阁', '理想 L6'];

const ENERGY_MAP: Record<string, string> = { gas: '油车', ev: '电车', hybrid: '混动' };
const energyLabel = computed(() => (store.car ? ENERGY_MAP[store.car.energy_type] || '油车' : '油车'));
function energyLabelOf(t: EnergyType) {
  return ENERGY_MAP[t] || '油车';
}

function selectVersion(opt: CarPrice) {
  store.car = opt;
  selectedId.value = opt.car_id;
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
</style>
