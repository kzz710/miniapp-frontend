<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
// ===== 买车决策小程序 · 全局设计系统（SCSS） =====
$brand: #2F6BFF;
$brand-2: #6A5CFF;
$brand-soft: #EEF3FF;
$ink: #16181D;
$ink-2: #5B6170;
$ink-3: #9AA0AE;
$bg: #F2F4F8;
$surface: #FFFFFF;
$line: rgba(20, 30, 60, 0.07);

page {
  background-color: $bg;
  color: $ink;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC",
    "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}
view,
text,
input,
button {
  box-sizing: border-box;
}
/* 去掉 uni-app button 默认的边框 */
button::after {
  border: none;
}

// 页面容器
.page {
  padding: 32rpx 32rpx calc(48rpx + env(safe-area-inset-bottom));
  background: $bg;
  min-height: 100vh;
  box-sizing: border-box;
}

// 渐变英雄头图
.hero {
  background: linear-gradient(135deg, $brand 0%, $brand-2 100%);
  border-radius: 28rpx;
  padding: 44rpx 36rpx 48rpx;
  margin-bottom: 28rpx;
  color: #fff;
  box-shadow: 0 16rpx 40rpx rgba(47, 107, 255, 0.28);
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: "";
  position: absolute;
  right: -70rpx;
  top: -70rpx;
  width: 260rpx;
  height: 260rpx;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 50%;
}
.hero-badge {
  display: inline-block;
  font-size: 22rpx;
  padding: 8rpx 18rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999rpx;
  margin-bottom: 22rpx;
}
.hero-title {
  font-size: 52rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
}
.hero-sub {
  font-size: 26rpx;
  opacity: 0.92;
  margin-top: 12rpx;
}

// 卡片
.card {
  background: $surface;
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(20, 30, 60, 0.06);
  border: 1rpx solid $line;
}

// 区块小标题（带强调色条）
.section-label {
  font-size: 28rpx;
  font-weight: 600;
  color: $ink;
  padding-left: 18rpx;
  position: relative;
  margin-bottom: 24rpx;
}
.section-label::before {
  content: "";
  position: absolute;
  left: 0;
  top: 6rpx;
  bottom: 6rpx;
  width: 8rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, $brand, $brand-2);
}

// 文本
.label {
  font-size: 24rpx;
  color: $ink-3;
  margin-bottom: 16rpx;
}
.muted {
  color: $ink-3;
}
.hl {
  color: $brand !important;
  font-weight: 700 !important;
}
.ph {
  color: #b5bac6;
}

// 输入
.input {
  background: #f4f6fa;
  border: 1rpx solid transparent;
  border-radius: 16rpx;
  padding: 22rpx 24rpx;
  font-size: 30rpx;
  color: $ink;
  transition: border-color 0.2s, background 0.2s;
}
.input:focus {
  border-color: $brand;
  background: #fff;
}

// 搜索框
.search {
  display: flex;
  align-items: center;
  background: #f4f6fa;
  border-radius: 16rpx;
  padding: 0 24rpx;
  border: 1rpx solid $line;
}
.search-ico {
  font-size: 30rpx;
  margin-right: 14rpx;
  opacity: 0.5;
}
.search-input {
  flex: 1;
  height: 88rpx;
  font-size: 30rpx;
  color: $ink;
}

// 按钮
.btn {
  margin-top: 24rpx;
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 18rpx;
  font-size: 30rpx;
  font-weight: 600;
  background: #eef1f6;
  color: $ink-2;
  text-align: center;
  transition: transform 0.12s, opacity 0.2s;
}
.btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}
.btn.primary {
  background: linear-gradient(135deg, $brand 0%, $brand-2 100%);
  color: #fff;
  box-shadow: 0 12rpx 28rpx rgba(47, 107, 255, 0.32);
}
.btn[loading],
.btn.primary[loading] {
  opacity: 0.7;
}

// 标签 chips
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 16rpx;
}
.chip {
  padding: 14rpx 24rpx;
  background: #f0f3f8;
  border: 1rpx solid transparent;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: $ink-2;
  transition: all 0.15s;
}
.chip:active {
  transform: scale(0.96);
}
.chip.active {
  background: $brand-soft;
  color: $brand;
  border-color: rgba(47, 107, 255, 0.35);
  font-weight: 600;
}

// 表单字段
.field {
  margin-top: 24rpx;
}
.f-label {
  font-size: 26rpx;
  color: $ink-2;
  display: block;
  margin-bottom: 14rpx;
}

// 明细行
.row,
.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 22rpx 0;
  font-size: 28rpx;
  border-bottom: 1rpx solid $line;
}
.row:last-child,
.price-row:last-child {
  border-bottom: none;
}
.row > text:first-child,
.price-row > text:first-child {
  color: $ink-3;
}
.row > text:last-child:not(.hl),
.price-row > text:last-child:not(.hl) {
  color: $ink;
  font-weight: 600;
}

// 来源 / 提示
.src,
.tip {
  font-size: 22rpx;
  color: $ink-3;
  margin-top: 16rpx;
}
.tip {
  color: #f5a524;
}

// 底部双按钮
.btns {
  display: flex;
  gap: 20rpx;
  margin-top: 8rpx;
}
.btns .btn {
  flex: 1;
  margin-top: 8rpx;
}
</style>
