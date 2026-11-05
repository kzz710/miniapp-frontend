<template>
  <view class="page" :style="themeVars">
    <view v-if="error" class="empty">
      <view class="empty-title">加载失败</view>
      <view class="empty-sub">{{ error }}</view>
      <view class="empty-btn" @tap="load(true)">重新加载</view>
    </view>

    <template v-else>
      <PostCard
        v-for="item in items"
        :key="item.id"
        :post="item"
        show-delete
        @tap="openDetail(item.id)"
        @delete="confirmDelete(item)"
      />

      <view v-if="!items.length && !loading" class="empty">
        <view class="empty-title">你还没有发布过买车计划</view>
        <view class="empty-sub">去首页算一笔，把结果发到广场让大家帮你参谋</view>
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
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import PostCard from '@/components/PostCard.vue';
import { fetchMyPosts, removePost } from '@/api/posts';
import { useAuth } from '@/composables/useAuth';
import { store } from '@/store';
import { useAppTheme } from '@/composables/useAppTheme';
import type { PostItem } from '@/types/social';

const { themeVars } = useAppTheme();

const { ensureLogin } = useAuth();
const items = ref<PostItem[]>([]);
const page = ref(0);
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

  const ok = await ensureLogin();
  if (!ok) {
    error.value = '登录失败，请返回重试';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const res = await fetchMyPosts(page.value + 1, 10);
    items.value = reset ? res.items : items.value.concat(res.items);
    page.value = res.page;
    finished.value = !res.has_more;
  } catch (err) {
    error.value = (err as Error)?.message || '网络异常，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function openDetail(id: number) {
  uni.navigateTo({ url: `/pages/post/detail?id=${id}` });
}

function goHome() {
  uni.switchTab({ url: '/pages/input/input' });
}

function confirmDelete(item: PostItem) {
  uni.showModal({
    title: '删除发布',
    content: `确定删除「${item.title}」吗？删除后不可恢复。`,
    confirmText: '删除',
    confirmColor: '#D6453B',
    success: async (res) => {
      if (!res.confirm) return;
      try {
        await removePost(item.id);
        items.value = items.value.filter((p) => p.id !== item.id);
        store.postsDirty = true;
        uni.showToast({ title: '已删除', icon: 'success' });
      } catch (err) {
        uni.showToast({ title: (err as Error)?.message || '删除失败', icon: 'none' });
      }
    },
  });
}

onShow(() => {
  load(true);
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
$ink: #111318;
$ink-3: #9ba2b0;
.empty {
  text-align: center;
  padding: 96rpx 40rpx;
  background: #fff;
  border-radius: 32rpx;
  box-shadow: 0 10rpx 30rpx -14rpx rgba(17, 24, 39, 0.16);
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
  background: var(--brand-soft, #eef3ff);
  color: var(--brand, #2f6bff);
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
