/**
 * 主题色运行时注入
 *
 * 把当前应用的 themeColor / themeColor2 转成一组 CSS 自定义属性，绑定到页面根节点
 * .page 上，使「全局样式」与「组件」都能随品牌色变化——蓝 / 橙 / 红 / 绿各应用
 * 套用同一套设计语言，而不会出现全局强调色仍是默认蓝的不一致问题。
 *
 * 用法：在页面里 <view class="page" :style="themeVars">，全局 .btn.primary、
 * .section-label、.chip.active 等即可自动取色。
 */
import { getProfile, type AppProfile } from '@/profiles'
import { MP_APP } from '@/utils/mpApp'

/** #RGB / #RRGGBB → rgba(...) 字符串 */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = parseInt(full.substring(0, 2), 16)
  const g = parseInt(full.substring(2, 4), 16)
  const b = parseInt(full.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export interface AppTheme {
  /** 当前应用 profile（品牌名 / 主题色 / 域名 / 功能开关） */
  app: AppProfile
  /** 绑定到 .page 根节点的 CSS 变量集合 */
  themeVars: Record<string, string>
}

export function useAppTheme(): AppTheme {
  const app = getProfile(MP_APP)
  const themeVars = {
    '--brand': app.themeColor,
    '--brand-2': app.themeColor2,
    // 浅色底（chip 选中 / 输入框聚焦光环）
    '--brand-soft': hexToRgba(app.themeColor, 0.1),
    // 页面顶部极淡染（大气留白）
    '--brand-tint': hexToRgba(app.themeColor, 0.06),
    // 主按钮发光阴影
    '--brand-glow': hexToRgba(app.themeColor, 0.28),
    // 描边 / 分隔用的半透明品牌色
    '--brand-line': hexToRgba(app.themeColor, 0.35),
  }
  return { app, themeVars }
}
