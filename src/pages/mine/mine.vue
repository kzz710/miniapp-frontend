<template>
  <view class="page">
    <view class="profile">
      <view class="profile-main">
        <AvatarBadge
          :text="user?.avatar_text || '车'"
          :color="user?.avatar_color || '#2F6BFF'"
          :size="120"
        />
        <view class="profile-info">
          <view class="name-row">
            <text class="name">{{ user?.username || '未登录' }}</text>
            <text v-if="user" class="edit" @tap="openRename">修改</text>
          </view>
          <view class="uid" v-if="user">{{ user.user_id }}</view>
          <view class="joined" v-if="user">加入于 {{ formatDate(user.created_at) }}</view>
        </view>
      </view>

      <view v-if="loginError" class="login-tip">
        {{ loginError }}
        <text class="retry" @tap="retryLogin">重试</text>
      </view>
    </view>

    <view class="stats">
      <view class="stat">
        <view class="stat-num">{{ summary.post_count }}</view>
        <view class="stat-label">我的发布</view>
      </view>
      <view class="stat-line"></view>
      <view class="stat">
        <view class="stat-num">{{ summary.received_review_count }}</view>
        <view class="stat-label">收到审批</view>
      </view>
    </view>

    <view class="menu">
      <view class="menu-item" @tap="goMyPosts">
        <text class="menu-ico">📋</text>
        <view class="menu-body">
          <view class="menu-title">我的发布</view>
          <view class="menu-sub">查看、管理我发布的买车计划</view>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @tap="goSquare">
        <text class="menu-ico">🧭</text>
        <view class="menu-body">
          <view class="menu-title">去广场看看</view>
          <view class="menu-sub">帮别人把把关，也参考别人的选择</view>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view class="tip">提示：用户名由系统分配，可自行修改；头像取用户名首字。</view>

    <view v-if="renameVisible" class="mask" @tap="renameVisible = false">
      <view class="dialog" @tap.stop>
        <view class="dlg-title">修改用户名</view>
        <input
          class="dlg-input"
          v-model="newName"
          :maxlength="16"
          placeholder="2~16 个中文、字母、数字或下划线"
          placeholder-class="ph"
        />
        <view class="dlg-tip">保存后头像文字会更新为新用户名首字，userId 与头像底色不变。</view>
        <view class="dlg-btns">
          <button class="dlg-btn" @tap="renameVisible = false">取消</button>
          <button class="dlg-btn primary" :loading="saving" @tap="submitRename">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import AvatarBadge from '@/components/AvatarBadge.vue';
import { useAuth } from '@/composables/useAuth';
import { fetchSummary } from '@/api/posts';
import { updateUsername } from '@/api/auth';
import { setCachedUser } from '@/api/request';
import { store } from '@/store';
import { formatDate } from '@/utils/time';
import type { UserSummary } from '@/types/social';

const { ensureLogin, reloadUser } = useAuth();
const user = computed(() => store.user);
const loginError = computed(() => store.loginError);

const summary = ref<UserSummary>({ post_count: 0, received_review_count: 0 });
const renameVisible = ref(false);
const newName = ref('');
const saving = ref(false);

async function loadSummary() {
  if (!store.user) return;
  try {
    summary.value = await fetchSummary();
  } catch {
    /* 静默失败 */
  }
}

function openRename() {
  newName.value = store.user?.username || '';
  renameVisible.value = true;
}

async function submitRename() {
  const name = newName.value.trim();
  if (name.length < 2) {
    uni.showToast({ title: '用户名至少 2 个字符', icon: 'none' });
    return;
  }
  saving.value = true;
  try {
    const updated = await updateUsername(name);
    setCachedUser(updated);
    store.user = updated;
    renameVisible.value = false;
    uni.showToast({ title: '修改成功', icon: 'success' });
  } catch (err) {
    uni.showToast({ title: (err as Error)?.message || '修改失败', icon: 'none' });
  } finally {
    saving.value = false;
  }
}

