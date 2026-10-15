import { reactive } from 'vue';
import type { CarPrice, CalcParams, CalcResult } from '@/types/car';

// 跨页面共享的会话状态（轻量 store，无需引入 Pinia）。
export const store = reactive({
  car: null as CarPrice | null,
  options: [] as CarPrice[],
  isReference: false,
  params: null as CalcParams | null,
  result: null as CalcResult | null,
});
