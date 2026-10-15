import { API_BASE, USE_LOCAL_FALLBACK } from '@/config';
import { runPlan } from '@/utils/engine';
import type { CalcParams, CalcResult, CarPriceResult } from '@/types/car';

function request<T>(path: string, data: any): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: API_BASE + path,
      method: 'POST',
      data,
      header: { 'content-type': 'application/json' },
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data as T);
        else reject(new Error('HTTP ' + res.statusCode));
      },
      fail: (err: any) => reject(err),
    });
  });
}

export async function queryCarPrice(keyword: string): Promise<CarPriceResult> {
  return request<CarPriceResult>('/api/queryCarPrice', { keyword });
}

export async function calcPlan(params: CalcParams): Promise<CalcResult> {
  try {
    return await request<CalcResult>('/api/calcPlan', params);
  } catch (e) {
    if (USE_LOCAL_FALLBACK) {
      // 离线兜底：直接本地计算引擎
      return runPlan(params);
    }
    throw e;
  }
}
