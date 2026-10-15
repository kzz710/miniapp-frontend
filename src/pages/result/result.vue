<template>
  <view class="page" v-if="store.result">
    <VerdictCard :result="store.result" />

    <!-- 关键指标带 -->
    <view class="metrics">
      <view class="metric">
        <view class="m-label">落地总价</view>
        <view class="m-value">{{ store.result.landed_price }}<text class="m-unit">万</text></view>
      </view>
      <view class="m-divider"></view>
      <view class="metric" v-if="store.result.mode === 'loan'">
        <view class="m-label">月供</view>
        <view class="m-value">{{ store.result.monthly_payment }}<text class="m-unit">万</text></view>
      </view>
      <view class="metric" v-else>
        <view class="m-label">购置税{{ store.result.purchase_tax_halved ? '（减半）' : '' }}</view>
        <view class="m-value">{{ store.result.purchase_tax }}<text class="m-unit">万</text></view>
      </view>
    </view>

    <view class="card">
      <view class="section-label">明细账（万元）</view>
      <view class="row"><text>落地总价</text><text class="hl">{{ store.result.landed_price }}</text></view>
      <view class="row" v-if="store.result.mode === 'loan'"><text>首付</text><text>{{ store.result.down_payment }}</text></view>
      <view class="row" v-if="store.result.mode === 'loan'"><text>贷款额</text><text>{{ store.result.loan_amount }}</text></view>
      <view class="row" v-if="store.result.mode === 'loan'">
        <text>月供</text>
        <text class="hl">{{ store.result.monthly_payment }} 万 / {{ Math.round(store.result.monthly_payment * 10000) }} 元</text>
      </view>
      <view class="row" v-if="store.result.mode === 'loan'"><text>总利息</text><text>{{ store.result.total_interest }}</text></view>
      <view class="row"><text>购置税{{ store.result.purchase_tax_halved ? '（减半）' : '' }}</text><text>{{ store.result.purchase_tax }}</text></view>
      <view class="row"><text>保险</text><text>{{ store.result.insurance }}</text></view>
      <view class="row"><text>上牌杂费</text><text>{{ store.result.misc_fee }}</text></view>
      <view class="row" v-if="store.result.fuel_cost_month > 0"><text>每月油费</text><text class="hl">{{ store.result.fuel_cost_month }} 万 / {{ Math.round(store.result.fuel_cost_month * 10000) }} 元</text></view>
      <view class="row" v-if="store.result.electricity_cost_month > 0"><text>每月电费</text><text class="hl">{{ store.result.electricity_cost_month }} 万 / {{ Math.round(store.result.electricity_cost_month * 10000) }} 元</text></view>
      <view class="row"><text>每月能源费</text><text class="hl">{{ store.result.energy_cost_month }} 万 / {{ Math.round(store.result.energy_cost_month * 10000) }} 元</text></view>
      <view class="row"><text>可支配收入/月</text><text>{{ store.result.disposable_income }}</text></view>
      <view class="row"><text>安全月供线</text><text>{{ store.result.safe_monthly_payment }}</text></view>
    </view>

    <view class="tip">注：每月能源费已计入月度支出，会影响可支配收入与安全月供线。按每月 {{ store.result.monthly_km }} 公里估算。</view>

    <view class="btns">
      <button class="btn" @tap="goPlan">重新测算</button>
      <button class="btn primary" @tap="goInput">换个车型</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import VerdictCard from '@/components/VerdictCard.vue';
import { store } from '@/store';

onShow(() => {
  if (!store.result) {
    uni.redirectTo({ url: '/pages/input/input' });
  }
});

function goPlan() {
  uni.redirectTo({ url: '/pages/plan/plan' });
}
function goInput() {
  store.result = null;
  uni.redirectTo({ url: '/pages/input/input' });
}
</script>

<style scoped lang="scss">
$brand: #2F6BFF;
$brand-2: #6A5CFF;
$ink-3: #9AA0AE;
$line: rgba(20, 30, 60, 0.07);
.metrics {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 28rpx;
  padding: 36rpx 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(20, 30, 60, 0.06);
  border: 1rpx solid $line;
}
.metric {
  flex: 1;
  text-align: center;
}
.m-label {
  font-size: 24rpx;
  color: $ink-3;
  margin-bottom: 12rpx;
}
.m-value {
  font-size: 48rpx;
  font-weight: 800;
  color: #16181D;
  letter-spacing: 1rpx;
}
.m-unit {
  font-size: 26rpx;
  font-weight: 600;
  color: $ink-3;
  margin-left: 4rpx;
}
.m-divider {
  width: 1rpx;
  height: 64rpx;
  background: $line;
}
</style>