async function retryLogin() {
  const ok = await ensureLogin(true);
  if (ok) {
    await reloadUser();
    loadSummary();
  }
}

function goMyPosts() {
  if (!store.user) {
    uni.showToast({ title: '正在登录，请稍后', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: '/pages/mine/posts' });
}

function goSquare() {
  uni.switchTab({ url: '/pages/square/square' });
}

onShow(async () => {
  await ensureLogin();
  if (store.user) {
    await reloadUser();
    loadSummary();
  }
});
</script>

<style scoped lang="scss">
$ink: #16181d;
$ink-3: #9aa0ae;
$brand: #2f6bff;
$brand-2: #6a5cff;
$line: rgba(20, 30, 60, 0.07);
.page {
  padding: 32rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
  min-height: 100vh;
  box-sizing: border-box;
}
.profile {
  background: linear-gradient(135deg, $brand 0%, $brand-2 100%);
  border-radius: 28rpx;
  padding: 40rpx 36rpx;
  color: #fff;
  box-shadow: 0 16rpx 40rpx rgba(47, 107, 255, 0.26);
}
.profile-main {
  display: flex;
  align-items: center;
}
.profile-info {
  margin-left: 24rpx;
  min-width: 0;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.name {
  font-size: 40rpx;
  font-weight: 800;
}
.edit {
  font-size: 20rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}
.uid {
  font-size: 24rpx;
  opacity: 0.88;
  margin-top: 8rpx;
}
.joined {
  font-size: 22rpx;
  opacity: 0.78;
  margin-top: 6rpx;
}
.login-tip {
  margin-top: 20rpx;
  font-size: 22rpx;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 14rpx;
  padding: 14rpx 18rpx;
}
.retry {
  margin-left: 14rpx;
  font-weight: 700;
  text-decoration: underline;
}
.stats {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 28rpx;
  padding: 32rpx 0;
  margin-top: 24rpx;
  border: 1rpx solid $line;
  box-shadow: 0 8rpx 30rpx rgba(20, 30, 60, 0.05);
}
.stat {
  flex: 1;
  text-align: center;
}
.stat-num {
  font-size: 44rpx;
  font-weight: 800;
  color: $ink;
}
.stat-label {
  font-size: 24rpx;
  color: $ink-3;
  margin-top: 8rpx;
}
.stat-line {
  width: 1rpx;
  height: 56rpx;
  background: $line;
}
.menu {
  background: #fff;
  border-radius: 28rpx;
  margin-top: 24rpx;
  border: 1rpx solid $line;
  overflow: hidden;
}
.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx 28rpx;
  border-bottom: 1rpx solid $line;
  &:last-child {
    border-bottom: none;
  }
}
.menu-ico {
  font-size: 36rpx;
  margin-right: 20rpx;
}
.menu-body {
  flex: 1;
}
.menu-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $ink;
}
.menu-sub {
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 6rpx;
}
.menu-arrow {
  font-size: 40rpx;
  color: #c9ced8;
}
.tip {
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 24rpx;
  text-align: center;
  line-height: 1.6;
}
.mask {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 25, 0.45);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 48rpx;
}
.dialog {
  width: 100%;
  background: #fff;
  border-radius: 28rpx;
  padding: 36rpx 32rpx;
}
.dlg-title {
  font-size: 34rpx;
  font-weight: 700;
  color: $ink;
}
.dlg-input {
  margin-top: 24rpx;
  height: 88rpx;
  background: #f4f6fa;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: $ink;
}
.dlg-tip {
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 16rpx;
  line-height: 1.6;
}
.dlg-btns {
  display: flex;
  gap: 20rpx;
  margin-top: 28rpx;
}
.dlg-btn {
  flex: 1;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  background: #eef1f6;
  color: #5b6170;
  &.primary {
    background: linear-gradient(135deg, $brand, $brand-2);
    color: #fff;
  }
}
</style>
