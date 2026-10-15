<template>
  <view class="verdict" :class="colorClass">
    <view class="emoji">{{ emoji }}</view>
    <view class="big">{{ result.verdict_text }}</view>
    <view class="reason">{{ result.reason }}</view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalcResult } from '@/types/car';

const props = defineProps<{ result: CalcResult }>();
const colorClass = computed(() => {
  if (props.result.verdict === 'buy') return 'green';
  if (props.result.verdict === 'consider') return 'yellow';
  return 'red';
});
const emoji = computed(() => {
  if (props.result.verdict === 'buy') return '✅';
  if (props.result.verdict === 'consider') return '⚠️';
  return '⛔';
});
</script>

<style scoped lang="scss">
.verdict {
  border-radius: 28rpx;
  padding: 52rpx 36rpx;
  text-align: center;
  margin-bottom: 24rpx;
  position: relative;
  overflow: hidden;
}
.verdict::after {
  content: "";
  position: absolute;
  left: -50rpx;
  bottom: -70rpx;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
}
.emoji {
  font-size: 64rpx;
  margin-bottom: 12rpx;
  position: relative;
  z-index: 1;
}
.big {
  font-size: 72rpx;
  font-weight: 800;
  margin-bottom: 18rpx;
  line-height: 1.1;
  letter-spacing: 2rpx;
  position: relative;
  z-index: 1;
}
.reason {
  font-size: 28rpx;
  line-height: 1.6;
  opacity: 0.92;
  position: relative;
  z-index: 1;
}
.green {
  background: linear-gradient(135deg, #E9FBF1, #CFF3DF);
  color: #0E9B57;
}
.yellow {
  background: linear-gradient(135deg, #FFF4DC, #FFE6B8);
  color: #B7791F;
}
.red {
  background: linear-gradient(135deg, #FDECEC, #FBD3D3);
  color: #D6453B;
}
</style>
