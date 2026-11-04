// 登录态管理：启动静默登录、刷新用户信息。
import { store } from '@/store';
import { getCachedUser, getToken, refreshLogin } from '@/api/request';
import { fetchMe } from '@/api/auth';

export function useAuth() {
  async function ensureLogin(force = false): Promise<boolean> {
    if (!force && store.user && getToken()) {
      store.loginReady = true;
      return true;
    }
    try {
      const cached = getCachedUser();
      if (!force && cached && getToken()) {
        store.user = cached;
      }
      const res = await refreshLogin();
      store.user = res.user;
      store.loginReady = true;
      store.loginError = '';
      return true;
    } catch (err) {
      store.loginReady = false;
      store.loginError = (err as Error)?.message || '登录失败';
      return false;
    }
  }

  /** 用服务端数据刷新本地用户（改名后调用）。 */
  async function reloadUser(): Promise<void> {
    try {
      store.user = await fetchMe();
    } catch {
      /* 静默失败，保持旧值 */
    }
  }

  return { ensureLogin, reloadUser };
}
