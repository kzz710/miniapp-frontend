<template>
  <view class="page">
    <view class="hero">
      <view class="hero-badge">🚗 大家的选择</view>
      <view class="hero-title">买车广场</view>
      <view class="hero-sub">看看别人怎么买，也帮别人把把关</view>
    </view>

    <view class="toolbar">
      <view class="tabs">
        <text class="tab" :class="{ active: sort === 'latest' }" @tap="changeSort('latest')">最新</text>
        <text class="tab" :class="{ active: sort === 'hot' }" @tap="changeSort('hot')">最热</text>
      </view>
      <text class="total" v-if="total > 0">共 {{ total }} 条</text>
    </view>

    <view v-if="error" class="empty">
      <view class="empty-title">加载失败</view>
      <view class="empty-sub">{{ error }}</view>
      <view class="empty-btn" @tap="load(true)">重新加载</view>
    </view>

    <template v-else>
      <PostCard v-for="item in items" :key="item.id" :post="item" @tap="openDetail(item.id)" />

      <view v-if="!items.length && !loading" class="empty">
        <view class="empty-title">还没有人发布计划</view>
        <view class="empty-sub">去首页算一笔，然后把你的买车计划发出来</view>
        <view class="empty-btn" @tap="goHome">去首页</view>
      </view>

      <view v-if="items.length" class="foot-tip">
        {{ loading ? '加载中…' : finished ? '没有更多了' : '上拉加载更多' }}
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import PostCard from '@/components/PostCard.vue';
import { fetchSquare } from '@/api/posts';
import { store } from '@/store';
import type { PostItem } from '@/types/social';

const sort = ref<'latest' | 'hot'>('latest');
const items = ref<PostItem[]>([]);
const page = ref(0);
const total = ref(0);
const loading = ref(false);
const finished = ref(false);
const error = ref('');

async function load(reset = false) {
  if (loading.value) return;
  if (reset) {
    page.value = 0;
    finished.value = false;
  }
  if (finished.value && !reset) return;

  loading.value = true;
  error.value = '';
  try {
    const res = await fetchSquare(page.value + 1, 10, sort.value);
    items.value = reset ? res.items : items.value.concat(res.items);
    page.value = res.page;
    total.value = res.total;
    finished.value = !res.has_more;
    store.postsDirty = false;
  } catch (err) {
    error.value = (err as Error)?.message || '网络异常，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function changeSort(next: 'latest' | 'hot') {
  if (sort.value === next) return;
  sort.value = next;
  items.value = [];
  load(true);
}

function openDetail(id: number) {
  uni.navigateTo({ url: `/pages/post/detail?id=${id}` });
}

function goHome() {
  uni.switchTab({ url: '/pages/input/input' });
}

onLoad(() => {
  load(true);
});

onShow(() => {
  if (store.postsDirty) load(true);
});

onPullDownRefresh(async () => {
  await load(true);
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  load(false);
});
</script>

<style scoped lang="scss">
$ink: #16181d;
$ink-3: #9aa0ae;
$brand: #2f6bff;
$brand-2: #6a5cff;
.page {
  padding: 32rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
  min-height: 100vh;
  box-sizing: border-box;
}
.hero {
  background: linear-gradient(135deg, $brand 0%, $brand-2 100%);
  border-radius: 28rpx;
  padding: 40rpx 36rpx 44rpx;
  color: #fff;
  box-shadow: 0 16rpx 40rpx rgba(47, 107, 255, 0.26);
}
.hero-badge {
  display: inline-block;
  font-size: 22rpx;
  padding: 8rpx 18rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999rpx;
}
.hero-title {
  font-size: 48rpx;
  font-weight: 800;
  margin-top: 20rpx;
}
.hero-sub {
  font-size: 24rpx;
  opacity: 0.92;
  margin-top: 10rpx;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 28rpx 4rpx 20rpx;
}
.tabs {
  display: flex;
  background: #e9edf5;
  border-radius: 999rpx;
  padding: 6rpx;
}
.tab {
  padding: 10rpx 30rpx;
  font-size: 26rpx;
  color: #5b6170;
  border-radius: 999rpx;
  &.active {
    background: #fff;
    color: $brand;
    font-weight: 600;
    box-shadow: 0 4rpx 12rpx rgba(20, 30, 60, 0.1);
  }
}
.total {
  font-size: 22rpx;
  color: $ink-3;
}
.empty {
  text-align: center;
  padding: 90rpx 40rpx;
  background: #fff;
  border-radius: 28rpx;
}
.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $ink;
}
.empty-sub {
  font-size: 24rpx;
  color: $ink-3;
  margin-top: 12rpx;
  line-height: 1.6;
}
.empty-btn {
  display: inline-block;
  margin-top: 28rpx;
  padding: 16rpx 40rpx;
  border-radius: 999rpx;
  background: #eef3ff;
  color: $brand;
  font-size: 26rpx;
  font-weight: 600;
}
.foot-tip {
  text-align: center;
  font-size: 22rpx;
  color: $ink-3;
  padding: 20rpx 0 40rpx;
}
</style>
