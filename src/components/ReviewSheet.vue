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
        <view class="f-head">
          <text class="f-label">选择你的理由（最多 {{ MAX_REVIEW_TAGS }} 个）</text>
          <text class="f-count">{{ selected.length }}/{{ MAX_REVIEW_TAGS }}</text>
        </view>
        <view class="tags">
          <view
            v-for="tag in tagOptions"
            :key="tag.key"
            class="tag"
            :class="{ active: selected.includes(tag.key) }"
            @tap="toggleTag(tag.key)"
          >
            {{ tag.label }}
          </view>
        </view>
      </view>

      <button class="btn primary" :loading="submitting" @tap="onSubmit">提交审批</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { MAX_REVIEW_TAGS, REVIEW_TAGS } from '@/constants/review';
import type { ReviewDecision } from '@/types/social';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    submitting?: boolean;
    initialDecision?: ReviewDecision | null;
    initialTags?: string[];
  }>(),
  { submitting: false, initialDecision: null, initialTags: () => [] },
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'submit', payload: { decision: ReviewDecision; tags: string[] }): void;
}>();

const options: { value: ReviewDecision; label: string; ico: string }[] = [
  { value: 'buy', label: '买买买', ico: '✅' },
  { value: 'consider', label: '理性考虑', ico: '⚠️' },
  { value: 'avoid', label: '买个 der', ico: '⛔' },
];

const tagOptions = REVIEW_TAGS;
const decision = ref<ReviewDecision>('consider');
const selected = ref<string[]>([]);

watch(
  () => props.visible,
  (v) => {
    if (v) {
      decision.value = props.initialDecision || 'consider';
      selected.value = [...(props.initialTags || [])];
    }
  },
);

function toggleTag(key: string) {
  if (selected.value.includes(key)) {
    selected.value = selected.value.filter((item) => item !== key);
    return;
  }
  if (selected.value.length >= MAX_REVIEW_TAGS) {
    uni.showToast({ title: `最多选择 ${MAX_REVIEW_TAGS} 个理由`, icon: 'none' });
    return;
  }
  selected.value = [...selected.value, key];
}

function close() {
  emit('close');
}

function onSubmit() {
  if (!selected.value.length) {
    uni.showToast({ title: '请至少选择一个理由', icon: 'none' });
    return;
  }
  emit('submit', { decision: decision.value, tags: [...selected.value] });
}
</script>

<style scoped lang="scss">
$ink: #111318;
$ink-3: #9ba2b0;
$line: rgba(17, 20, 28, 0.07);
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
.field {
  margin-top: 26rpx;
}
.f-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.f-label {
  font-size: 25rpx;
  color: #5b6170;
  font-weight: 600;
}
.f-count {
  font-size: 22rpx;
  color: $ink-3;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 16rpx;
}
.tag {
  padding: 14rpx 22rpx;
  border-radius: 999rpx;
  background: #f4f6fa;
  font-size: 24rpx;
  color: #5b6170;
  border: 2rpx solid transparent;
  &.active {
    background: var(--brand-tint, rgba(47, 107, 255, 0.08));
    border-color: var(--brand, #2f6bff);
    color: var(--brand, #2f6bff);
    font-weight: 600;
  }
}
.btn {
  margin-top: 28rpx;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 22rpx;
  font-size: 31rpx;
  font-weight: 700;
  background: linear-gradient(135deg, var(--brand, #2f6bff), var(--brand-2, #6a5cff));
  color: #fff;
  box-shadow: 0 16rpx 32rpx -10rpx var(--brand-glow, rgba(47, 107, 255, 0.32));
}
</style>
