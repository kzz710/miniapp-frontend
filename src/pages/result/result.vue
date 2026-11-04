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
      <button class="btn" @tap="goInput">换个车型</button>
    </view>

    <button class="btn primary publish-btn" :loading="publishing" @tap="openPublish">发布到广场</button>

    <view v-if="publishVisible" class="mask" @tap="publishVisible = false">
      <view class="dialog" @tap.stop>
        <view class="dlg-title">发布到广场</view>
        <view class="dlg-sub">把这次测算发出来，让大家帮你把把关</view>
        <textarea
          class="dlg-textarea"
          v-model="remark"
          :maxlength="200"
          placeholder="补充说明（选填），比如通勤距离、纠结的点"
          placeholder-class="ph"
        />
        <view class="switch-row">
          <view class="switch-text">
            <view class="switch-title">公开财务明细</view>
            <view class="switch-sub">默认不公开收入 / 支出 / 储蓄</view>
          </view>
          <switch :checked="showFinance" color="#2F6BFF" @change="onSwitchChange" />
        </view>
        <view class="dlg-btns">
          <button class="dlg-btn" @tap="publishVisible = false">取消</button>
          <button class="dlg-btn primary" :loading="publishing" @tap="submitPublish">发布</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import VerdictCard from '@/components/VerdictCard.vue';
import { store } from '@/store';
import { createPost } from '@/api/posts';
import { useAuth } from '@/composables/useAuth';

const { ensureLogin } = useAuth();
const publishVisible = ref(false);
const publishing = ref(false);
const remark = ref('');
const showFinance = ref(false);

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

async function openPublish() {
  const ok = await ensureLogin();
  if (!ok) {
    uni.showToast({ title: '登录后才能发布', icon: 'none' });
    return;
  }
  publishVisible.value = true;
}

function onSwitchChange(e: any) {
  showFinance.value = Boolean(e?.detail?.value);
}

async function submitPublish() {
  if (!store.car || !store.params) return;
  publishing.value = true;
  try {
    const detail = await createPost({
      car: {
        brand: store.car.brand,
        model: store.car.model,
        config: store.car.config,
        energy_type: store.car.energy_type,
        guide_price: store.car.guide_price,
        ref_discount_price: store.car.ref_discount_price,
        fuel_consumption: store.car.fuel_consumption,
        power_consumption: store.car.power_consumption,
      },
      plan: store.params,
      remark: remark.value.trim() || undefined,
      show_finance: showFinance.value,
    });
    publishVisible.value = false;
    store.postsDirty = true;
    uni.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateTo({ url: `/pages/post/detail?id=${detail.id}` });
    }, 500);
  } catch (err) {
    uni.showToast({ title: (err as Error)?.message || '发布失败', icon: 'none' });
  } finally {
    publishing.value = false;
  }
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
.publish-btn {
  margin-top: 8rpx;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 25, 0.45);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.dialog {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 36rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}
.dlg-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #16181d;
}
.dlg-sub {
  font-size: 24rpx;
  color: #9aa0ae;
  margin-top: 8rpx;
}
.dlg-textarea {
  width: 100%;
  height: 170rpx;
  background: #f4f6fa;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #16181d;
  box-sizing: border-box;
  margin-top: 24rpx;
}
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24rpx;
}
.switch-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #16181d;
}
.switch-sub {
  font-size: 22rpx;
  color: #9aa0ae;
  margin-top: 6rpx;
}
.dlg-btns {
  display: flex;
  gap: 20rpx;
  margin-top: 30rpx;
}
.dlg-btn {
  flex: 1;
  height: 86rpx;
  line-height: 86rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  background: #eef1f6;
  color: #5b6170;
}
.dlg-btn.primary {
  background: linear-gradient(135deg, #2f6bff, #6a5cff);
  color: #fff;
}
</style>
