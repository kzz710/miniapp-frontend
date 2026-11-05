<template>
  <view class="page" v-if="post" :style="themeVars">
    <view class="card author-card">
      <AvatarBadge :text="post.author.avatar_text" :color="post.author.avatar_color" :size="80" />
      <view class="author-body">
        <view class="author-name">{{ post.author.username }}</view>
        <view class="author-time">{{ fromNow(post.created_at) }} 发布 · {{ post.author.user_id }}</view>
      </view>
      <text v-if="post.is_mine" class="delete" @tap="confirmDelete">删除</text>
    </view>

    <view class="verdict-banner" :class="post.verdict">
      <view class="vb-emoji">{{ verdictEmoji }}</view>
      <view class="vb-text">{{ post.verdict_text }}</view>
      <view class="vb-reason">{{ post.reason }}</view>
    </view>

    <view class="card">
      <view class="title">{{ post.title }}</view>
      <view class="remark" v-if="post.remark">{{ post.remark }}</view>
      <view class="tag-row">
        <text class="tag">{{ post.car_brand }} {{ post.car_model }}</text>
        <text class="tag" v-if="post.car_config">{{ post.car_config }}</text>
        <text class="tag">{{ energyLabel }}</text>
        <text class="tag">{{ post.mode === 'loan' ? '分期' : '全款' }}</text>
      </view>
    </view>

    <view class="card">
      <view class="section-label">购车账本（万元）</view>
      <view class="row"><text>参考优惠价</text><text class="hl">{{ post.ref_price }}</text></view>
      <view class="row"><text>落地总价</text><text class="hl">{{ post.landed_price }}</text></view>
      <view class="row" v-if="post.mode === 'loan'">
        <text>月供</text>
        <text>{{ post.monthly_payment }} 万 / {{ Math.round(post.monthly_payment * 10000) }} 元</text>
      </view>
      <view class="row" v-if="post.mode === 'loan'"><text>总利息</text><text>{{ post.total_interest }}</text></view>
      <view class="row"><text>每月能源费</text><text>{{ post.energy_cost_month }} 万</text></view>
    </view>

    <view class="card" v-if="post.finance">
      <view class="section-label">财务情况{{ post.is_mine ? '（仅自己可见）' : '（发布者已公开）' }}</view>
      <view class="row" v-if="post.finance.income != null"><text>月收入</text><text>{{ post.finance.income }} 万</text></view>
      <view class="row" v-if="post.finance.monthly_expense != null"><text>月固定支出</text><text>{{ post.finance.monthly_expense }} 万</text></view>
      <view class="row" v-if="post.finance.savings != null"><text>可用储蓄</text><text>{{ post.finance.savings }} 万</text></view>
      <view class="row" v-if="post.finance.disposable_income != null"><text>可支配收入/月</text><text>{{ post.finance.disposable_income }} 万</text></view>
      <view class="row" v-if="post.finance.safe_monthly_payment != null"><text>安全月供线</text><text>{{ post.finance.safe_monthly_payment }} 万</text></view>
    </view>

    <view class="card">
      <view class="section-label">大家的审批（{{ post.review_count }}）</view>
      <view class="dist">
        <view class="dist-item buy"><text class="dist-num">{{ post.buy_count }}</text><text class="dist-label">买买买</text></view>
        <view class="dist-item consider"><text class="dist-num">{{ post.consider_count }}</text><text class="dist-label">理性考虑</text></view>
        <view class="dist-item avoid"><text class="dist-num">{{ post.avoid_count }}</text><text class="dist-label">买个 der</text></view>
      </view>

      <view v-if="!reviews.length" class="no-review">还没有人审批，来说说你的看法吧</view>

      <view v-for="rv in reviews" :key="rv.id" class="review">
        <view class="review-head">
          <AvatarBadge :text="rv.author.avatar_text" :color="rv.author.avatar_color" :size="56" />
          <view class="review-who">
            <view class="review-name">{{ rv.author.username }}</view>
            <view class="review-time">{{ fromNow(rv.created_at) }}</view>
          </view>
          <text class="review-tag" :class="rv.decision">{{ rv.decision_text }}</text>
        </view>
        <view class="review-comment">{{ rv.comment }}</view>
      </view>

      <view v-if="reviewTotal > reviews.length" class="more" @tap="loadMoreReviews">
        查看更早的审批
      </view>
    </view>

    <view class="bottom-space"></view>

    <view class="action-bar">
      <view v-if="post.is_mine" class="action-tip">这是你的发布，等待大家来审批</view>
      <button v-else class="action-btn" :loading="submitting" @tap="openReview">
        {{ post.my_review ? '修改我的审批' : '我也来审批' }}
      </button>
    </view>

    <ReviewSheet
      :visible="reviewVisible"
      :submitting="submitting"
      :initial-decision="post.my_review?.decision || null"
      :initial-comment="post.my_review?.comment || ''"
      @close="reviewVisible = false"
      @submit="onSubmitReview"
    />
  </view>

  <view v-else class="page" :style="themeVars">
    <view class="empty">
      <view class="empty-title">{{ error || '加载中…' }}</view>
      <view v-if="error" class="empty-btn" @tap="load">重新加载</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import AvatarBadge from '@/components/AvatarBadge.vue';
