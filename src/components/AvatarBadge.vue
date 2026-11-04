<template>
  <view class="avatar" :style="style">{{ text }}</view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{ text: string; color: string; size?: number }>(),
  { size: 88 },
);

const style = computed(() => ({
  width: `${props.size}rpx`,
  height: `${props.size}rpx`,
  background: props.color || '#2F6BFF',
  fontSize: `${Math.round(props.size * 0.42)}rpx`,
}));
</script>

<style scoped>
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1;
  overflow: hidden;
}
</style>
