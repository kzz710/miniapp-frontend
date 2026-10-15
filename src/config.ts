// 后端地址配置。
// - H5 / 微信开发者工具（模拟器）用 localhost 即可；
// - 真机调试需用电脑的局域网 IP（如 http://192.168.x.x:8000），不能用 localhost。
export const API_BASE = 'http://localhost:8000';

// 后端不可用时是否用前端本地引擎兜底（保证 MVP 可用）。
export const USE_LOCAL_FALLBACK = true;
