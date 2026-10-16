// 后端地址配置（按环境 + 平台自动切换，避免发版忘改 localhost）
//
// 切换逻辑：
// - 开发期（npm run dev:*）：一律用 localhost，方便本地联调；
// - 生产小程序（build:mp-weixin）：用公网 HTTPS 域名（PROD_DOMAIN）；
// - 生产 H5（build:h5）：与后端同源，用相对路径 ''，由 nginx 反代 /api，免跨域。

// 生产环境后端公网地址（HTTPS，备案通过后的域名）。上线前把 your-domain.com 改成你的真实域名。
const PROD_DOMAIN = 'https://your-domain.com';

// 本地开发地址（开发者工具模拟器 / 真机调试用电脑局域网 IP，不能用 localhost 连真机）。
const DEV_API_BASE = 'http://localhost:8000';

// H5 生产环境：同源部署，留空走相对路径（nginx 已配 /api 反代）。
const H5_PROD_API_BASE = '';

function resolveApiBase(): string {
  const isProd = import.meta.env.PROD;
  let base = DEV_API_BASE;
  // #ifdef H5
  base = isProd ? H5_PROD_API_BASE : DEV_API_BASE;
  // #endif
  // #ifndef H5
  base = isProd ? PROD_DOMAIN : DEV_API_BASE;
  // #endif
  return base;
}

export const API_BASE = resolveApiBase();

// 后端不可用时是否用前端本地引擎兜底（保证 MVP 可用）。
export const USE_LOCAL_FALLBACK = true;
