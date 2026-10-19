// 本地搜索历史：基于 uni 存储，最多保留 12 条。
// 注意：仅“新”车型会追加到列表最前；已存在的车型不被重排（避免切换时顺序跳动）。
const KEY = 'car_search_history';
const MAX = 12;

export function getHistory(): string[] {
  try {
    const v = uni.getStorageSync(KEY);
    return Array.isArray(v) ? (v.filter((x) => typeof x === 'string') as string[]) : [];
  } catch {
    return [];
  }
}

export function addHistory(kw: string): void {
  const k = kw.trim();
  if (!k) return;
  const list = getHistory();
  if (list.includes(k)) {
    // 已存在：保持原有位置，不移动到列表第一个
    return;
  }
  list.unshift(k);
  if (list.length > MAX) list.length = MAX;
  try {
    uni.setStorageSync(KEY, list);
  } catch {
    /* 忽略存储异常（如隐私模式 / 配额已满） */
  }
}

export function clearHistory(): void {
  try {
    uni.removeStorageSync(KEY);
  } catch {
    /* noop */
  }
}
