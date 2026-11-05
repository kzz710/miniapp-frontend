<template>
  <view class="seg">
    <view
      v-for="opt in options"
      :key="opt.value"
      class="seg-item"
      :class="{ active: modelValue === opt.value }"
      @tap="select(opt.value)"
    >{{ opt.label }}</view>
  </view>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string; options: { label: string; value: string }[] }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>();
function select(v: string) {
  emit('update:modelValue', v);
}
</script>

<style scoped lang="scss">
.seg {
  display: flex;
  background: #f0f3f8;
  border-radius: 999rpx;
  padding: 6rpx;
  gap: 6rpx;
}
.seg-item {
  flex: 1;
  text-align: center;
  padding: 18rpx 0;
  border-radius: 999rpx;
  font-size: 28rpx;
  color: #9AA0AE;
  transition: all 0.2s ease;
}
.seg-item.active {
  background: #fff;
  color: var(--brand, #2f6bff);
  font-weight: 700;
  box-shadow: 0 6rpx 16rpx -4rpx var(--brand-glow, rgba(47, 107, 255, 0.2));
}
</style>
