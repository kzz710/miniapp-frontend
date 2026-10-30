/**
 * 多应用配置（轻量映射，替代笨重的配置矩阵）
 *
 * 每个应用一套 profile，由构建时注入的编译期常量 MP_APP 选择。
 * 新增应用：在 build/<app>/ 放 app.json（声明 platform）+ 这里加一条记录即可。
 *
 * 注意：这里的字段在「编译期」就被 MP_APP 选定并摇树，运行时不会把所有应用都打进包。
 */
import { MP_APP } from '@/utils/mpApp'

export interface AppProfile {
  /** 应用标识，与 build/<app>/ 目录名、MP_APP 一致 */
  key: string
  /** 品牌名（首页 hero / 分享文案使用） */
  brandName: string
  /** 主题主色（hero 渐变、主按钮） */
  themeColor: string
  /** 主题辅色（hero 渐变） */
  themeColor2: string
  /** 生产环境后端域名（HTTPS），用于 API 与分享图地址 */
  prodDomain: string
  /** 功能开关：按需裁剪/开启 */
  features: {
    history: boolean
    share: boolean
  }
}

/** 默认 profile：直接 npm run dev/build（未按变体构建）时回退到此 */
export const DEFAULT_PROFILE: AppProfile = {
  key: '',
  brandName: '买车么',
  themeColor: '#2F6BFF',
  themeColor2: '#6A5CFF',
  prodDomain: 'https://kzzmyself.cn',
  features: { history: true, share: true },
}

/** 各应用 profile 表（key 与 build/<app>/ 目录名一致） */
export const PROFILES: Record<string, AppProfile> = {
  // —— 微信小程序 ——
  'weixin-cs': {
    key: 'weixin-cs',
    brandName: '划算买车',
    themeColor: '#FF6B2F',
    themeColor2: '#FF9A5C',
    prodDomain: 'https://kzzmyself.cn',
    features: { history: true, share: true },
  },
  'weixin-mcm': {
    key: 'weixin-mcm',
    brandName: '买车么',
    themeColor: '#2F6BFF',
    themeColor2: '#6A5CFF',
    prodDomain: 'https://kzzmyself.cn',
    features: { history: true, share: true },
  },
  // —— 头条小程序 ——
  'toutiao-a': {
    key: 'toutiao-a',
    brandName: '买车么头条',
    themeColor: '#FE2C55',
    themeColor2: '#FF5C8A',
    prodDomain: 'https://kzzmyself.cn',
    features: { history: true, share: true },
  },
  'toutiao-b': {
    key: 'toutiao-b',
    brandName: '懂车价',
    themeColor: '#1AAD19',
    themeColor2: '#3FD07A',
    prodDomain: 'https://kzzmyself.cn',
    features: { history: false, share: true },
  },
  // —— H5 项目 ——
  'h5-a': {
    key: 'h5-a',
    brandName: '买车么',
    themeColor: '#2F6BFF',
    themeColor2: '#6A5CFF',
    prodDomain: 'https://kzzmyself.cn',
    features: { history: true, share: true },
  },
  'h5-b': {
    key: 'h5-b',
    brandName: '划算买车',
    themeColor: '#FF6B2F',
    themeColor2: '#FF9A5C',
    prodDomain: 'https://kzzmyself.cn',
    features: { history: true, share: true },
  },
}

/** 按 MP_APP 取当前应用 profile（未知应用回退默认） */
export function getProfile(app: string = MP_APP): AppProfile {
  return PROFILES[app] || DEFAULT_PROFILE
}
