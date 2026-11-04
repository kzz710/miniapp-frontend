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

    <view class="meta">
      <text class="car">{{ post.car_brand }} {{ post.car_model }}</text>
      <text class="dot">·</text>
      <text class="price">落地 {{ post.landed_price }} 万</text>
      <text class="dot" v-if="post.mode === 'loan'">·</text>
      <text class="price" v-if="post.mode === 'loan'">月供 {{ Math.round(post.monthly_payment * 10000) }} 元</text>
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
import AvatarBadge from './AvatarBadge.vue';
import { fromNow } from '@/utils/time';
import type { PostItem } from '@/types/social';

withDefaults(defineProps<{ post: PostItem; showDelete?: boolean }>(), { showDelete: false });
defineEmits<{ (e: 'tap'): void; (e: 'delete'): void }>();
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
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 18rpx;
  font-size: 24rpx;
  color: $ink-3;
}
.car {
  color: #2f6bff;
  font-weight: 600;
}
.price {
  color: $ink-3;
}
.dot {
  margin: 0 10rpx;
  color: #c9ced8;
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
