<template>
  <view class="page" :style="themeVars">
    <!-- 与主线一致的大标题区：靠排版而非色块建立第一眼印象 -->
    <view class="intro">
      <view class="eyebrow"><text class="eyebrow-dot"></text>{{ app.brandName }}</view>
      <view class="intro-title">查价，<text class="accent">不绕弯</text></view>
      <view class="intro-sub">输入车型，直接看参考优惠价</view>
    </view>

    <view class="card">
      <view class="label">车型关键词</view>
      <view class="search">
        <text class="search-ico">🔍</text>
        <input
          class="search-input"
          v-model="keyword"
          placeholder="如：比亚迪 海豹"
          placeholder-class="ph"
          confirm-type="search"
          @confirm="onQuery"
        />
      </view>
      <button class="btn primary" :loading="loading" @tap="onQuery">查 价</button>
    </view>

    <!-- 价格是唯一视觉锚点 -->
    <view class="card price-card" v-if="car">
      <view class="pc-head"><text class="pc-label">参考优惠价</text></view>
      <view class="pc-main">
        <text class="display-num brand-num">{{ car.ref_discount_price }}</text>
        <text class="display-unit">万</text>
      </view>
      <view class="pc-car">{{ car.brand }} {{ car.model }}</view>
      <view v-if="car.config" class="pc-config">{{ car.config }}</view>
    </view>
    <view v-else-if="err" class="err">{{ err }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { queryCarPrice } from '@/api'
import type { CarPrice } from '@/types/car'

const { app, themeVars } = useAppTheme()

const keyword = ref('比亚迪 海豹')
const loading = ref(false)
const car = ref<CarPrice | null>(null)
const err = ref('')

async function onQuery() {
  const kw = keyword.value.trim()
  if (!kw) return
  loading.value = true
  err.value = ''
  car.value = null
  try {
    const res = await queryCarPrice(kw)
    car.value = res.data
    if (!car.value) err.value = res.note || '未查到该车型，换个关键词试试'
  } catch {
    err.value = '查询失败，请检查网络或后端服务'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
$ink: #111318;
$ink-3: #9ba2b0;
$line: rgba(17, 20, 28, 0.07);

.price-card {
  position: relative;
  overflow: hidden;
  padding: 40rpx 36rpx;
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
.pc-head,
.pc-main,
.pc-car,
.pc-config { position: relative; z-index: 1; }
.pc-label { font-size: 26rpx; color: $ink-3; }
.pc-main { display: flex; align-items: baseline; margin-top: 20rpx; }
.brand-num { color: var(--brand, #2f6bff); }
.pc-car { font-size: 34rpx; font-weight: 700; color: $ink; margin-top: 24rpx; line-height: 1.4; }
.pc-config { font-size: 25rpx; color: $ink-3; margin-top: 8rpx; }
.err { margin: 8rpx 4rpx; color: #d6453b; font-size: 27rpx; }
</style>