import ReviewSheet from '@/components/ReviewSheet.vue';
import { fetchPost, fetchReviews, removePost, submitReview } from '@/api/posts';
import { useAuth } from '@/composables/useAuth';
import { store } from '@/store';
import { fromNow } from '@/utils/time';
import { useAppTheme } from '@/composables/useAppTheme';
import type { PostDetail, Review, ReviewDecision } from '@/types/social';

const { themeVars } = useAppTheme();

const { ensureLogin } = useAuth();
const postId = ref(0);
const post = ref<PostDetail | null>(null);
const reviews = ref<Review[]>([]);
const reviewPage = ref(1);
const reviewTotal = ref(0);
const error = ref('');
const reviewVisible = ref(false);
const submitting = ref(false);

const ENERGY_MAP: Record<string, string> = { gas: '油车', ev: '电车', hybrid: '混动' };
const energyLabel = computed(() => ENERGY_MAP[post.value?.energy_type || 'gas'] || '油车');
const verdictEmoji = computed(() => {
  if (post.value?.verdict === 'buy') return '✅';
  if (post.value?.verdict === 'consider') return '⚠️';
  return '⛔';
});

async function load() {
  if (!postId.value) return;
  error.value = '';
  try {
    const detail = await fetchPost(postId.value);
    post.value = detail;
    const list = await fetchReviews(postId.value, 1, 20);
    reviews.value = list.items;
    reviewPage.value = list.page;
    reviewTotal.value = list.total;
  } catch (err) {
    error.value = (err as Error)?.message || '加载失败';
  }
}

async function loadMoreReviews() {
  if (!postId.value) return;
  try {
    const list = await fetchReviews(postId.value, reviewPage.value + 1, 20);
    reviews.value = reviews.value.concat(list.items);
    reviewPage.value = list.page;
    reviewTotal.value = list.total;
  } catch (err) {
    uni.showToast({ title: (err as Error)?.message || '加载失败', icon: 'none' });
  }
}

async function openReview() {
  const ok = await ensureLogin();
  if (!ok) {
    uni.showToast({ title: '登录后才能审批', icon: 'none' });
    return;
  }
  reviewVisible.value = true;
}

