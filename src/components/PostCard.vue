<template>
  <view class="post" @tap="$emit('tap')">
    <view class="head">
      <AvatarBadge :text="post.author.avatar_text" :color="post.author.avatar_color" :size="68" />
      <view class="who">
        <view class="name">{{ post.author.username }}</view>
        <view class="time">{{ fromNow(post.created_at) }}</view>
      </view>
      <view class="verdict" :class="post.verdict">{{ post.verdict_text }}</view>
    </view>

    <view class="title">{{ post.title }}</view>
    <view class="remark" v-if="post.remark">{{ post.remark }}</view>

    <view class="car-block">
      <view class="car-name">
        <text class="car-brand">{{ post.car_brand }}</text>
        <text class="car-model">{{ post.car_model }}</text>
      </view>
      <view class="car-config" v-if="post.car_config">{{ post.car_config }}</view>
    </view>

    <view class="figures">
      <view class="figure">
        <view class="fig-label">落地价</view>
        <view class="fig-value">
          <text class="fig-num">{{ post.landed_price }}</text>
          <text class="fig-unit">万</text>
        </view>
      </view>
      <view class="fig-divider"></view>
      <view class="figure">
        <view class="fig-label">{{ post.mode === 'loan' ? '月供' : '付款方式' }}</view>
        <view class="fig-value">
          <template v-if="post.mode === 'loan'">
            <text class="fig-num orange">{{ monthlyPayment }}</text>
            <text class="fig-unit">元</text>
          </template>
          <text v-else class="fig-text">全款</text>
        </view>
      </view>
    </view>

    <view class="foot">
      <view class="counts">
        <text class="c buy">买 {{ post.buy_count }}</text>
        <text class="c consider">再看 {{ post.consider_count }}</text>
        <text class="c avoid">别买 {{ post.avoid_count }}</text>
      </view>
      <text class="total">共 {{ post.review_count }} 人审批</text>
    </view>

    <view v-if="showDelete" class="manage">
      <text class="del" @tap.stop="$emit('delete')">删除这条发布</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AvatarBadge from './AvatarBadge.vue';
import { fromNow } from '@/utils/time';
import type { PostItem } from '@/types/social';

const props = withDefaults(defineProps<{ post: PostItem; showDelete?: boolean }>(), {
  showDelete: false,
});
defineEmits<{ (e: 'tap'): void; (e: 'delete'): void }>();

const monthlyPayment = computed(() => Math.round(props.post.monthly_payment * 10000));
</script>

<style scoped lang="scss">
$ink: #111318;
$ink-3: #9ba2b0;
$line: rgba(17, 20, 28, 0.07);
.post {
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 22rpx;
  box-shadow: 0 10rpx 30rpx -14rpx rgba(17, 24, 39, 0.16),
    0 2rpx 8rpx rgba(17, 24, 39, 0.03);
  transition: transform 0.15s ease;
  &:active { transform: scale(0.99); }
}
.head {
  display: flex;
  align-items: center;
}
.who {
  flex: 1;
  margin-left: 18rpx;
  min-width: 0;
}
.name {
  font-size: 28rpx;
  font-weight: 600;
  color: $ink;
}
.time {
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 4rpx;
}
.verdict {
  font-size: 22rpx;
  font-weight: 600;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  flex-shrink: 0;
  &.buy {
    background: #e9fbf1;
    color: #0e9b57;
  }
  &.consider {
    background: #fff4dc;
    color: #b7791f;
  }
  &.avoid {
    background: #fdecec;
    color: #d6453b;
  }
}
.title {
  font-size: 32rpx;
  font-weight: 700;
  color: $ink;
  line-height: 1.45;
  margin-top: 22rpx;
}
.remark {
  font-size: 26rpx;
  color: #5b6170;
  line-height: 1.6;
  margin-top: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.car-block {
  margin-top: 20rpx;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  background: var(--brand-tint, rgba(47, 107, 255, 0.06));
}
.car-name {
  font-size: 32rpx;
  font-weight: 700;
  color: $ink;
  line-height: 1.4;
}
.car-brand {
  color: var(--brand, #2f6bff);
  margin-right: 10rpx;
}
.car-config {
  font-size: 24rpx;
  color: #7b8294;
  margin-top: 6rpx;
}
.figures {
  display: flex;
  align-items: center;
  margin-top: 16rpx;
  padding: 20rpx 0;
  background: #f7f8fb;
  border-radius: 20rpx;
}
.figure {
  flex: 1;
  text-align: center;
}
.fig-label {
  font-size: 22rpx;
  color: $ink-3;
}
.fig-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  margin-top: 6rpx;
}
.fig-num {
  font-size: 44rpx;
  font-weight: 800;
  color: var(--brand, #2f6bff);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.fig-num.orange {
  color: #ff6b2f;
}
.fig-unit {
  font-size: 22rpx;
  color: #5b6170;
  margin-left: 4rpx;
}
.fig-text {
  font-size: 32rpx;
  font-weight: 700;
  color: $ink;
}
.fig-divider {
  width: 1rpx;
  height: 58rpx;
  background: $line;
}
.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid $line;
}
.counts {
  display: flex;
  gap: 14rpx;
}
.c {
  font-size: 22rpx;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #f4f6fa;
  color: #5b6170;
  &.buy {
    background: #eefaf3;
    color: #0e9b57;
  }
  &.consider {
    background: #fff7e8;
    color: #b7791f;
  }
  &.avoid {
    background: #fdf0f0;
    color: #d6453b;
  }
}
.total {
  font-size: 22rpx;
  color: $ink-3;
}
.manage {
  margin-top: 18rpx;
  text-align: right;
}
.del {
  font-size: 24rpx;
  color: #d6453b;
  padding: 8rpx 4rpx;
}
</style>
