import { reactive } from 'vue';
import type { CarPrice, CalcParams, CalcResult } from '@/types/car';
import type { UserInfo } from '@/types/social';

// 跨页面共享的会话状态（轻量 store，无需引入 Pinia）。
export const store = reactive({
  car: null as CarPrice | null,
  options: [] as CarPrice[],
  isReference: false,
  params: null as CalcParams | null,
  result: null as CalcResult | null,

  // 用户态
  user: null as UserInfo | null,
  loginReady: false,
  loginError: '',

  // 发布/删除后置为 true，广场与我的页面在 onShow 时据此刷新
  postsDirty: false,
});