async function onSubmitReview(payload: { decision: ReviewDecision; comment: string }) {
  if (!post.value) return;
  submitting.value = true;
  try {
    await submitReview(post.value.id, payload.decision, payload.comment);
    reviewVisible.value = false;
    store.postsDirty = true;
    await load();
    uni.showToast({ title: '审批已提交', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: (err as Error)?.message || '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

function confirmDelete() {
  if (!post.value) return;
  uni.showModal({
    title: '删除发布',
    content: '确定删除这条买车计划吗？删除后不可恢复。',
    confirmText: '删除',
    confirmColor: '#D6453B',
    success: async (res) => {
      if (!res.confirm || !post.value) return;
      try {
        await removePost(post.value.id);
        store.postsDirty = true;
        uni.showToast({ title: '已删除', icon: 'success' });
        setTimeout(() => uni.navigateBack(), 400);
      } catch (err) {
        uni.showToast({ title: (err as Error)?.message || '删除失败', icon: 'none' });
      }
    },
  });
}

onLoad((options) => {
  postId.value = Number(options?.id || 0);
  if (!postId.value) {
    error.value = '缺少发布 ID';
    return;
  }
  load();
});
</script>

<style scoped lang="scss">
$ink: #16181d;
$ink-3: #9aa0ae;
$line: rgba(20, 30, 60, 0.07);
.page {
  padding: 44rpx 36rpx 0;
  min-height: 100vh;
  box-sizing: border-box;
}
.card {
  background: #fff;
  border-radius: 32rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 10rpx 30rpx -14rpx rgba(17, 24, 39, 0.16),
    0 2rpx 8rpx rgba(17, 24, 39, 0.03);
}
.author-card {
  display: flex;
  align-items: center;
}
.author-body {
  flex: 1;
  margin-left: 20rpx;
}
.author-name {
  font-size: 30rpx;
  font-weight: 700;
  color: $ink;
}
.author-time {
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 6rpx;
}
.delete {
  font-size: 24rpx;
  color: #d6453b;
  padding: 8rpx 4rpx;
}
.verdict-banner {
  border-radius: 32rpx;
  padding: 44rpx 32rpx;
  margin-bottom: 24rpx;
  text-align: center;
  &.buy {
    background: linear-gradient(135deg, #e9fbf1, #cff3df);
    color: #0e9b57;
  }
  &.consider {
    background: linear-gradient(135deg, #fff4dc, #ffe6b8);
    color: #b7791f;
  }
  &.avoid {
    background: linear-gradient(135deg, #fdecec, #fbd3d3);
    color: #d6453b;
  }
}
.vb-emoji {
  font-size: 52rpx;
}
.vb-text {
  font-size: 56rpx;
  font-weight: 800;
  margin-top: 8rpx;
}
.vb-reason {
  font-size: 26rpx;
  line-height: 1.6;
  opacity: 0.9;
  margin-top: 14rpx;
}
.title {
  font-size: 36rpx;
  font-weight: 800;
  color: $ink;
  line-height: 1.45;
}
.remark {
  font-size: 27rpx;
  color: #5b6170;
  line-height: 1.7;
  margin-top: 16rpx;
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}
.tag {
  font-size: 22rpx;
  color: #5b6170;
  background: #f0f3f8;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
}
.section-label {
  font-size: 28rpx;
  font-weight: 700;
  color: $ink;
  padding-left: 18rpx;
  position: relative;
  margin-bottom: 20rpx;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 6rpx;
    bottom: 6rpx;
    width: 8rpx;
    border-radius: 999rpx;
    background: linear-gradient(180deg, var(--brand, #2f6bff), #6a5cff);
  }
}
.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  font-size: 27rpx;
  border-bottom: 1rpx solid $line;
  &:last-child {
    border-bottom: none;
  }
  > text:first-child {
    color: $ink-3;
  }
  > text:last-child {
    color: $ink;
    font-weight: 600;
  }
}
.hl {
  color: var(--brand, #2f6bff) !important;
}
.dist {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.dist-item {
  flex: 1;
  text-align: center;
  border-radius: 18rpx;
  padding: 20rpx 0;
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
.dist-num {
  font-size: 40rpx;
  font-weight: 800;
  display: block;
}
.dist-label {
  font-size: 22rpx;
  display: block;
  margin-top: 4rpx;
}
.no-review {
  text-align: center;
  font-size: 24rpx;
  color: $ink-3;
  padding: 40rpx 0 20rpx;
}
.review {
  padding: 24rpx 0;
  border-top: 1rpx solid $line;
}
.review-head {
  display: flex;
  align-items: center;
}
.review-who {
  flex: 1;
  margin-left: 16rpx;
}
.review-name {
  font-size: 26rpx;
  font-weight: 600;
  color: $ink;
}
.review-time {
  font-size: 21rpx;
  color: $ink-3;
  margin-top: 4rpx;
}
.review-tag {
  font-size: 21rpx;
  font-weight: 600;
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
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
.review-comment {
  font-size: 26rpx;
  color: #3b4150;
  line-height: 1.7;
  margin-top: 14rpx;
  padding-left: 72rpx;
}
.more {
  text-align: center;
  font-size: 24rpx;
  color: var(--brand, #2f6bff);
  padding: 20rpx 0 8rpx;
}
.bottom-space {
  height: 160rpx;
}
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top: 1rpx solid $line;
  padding: 18rpx 32rpx calc(18rpx + env(safe-area-inset-bottom));
  z-index: 20;
}
.action-btn {
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, var(--brand, #2f6bff), #6a5cff);
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}
.action-tip {
  text-align: center;
  font-size: 25rpx;
  color: $ink-3;
  padding: 22rpx 0;
}
.empty {
  margin-top: 120rpx;
  text-align: center;
  background: #fff;
  border-radius: 28rpx;
  padding: 80rpx 40rpx;
}
.empty-title {
  font-size: 30rpx;
  color: $ink;
}
.empty-btn {
  display: inline-block;
  margin-top: 26rpx;
  padding: 14rpx 36rpx;
  border-radius: 999rpx;
  background: var(--brand-soft, #eef3ff);
  color: var(--brand, #2f6bff);
  font-size: 26rpx;
}
</style>
