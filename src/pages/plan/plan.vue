<template>
  <view class="page">
    <!-- 步骤指示 -->
    <view class="steps">
      <view class="step done"><text class="dot">1</text><text class="s-name">选车</text></view>
      <view class="step-line"></view>
      <view class="step active"><text class="dot">2</text><text class="s-name">方案</text></view>
      <view class="step-line"></view>
      <view class="step"><text class="dot">3</text><text class="s-name">结论</text></view>
    </view>

    <view class="card" v-if="store.car">
      <view class="section-label">已选车型</view>
      <view class="price-row"><text>车型</text><text>{{ store.car.brand }} {{ store.car.model }} {{ store.car.config }}</text></view>
      <view class="price-row"><text>能源类型</text><text class="hl">{{ energyLabel }}</text></view>
      <view class="price-row"><text>参考优惠价</text><text class="hl">{{ store.car.ref_discount_price }} 万</text></view>
    </view>

    <view class="card">
      <view class="section-label">购车方案</view>
      <SegmentedControl v-model="mode" :options="modeOptions" />
      <template v-if="mode === 'loan'">
        <view class="field">
          <text class="f-label">首付比例</text>
          <view class="chips">
            <view
              v-for="r in downRatios"
              :key="r"
              class="chip"
              :class="{ active: downPaymentRatio === r }"
              @tap="downPaymentRatio = r"
            >{{ r * 100 }}%</view>
          </view>
        </view>
        <view class="field">
          <text class="f-label">期数</text>
          <view class="chips">
            <view
              v-for="m in monthOptions"
              :key="m"
              class="chip"
              :class="{ active: months === m }"
              @tap="months = m"
            >{{ m }} 期</view>
          </view>
        </view>
        <view class="field">
          <text class="f-label">年化利率(%)</text>
          <input class="input" type="digit" v-model="annualRate" placeholder="如 4.5" placeholder-class="ph" />
        </view>
      </template>
    </view>

    <view class="card">
      <view class="section-label">财务状况（万元 / 月）</view>
      <view class="field"><text class="f-label">月收入</text><input class="input" type="digit" v-model="income" placeholder="如 1.5" placeholder-class="ph" /></view>
      <view class="field"><text class="f-label">月固定支出</text><input class="input" type="digit" v-model="monthlyExpense" placeholder="如 0.5" placeholder-class="ph" /></view>
      <view class="field"><text class="f-label">可用储蓄</text><input class="input" type="digit" v-model="savings" placeholder="如 10" placeholder-class="ph" /></view>
    </view>

    <view class="card">
      <view class="section-label">用车假设（能耗计入月支出）</view>
      <view class="field"><text class="f-label">每月行驶里程 (km)</text><input class="input" type="digit" v-model="monthlyKm" placeholder="如 1000" placeholder-class="ph" /></view>
      <view class="field"><text class="f-label">油价 (元/L){{ fuelHint }}</text><input class="input" type="digit" v-model="fuelPrice" placeholder="如 7.5" placeholder-class="ph" /></view>
      <view class="field"><text class="f-label">电价 (元/kWh){{ elecHint }}</text><input class="input" type="digit" v-model="electricityPrice" placeholder="如 0.6" placeholder-class="ph" /></view>
    </view>

    <button class="btn primary" :loading="loading" @tap="onCalc">测算并查看结论</button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import SegmentedControl from '@/components/SegmentedControl.vue';
import { store } from '@/store';
import { calcPlan } from '@/api';
import type { CalcParams, PlanMode } from '@/types/car';

const mode = ref('full');
const downRatios = [0.2, 0.3, 0.4, 0.5];
const monthOptions = [12, 24, 36, 60];
const downPaymentRatio = ref(0.3);
const months = ref(36);
const annualRate = ref('4.5');
const income = ref('');
const monthlyExpense = ref('');
const savings = ref('');
const loading = ref(false);
const monthlyKm = ref('1000');
const fuelPrice = ref('7.5');
const electricityPrice = ref('0.6');
const modeOptions = [
  { label: '全款', value: 'full' },
  { label: '分期', value: 'loan' },
];

const energyLabel = computed(() => {
  const map: Record<string, string> = { gas: '油车', ev: '电车', hybrid: '混动' };
  return store.car ? map[store.car.energy_type] || '油车' : '油车';
});
const fuelHint = computed(() => (store.car && (store.car.energy_type === 'gas' || store.car.energy_type === 'hybrid') ? '' : '（油车/混动填写）'));
const elecHint = computed(() => (store.car && store.car.energy_type === 'ev' ? '' : '（电车填写）'));

onLoad(() => {
  if (!store.car) {
    uni.redirectTo({ url: '/pages/input/input' });
  }
});

async function onCalc() {
  if (!store.car) return;
  if (!income.value || !monthlyExpense.value || !savings.value) {
    uni.showToast({ title: '请填写财务状况', icon: 'none' });
    return;
  }
  const params: CalcParams = {
    price: store.car.ref_discount_price,
    mode: mode.value as PlanMode,
    down_payment_ratio: downPaymentRatio.value,
    months: months.value,
    annual_rate: Number(annualRate.value) / 100,
    income: Number(income.value),
    monthly_expense: Number(monthlyExpense.value),
    savings: Number(savings.value),
    energy_type: store.car.energy_type,
    fuel_consumption: store.car.fuel_consumption,
    power_consumption: store.car.power_consumption,
    monthly_km: Number(monthlyKm.value),
    fuel_price: Number(fuelPrice.value),
    electricity_price: Number(electricityPrice.value),
  };
  loading.value = true;
  try {
    const res = await calcPlan(params);
    store.params = params;
    store.result = res;
    uni.navigateTo({ url: '/pages/result/result' });
  } catch (e) {
    uni.showToast({ title: '测算失败，请确认后端已启动', icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
$brand: #2F6BFF;
$brand-2: #6A5CFF;
$brand-soft: #EEF3FF;
$ink-3: #9AA0AE;
$line: rgba(20, 30, 60, 0.07);
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 0 28rpx;
}
.step {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.dot {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  border-radius: 50%;
  font-size: 24rpx;
  background: #E4E8F0;
  color: #9AA0AE;
}
.s-name {
  font-size: 26rpx;
  color: #9AA0AE;
}
.step.done .dot {
  background: $brand-soft;
  color: $brand;
}
.step.active .dot {
  background: linear-gradient(135deg, $brand, $brand-2);
  color: #fff;
}
.step.active .s-name {
  color: #16181D;
  font-weight: 600;
}
.step-line {
  flex: 1;
  height: 2rpx;
  margin: 0 24rpx;
  background: $line;
  max-width: 80rpx;
}
// 财务页输入框放大（仅本页生效）
.input {
  height: 92rpx;
  line-height: 92rpx;
  padding: 0 28rpx;
  font-size: 34rpx;
  border-radius: 18rpx;
}
.field {
  margin-top: 28rpx;
}
</style>
