<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useAuth } from "@/composables/useAuth";

const { ensureLogin } = useAuth();

onLaunch(() => {
  console.log("App Launch");
  // 启动即静默登录；失败不阻塞查价与测算，广场/我的页面会提示重试
  ensureLogin().catch(() => undefined);
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
// ============================================================
// 设计系统「BOLD / 精简大字报」
// 年轻 · 精简 · 美观 · 大气
//
// 设计原则：
//  1) 背景纯净、留白充足，靠「排版层级」而非色块/边框划分信息
//  2) 品牌色只做点睛（主按钮 / 关键数字 / 选中态），不铺满屏幕
//  3) 数字是本产品的主角，用超大字号 + 800 字重 + 等宽数字
//  4) 去边框、大圆角、分层柔光阴影；统一 8rpx 间距节奏
//  5) 强调色由 .page 上的 CSS 变量运行时注入，适配多应用品牌
// ============================================================
$bg: #f7f8fb;
$surface: #ffffff;
$ink: #111318;
$ink-2: #5a6070;
$ink-3: #9ba2b0;
$line: rgba(17, 20, 28, 0.07);
$brand: #2f6bff;
$brand-2: #6a5cff;
$brand-soft: #eef3ff;

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
button,
textarea {
  box-sizing: border-box;
}
button::after {
  border: none;
}

// 页面容器：纯净底色 + 大留白（大气 / 精简）
.page {
  padding: 44rpx 36rpx calc(56rpx + env(safe-area-inset-bottom));
  background: $bg;
  min-height: 100vh;
  box-sizing: border-box;
}

// —— 大标题区（替代满屏渐变 hero，更年轻、更克制）——
.intro {
  padding: 8rpx 4rpx 32rpx;
}
.eyebrow {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: var(--brand, $brand);
  font-weight: 600;
  letter-spacing: 1rpx;
  margin-bottom: 22rpx;
}
.eyebrow-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: currentColor;
  margin-right: 12rpx;
}
.intro-title {
  font-size: 72rpx;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -1rpx;
  color: $ink;
}
.intro-title .accent {
  color: var(--brand, $brand);
}
.intro-sub {
  font-size: 27rpx;
  color: $ink-3;
  margin-top: 18rpx;
  line-height: 1.6;
}

// —— 超大数字（价格 / 月供等，本产品的视觉锚点）——
.display-num {
  font-size: 104rpx;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -3rpx;
  color: $ink;
  font-variant-numeric: tabular-nums;
}
.display-unit {
  font-size: 30rpx;
  font-weight: 600;
  color: $ink-3;
  margin-left: 10rpx;
  letter-spacing: 0;
}

// 渐变英雄头图（保留给独立应用首屏使用）
.hero {
  background: linear-gradient(135deg, var(--brand, $brand) 0%, var(--brand-2, $brand-2) 100%);
  border-radius: 32rpx;
  padding: 52rpx 40rpx 56rpx;
  margin-bottom: 28rpx;
  color: #fff;
  box-shadow: 0 20rpx 44rpx -14rpx var(--brand-glow, rgba(47, 107, 255, 0.32));
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: "";
  position: absolute;
  right: -56rpx;
  top: -56rpx;
  width: 240rpx;
  height: 240rpx;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 50%;
}
.hero::before {
  content: "";
  position: absolute;
  right: 70rpx;
  bottom: -86rpx;
  width: 170rpx;
  height: 170rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
.hero-badge {
  display: inline-block;
  font-size: 22rpx;
  padding: 8rpx 18rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999rpx;
  margin-bottom: 22rpx;
}
.hero-title {
  font-size: 60rpx;
  font-weight: 800;
  letter-spacing: 1rpx;
  line-height: 1.12;
}
.hero-sub {
  font-size: 26rpx;
  opacity: 0.92;
  margin-top: 14rpx;
  line-height: 1.5;
}

// 卡片：纯白 / 大圆角 / 无边框 / 分层柔光
.card {
  background: $surface;
  border-radius: 32rpx;
  padding: 36rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 10rpx 30rpx -14rpx rgba(17, 24, 39, 0.16),
    0 2rpx 8rpx rgba(17, 24, 39, 0.03);
}

// 区块小标题：细竖条 + 紧凑留白
.section-label {
  font-size: 27rpx;
  font-weight: 700;
  color: $ink;
  padding-left: 18rpx;
  position: relative;
  margin-bottom: 26rpx;
}
.section-label::before {
  content: "";
  position: absolute;
  left: 0;
  top: 6rpx;
  bottom: 6rpx;
  width: 6rpx;
  border-radius: 999rpx;
  background: linear-gradient(180deg, var(--brand, $brand), var(--brand-2, $brand-2));
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
  color: var(--brand, $brand) !important;
  font-weight: 700 !important;
}
.ph {
  color: #b9bfca;
}

// 输入：浅灰底 / 大圆角 / 聚焦品牌色光环
.input {
  background: #f2f4f8;
  border: 2rpx solid transparent;
  border-radius: 18rpx;
  padding: 22rpx 26rpx;
  font-size: 30rpx;
  color: $ink;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
}
.input:focus {
  border-color: var(--brand, $brand);
  background: #fff;
  box-shadow: 0 0 0 4rpx var(--brand-soft, $brand-soft);
}

// 搜索框
.search {
  display: flex;
  align-items: center;
  background: #f2f4f8;
  border-radius: 20rpx;
  padding: 0 26rpx;
  border: 2rpx solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.search:focus-within {
  border-color: var(--brand, $brand);
  box-shadow: 0 0 0 4rpx var(--brand-soft, $brand-soft);
}
.search-ico {
  font-size: 32rpx;
  margin-right: 16rpx;
  opacity: 0.45;
}
.search-input {
  flex: 1;
  height: 96rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: $ink;
}

// 按钮：品牌渐变 + 发光 + 按压缩放
.btn {
  margin-top: 24rpx;
  height: 96rpx;
  line-height: 96rpx;
  border-radius: 22rpx;
  font-size: 31rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  background: #eef1f6;
  color: $ink-2;
  text-align: center;
  transition: transform 0.12s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}
.btn:active {
  transform: scale(0.975);
  opacity: 0.92;
}
.btn.primary {
  background: linear-gradient(135deg, var(--brand, $brand) 0%, var(--brand-2, $brand-2) 100%);
  color: #fff;
  box-shadow: 0 16rpx 32rpx -10rpx var(--brand-glow, rgba(47, 107, 255, 0.32));
}
.btn.primary:active {
  transform: scale(0.975);
}
.btn[loading],
.btn.primary[loading] {
  opacity: 0.7;
}

// 胶囊标签
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 18rpx;
}
.chip {
  padding: 14rpx 26rpx;
  background: #f0f3f8;
  border: 1rpx solid transparent;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: $ink-2;
  transition: all 0.15s ease;
}
.chip:active {
  transform: scale(0.96);
}
.chip.active {
  background: var(--brand-soft, $brand-soft);
  color: var(--brand, $brand);
  border-color: var(--brand-line, rgba(47, 107, 255, 0.35));
  font-weight: 600;
}

// 表单字段
.field {
  margin-top: 26rpx;
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
  padding: 24rpx 0;
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
  line-height: 1.6;
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
