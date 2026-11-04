// 统一请求层：注入登录态、401 自动静默重新登录并重试一次。
import { API_BASE } from '@/config';
import type { LoginResponse, UserInfo } from '@/types/social';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const DEVICE_KEY = 'device_id';

export class HttpError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function getToken(): string {
  try {
    return (uni.getStorageSync(TOKEN_KEY) as string) || '';
  } catch {
    return '';
  }
}

export function getCachedUser(): UserInfo | null {
  try {
    const v = uni.getStorageSync(USER_KEY);
    return v && typeof v === 'object' ? (v as UserInfo) : null;
  } catch {
    return null;
  }
}

export function saveAuth(res: LoginResponse): void {
  try {
    uni.setStorageSync(TOKEN_KEY, res.token);
    uni.setStorageSync(USER_KEY, res.user);
  } catch {
    /* 存储异常忽略 */
  }
}

/** 改名等场景下同步本地缓存的用户信息，避免离线时展示旧数据。 */
export function setCachedUser(user: UserInfo): void {
  try {
    uni.setStorageSync(USER_KEY, user);
  } catch {
    /* noop */
  }
}

export function clearAuth(): void {
  try {
    uni.removeStorageSync(TOKEN_KEY);
    uni.removeStorageSync(USER_KEY);
  } catch {
    /* noop */
  }
}

function extractMessage(data: unknown, statusCode: number): string {
  if (data && typeof data === 'object') {
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string } | undefined;
      if (first?.msg) return first.msg;
    }
  }
  return `请求失败（${statusCode}）`;
}

function send<T>(
  path: string,
  data: Record<string, unknown> | undefined,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  withAuth: boolean,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const header: Record<string, string> = { 'content-type': 'application/json' };
    if (withAuth) {
      const token = getToken();
      if (token) header.Authorization = `Bearer ${token}`;
    }
    uni.request({
      url: API_BASE + path,
      method: method as any,
      data: data as any,
      header,
      success: (res: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve((res.statusCode === 204 ? undefined : res.data) as T);
        } else {
          reject(new HttpError(res.statusCode, extractMessage(res.data, res.statusCode)));
        }
      },
      fail: (err: any) => {
        reject(new HttpError(0, err?.errMsg || '网络异常，请稍后重试'));
      },
    });
  });
}

/** H5 端本地设备标识（稳定、随机、不入后端身份体系）。 */
function h5DeviceId(): string {
  let id = '';
  try {
    id = (uni.getStorageSync(DEVICE_KEY) as string) || '';
  } catch {
    id = '';
  }
  if (!id) {
    id = `h5-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      uni.setStorageSync(DEVICE_KEY, id);
    } catch {
      /* noop */
    }
  }
  return id;
}

function getLoginCode(): Promise<string> {
  // #ifndef H5
  return new Promise<string>((resolve, reject) => {
    uni.login({
      success: (res: any) => {
        if (res?.code) resolve(res.code);
        else reject(new HttpError(0, '登录失败，请重试'));
      },
      fail: () => reject(new HttpError(0, '登录失败，请重试')),
    });
  });
  // #endif
  // #ifdef H5
  return Promise.reject(new HttpError(0, 'H5 请使用设备登录'));
  // #endif
}

async function doLogin(): Promise<LoginResponse> {
  // #ifdef H5
  // 浏览器端没有 wx.login，改用设备标识走匿名登录接口
  return send<LoginResponse>('/api/auth/login/h5', { device_id: h5DeviceId() }, 'POST', false);
  // #endif
  // #ifndef H5
  const code = await getLoginCode();
  return send<LoginResponse>('/api/auth/login', { code }, 'POST', false);
  // #endif
}

let pendingLogin: Promise<LoginResponse> | null = null;

/** 静默登录（小程序走 code，H5 走设备标识）。并发调用会复用同一个 Promise。 */
export function refreshLogin(): Promise<LoginResponse> {
  if (pendingLogin) return pendingLogin;
  pendingLogin = (async () => {
    try {
      const res = await doLogin();
      saveAuth(res);
      return res;
    } catch (err) {
      // 登录失败说明本地凭证已不可用，清掉避免后续请求继续携带
      clearAuth();
      throw err;
    }
  })();
  pendingLogin
    .catch(() => undefined)
    .then(() => {
      pendingLogin = null;
    });
  return pendingLogin;
}

export async function request<T>(
  path: string,
  data?: Record<string, unknown>,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
): Promise<T> {
  try {
    return await send<T>(path, data, method, true);
  } catch (err) {
    if (err instanceof HttpError && err.statusCode === 401) {
      await refreshLogin();
      return send<T>(path, data, method, true);
    }
    throw err;
  }
}
