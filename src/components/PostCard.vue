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
$ink: #16181d;
$ink-3: #9aa0ae;
$line: rgba(20, 30, 60, 0.07);
.post {
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 22rpx;
  border: 1rpx solid $line;
  box-shadow: 0 8rpx 30rpx rgba(20, 30, 60, 0.05);
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
  padding: 18rpx 22rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #f2f7ff 0%, #f8fbff 100%);
  border: 1rpx solid rgba(47, 107, 255, 0.12);
}
.car-name {
  font-size: 32rpx;
  font-weight: 700;
  color: $ink;
  line-height: 1.4;
}
.car-brand {
  color: #2f6bff;
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
  padding: 18rpx 0;
  background: #fbfcfe;
  border: 1rpx solid $line;
  border-radius: 18rpx;
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
  font-size: 42rpx;
  font-weight: 800;
  color: #2f6bff;
  line-height: 1.1;
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
