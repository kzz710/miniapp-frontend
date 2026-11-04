<template>
  <view v-if="visible" class="mask" @tap="close">
    <view class="sheet" @tap.stop>
      <view class="sheet-head">
        <text class="sheet-title">给出你的判断</text>
        <text class="sheet-close" @tap="close">关闭</text>
      </view>

      <view class="opts">
        <view
          v-for="opt in options"
          :key="opt.value"
          class="opt"
          :class="[opt.value, { active: decision === opt.value }]"
          @tap="decision = opt.value"
        >
          <text class="opt-ico">{{ opt.ico }}</text>
          <text class="opt-label">{{ opt.label }}</text>
        </view>
      </view>

      <view class="field">
        <text class="f-label">你的意见（10~200 字）</text>
        <textarea
          class="comment"
          v-model="comment"
          :maxlength="200"
          placeholder="说说你的理由，比如月供压力、用车成本、是否值得等"
          placeholder-class="ph"
        />
        <view class="counter">{{ comment.length }}/200</view>
      </view>

      <button class="btn primary" :loading="submitting" @tap="onSubmit">提交审批</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { ReviewDecision } from '@/types/social';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    submitting?: boolean;
    initialDecision?: ReviewDecision | null;
    initialComment?: string;
  }>(),
  { submitting: false, initialDecision: null, initialComment: '' },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', payload: { decision: ReviewDecision; comment: string }): void;
}>();

const options: { value: ReviewDecision; label: string; ico: string }[] = [
  { value: 'buy', label: '买买买', ico: '✅' },
  { value: 'consider', label: '理性考虑', ico: '⚠️' },
  { value: 'avoid', label: '买个 der', ico: '⛔' },
];

const decision = ref<ReviewDecision>('consider');
const comment = ref('');

watch(
  () => props.visible,
  (v) => {
    if (v) {
      decision.value = props.initialDecision || 'consider';
      comment.value = props.initialComment || '';
    }
  },
);

function close() {
  emit('close');
}

function onSubmit() {
  const text = comment.value.trim();
  if (text.length < 10) {
    uni.showToast({ title: '意见至少 10 个字', icon: 'none' });
    return;
  }
  emit('submit', { decision: decision.value, comment: text });
}
</script>

<style scoped lang="scss">
$ink: #16181d;
$ink-3: #9aa0ae;
$brand: #2f6bff;
$line: rgba(20, 30, 60, 0.07);
.mask {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 25, 0.45);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 36rpx 32rpx calc(32rpx + env(safe-area-inset-bottom));
}
.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sheet-title {
  font-size: 34rpx;
  font-weight: 700;
  color: $ink;
}
.sheet-close {
  font-size: 26rpx;
  color: $ink-3;
  padding: 8rpx 12rpx;
}
.opts {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}
.opt {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 22rpx 0;
  border-radius: 20rpx;
  border: 2rpx solid $line;
  background: #f8f9fc;
  transition: all 0.15s;
  &.active.buy {
    border-color: #0e9b57;
    background: #eefaf3;
  }
  &.active.consider {
    border-color: #b7791f;
    background: #fff7e8;
  }
  &.active.avoid {
    border-color: #d6453b;
    background: #fdf0f0;
  }
}
.opt-ico {
  font-size: 34rpx;
}
.opt-label {
  font-size: 24rpx;
  color: #5b6170;
  font-weight: 600;
}
.comment {
  width: 100%;
  height: 180rpx;
  background: #f4f6fa;
  border-radius: 16rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: $ink;
  box-sizing: border-box;
}
.counter {
  text-align: right;
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 8rpx;
}
.btn {
  margin-top: 24rpx;
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 18rpx;
  font-size: 30rpx;
  font-weight: 600;
  background: linear-gradient(135deg, $brand, #6a5cff);
  color: #fff;
}
</style>
