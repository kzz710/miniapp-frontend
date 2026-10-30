/**
 * 当前应用信息组合式函数
 *
 * 返回由编译期常量 MP_APP 选定的一套应用配置（品牌名/主题色/域名/功能开关）。
 * 因为是编译期决定，运行时不会把所有应用的配置都打进包。
 */
import { getProfile, type AppProfile } from '@/profiles'
import { MP_APP } from '@/utils/mpApp'

export function useApp(): AppProfile {
  return getProfile(MP_APP)
}
