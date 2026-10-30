<template>
  <view class="page">
    <view
      class="hero"
      :style="{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor2})` }"
    >
      <view class="badge">🚗 购车决策助手</view>
      <view class="title">{{ app.brandName }}</view>
      <view class="sub">精简查价 · 输入车型即看参考优惠价</view>
    </view>

    <view class="card">
      <view class="label">输入车型</view>
      <input
        class="input"
        v-model="keyword"
        placeholder="如：比亚迪 海豹"
        confirm-type="search"
        @confirm="onQuery"
      />
      <button
        class="btn"
        :loading="loading"
        :style="{ background: themeColor }"
        @tap="onQuery"
      >
        查询价格
      </button>
    </view>

    <view v-if="car" class="result">
      <view class="r-title">{{ car.brand }} {{ car.model }}</view>
      <view class="r-price">
        参考优惠价 <text class="num" :style="{ color: themeColor }">{{ car.ref_discount_price }}</text> 万
      </view>
      <view v-if="car.config" class="r-config">{{ car.config }}</view>
    </view>
    <view v-else-if="err" class="err">{{ err }}</view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useApp } from '@/composables/useApp'
import { queryCarPrice } from '@/api'
import type { CarPrice } from '@/types/car'

const app = useApp()
const themeColor = app.themeColor
const themeColor2 = app.themeColor2

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
.page {
  min-height: 100vh;
  background: #f2f4f8;
  padding-bottom: 40rpx;
}
.hero {
  padding: 60rpx 40rpx 50rpx;
  color: #fff;
}
.badge {
  display: inline-block;
  font-size: 24rpx;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.2);
  padding: 6rpx 18rpx;
  border-radius: 999rpx;
}
.title {
  font-size: 56rpx;
  font-weight: 700;
  margin-top: 20rpx;
}
.sub {
  font-size: 26rpx;
  opacity: 0.9;
  margin-top: 12rpx;
}
.card {
  margin: -30rpx 30rpx 0;
  background: #fff;
  border-radius: 24rpx;
  padding: 36rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.06);
}
.label {
  font-size: 28rpx;
  color: #16181d;
  margin-bottom: 16rpx;
}
.input {
  height: 84rpx;
  border: 2rpx solid #e6e8ee;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
}
.btn {
  margin-top: 28rpx;
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
}
.result {
  margin: 30rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 36rpx;
}
.r-title {
  font-size: 34rpx;
  font-weight: 600;
  color: #16181d;
}
.r-price {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #666;
}
.num {
  font-size: 44rpx;
  font-weight: 700;
}
.r-config {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #999;
}
.err {
  margin: 30rpx;
  color: #e54d42;
  font-size: 28rpx;
}
</style>
