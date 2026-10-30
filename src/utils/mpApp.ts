/**
 * 当前构建的应用变体（编译期常量）
 *
 * 数据流：npm script → scripts/mp-config.mjs 注入环境变量 UNI_MP_APP
 *        → vite.config.ts 转成 define → 这里读取
 * 编译后是字符串字面量，无关分支会被摇树移除，零运行时开销。
 *
 * 为什么需要它：uni 的条件编译（如 // #ifdef MP-WEIXIN）只能区分「平台」，
 * 同一平台下的多个变体（如微信小程序 A 与 B 都是 mp-weixin）无法用条件编译区分，
 * 只能用这个变体名常量。
 *
 * 其他平台（直接 npm run dev:mp-weixin，未按变体构建）或 H5 默认构建时，MP_APP 为空串 ''。
 *
 * 用法：
 *   import { MP_APP } from '@/utils/mpApp'
 *   if (MP_APP === 'weixin-cs') { ... }
 *
 * 更推荐用 src/config/profiles.ts 的 getProfile() 读取「整套应用配置」（品牌/主题/域名…）。
 */
//@ts-ignore
export const MP_APP = process.env.UNI_MP_APP || ''
