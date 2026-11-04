// 个人信息接口（登录统一走 request.ts 的 refreshLogin）。
import { request } from './request';
import type { UserInfo } from '@/types/social';

export function fetchMe(): Promise<UserInfo> {
  return request<UserInfo>('/api/users/me', undefined, 'GET');
}

export function updateUsername(username: string): Promise<UserInfo> {
  return request<UserInfo>('/api/users/me', { username }, 'PATCH');
}
