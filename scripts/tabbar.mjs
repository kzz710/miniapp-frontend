#!/usr/bin/env node
/**
 * tabBar 图标生成器（零依赖，纯 Node）
 *
 * 为什么需要它：小程序 tabBar 的图标是静态 PNG，无法用 CSS 变量着色，
 * 而本项目一套源码要产出多个品牌色不同的应用。手工维护 6 套 PNG 会让
 * 图标颜色与 src/profiles.ts 逐渐失配（此前 weixin-cs 就踩过键名不一致的坑）。
 * 这里改成「构建时按主题色实时生成」：
 *   - 单一数据源：src/profiles.ts 的 themeColor
 *   - 生成物不入库：apply 时写入 src/static/tabbar/，restore 时自动还原
 *   - 零依赖：zlib 手写 PNG 编码 + 4 倍超采样抗锯齿几何绘制
 *
 * 图标为 81x81 RGBA 线性图标：home（房子）/ square（四格广场）/ user（人像）。
 * normal 用中性灰 #9BA2B0（对齐 App.vue 的 $ink-3），selected 用应用主题色。
 *
 * CLI:
 *   node scripts/tabbar.mjs baseline              重绘 src/static/tabbar 基线（默认蓝）
 *   node scripts/tabbar.mjs app <app> [outDir]    按应用主题色生成到指定目录
 *   node scripts/tabbar.mjs all [outRoot]         为所有应用生成 + 可视预览页
 *   node scripts/tabbar.mjs theme <app>           打印应用主题色
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PROFILES_FILE = path.join(ROOT, 'src', 'profiles.ts')
const APP_ROOT = path.join(ROOT, 'build')
const BASE_TABBAR_DIR = path.join(ROOT, 'src', 'static', 'tabbar')

export const ICON_SIZE = 81
export const NORMAL_COLOR = '#9BA2B0'
export const DEFAULT_ACTIVE_COLOR = '#2F6BFF'
export const ICON_FILES = [
  'home.png',
  'home-on.png',
  'square.png',
  'square-on.png',
  'user.png',
  'user-on.png',
]

const SS = 4 // 超采样倍数（抗锯齿）
const SHAPE_NAMES = ['home', 'square', 'user']

// ---------------------------------------------------------------------------
// 主题色表：直接读 src/profiles.ts，避免维护第二份颜色配置
// ---------------------------------------------------------------------------
export function readThemeMap() {
  const src = fs.readFileSync(PROFILES_FILE, 'utf8')
  const map = {}
  // 每个 profile 块形如：key: 'weixin-cs', ... themeColor: '#FF6B2F', ...
  const re = /key:\s*['"]([^'"]+)['"][\s\S]*?themeColor:\s*['"](#[0-9a-fA-F]{3,8})['"]/g
  let m
  while ((m = re.exec(src))) {
    map[m[1]] = m[2]
  }
  return map
}

export function resolveThemeColor(app, override = '') {
  if (override && /^#[0-9a-fA-F]{3,8}$/.test(override)) return override
  return readThemeMap()[app] || DEFAULT_ACTIVE_COLOR
}

export function listApps() {
  if (!fs.existsSync(APP_ROOT)) return []
  return fs
    .readdirSync(APP_ROOT)
    .filter((n) => !n.startsWith('.'))
    .filter((n) => fs.statSync(path.join(APP_ROOT, n)).isDirectory())
    .filter((n) => fs.existsSync(path.join(APP_ROOT, n, 'app.json')))
}

// ---------------------------------------------------------------------------
// 极简栅格器：在 4x 超采样覆盖率缓冲上「盖章」，取 max 避免叠加变深
// ---------------------------------------------------------------------------
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

function createCanvas() {
  const W = ICON_SIZE * SS
  return { W, cov: new Float32Array(W * W) }
}

function stamp(c, x0, y0, x1, y1, sdf) {
  const { W, cov } = c
  const px0 = Math.max(0, Math.floor(x0 * SS))
  const px1 = Math.min(W - 1, Math.ceil(x1 * SS))
  const py0 = Math.max(0, Math.floor(y0 * SS))
  const py1 = Math.min(W - 1, Math.ceil(y1 * SS))
  for (let py = py0; py <= py1; py++) {
    const y = (py + 0.5) / SS
    const row = py * W
    for (let px = px0; px <= px1; px++) {
      const x = (px + 0.5) / SS
      const v = sdf(x, y)
      if (v > 0 && v > cov[row + px]) cov[row + px] = v
    }
  }
}

// 带圆帽的线段（端点距离场天然形成圆头）
function line(c, x1, y1, x2, y2, w) {
  const h = w / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy || 1
  stamp(
    c,
    Math.min(x1, x2) - h - 1,
    Math.min(y1, y2) - h - 1,
    Math.max(x1, x2) + h + 1,
    Math.max(y1, y2) + h + 1,
    (x, y) => {
      const t = clamp01(((x - x1) * dx + (y - y1) * dy) / len2)
      const d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)) - h
      return clamp01(0.5 - d * SS)
    }
  )
}

function circle(c, cx, cy, r, w) {
  const h = w / 2
  stamp(
    c,
    cx - r - h - 1,
    cy - r - h - 1,
    cx + r + h + 1,
    cy + r + h + 1,
    (x, y) => {
      const d = Math.abs(Math.hypot(x - cx, y - cy) - r) - h
      return clamp01(0.5 - d * SS)
    }
  )
}

function roundRect(c, x, y, w, h, r, lw) {
  const cx = x + w / 2
  const cy = y + h / 2
  const hw = w / 2
  const hh = h / 2
  const rr = Math.min(r, hw, hh)
  const dist = (px, py) => {
    const qx = Math.abs(px - cx) - (hw - rr)
    const qy = Math.abs(py - cy) - (hh - rr)
    return (
      Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
      Math.min(Math.max(qx, qy), 0) -
      rr
    )
  }
  stamp(
    c,
    x - lw - 1,
    y - lw - 1,
    x + w + lw + 1,
    y + h + lw + 1,
    (px, py) => {
      const d = Math.abs(dist(px, py) + lw / 2) - lw / 2
      return clamp01(0.5 - d * SS)
    }
  )
}

function quad(c, x0, y0, cx, cy, x1, y1, w, steps = 32) {
  let px = x0
  let py = y0
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1
    const y = u * u * y0 + 2 * u * t * cy + t * t * y1
    line(c, px, py, x, y, w)
    px = x
    py = y
  }
}

const SHAPES = {
  home(c) {
    const w = 6
    line(c, 11, 37, 40.5, 13, w) // 屋顶左
    line(c, 40.5, 13, 70, 37, w) // 屋顶右
    line(c, 20, 34, 20, 68, w) // 左墙
    line(c, 61, 34, 61, 68, w) // 右墙
    line(c, 20, 68, 61, 68, w) // 地面
    line(c, 33, 68, 33, 51, 5.5) // 门（U 形）
    line(c, 33, 51, 48, 51, 5.5)
    line(c, 48, 51, 48, 68, 5.5)
  },
  square(c) {
    for (const [x, y] of [
      [15, 15],
      [43, 15],
      [15, 43],
      [43, 43],
    ]) {
      roundRect(c, x, y, 23, 23, 6, 6)
    }
  },
  user(c) {
    circle(c, 40.5, 27, 12.5, 6)
    quad(c, 14, 66, 40.5, 28, 67, 66, 6)
  },
}

// ---------------------------------------------------------------------------
// PNG 编码（RGBA8，无第三方依赖）
// ---------------------------------------------------------------------------
let CRC_TABLE = null
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE
  CRC_TABLE = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    CRC_TABLE[n] = c >>> 0
  }
  return CRC_TABLE
}
function crc32(buf) {
  const table = crcTable()
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}
function encodePng(rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(ICON_SIZE, 0)
  ihdr.writeUInt32BE(ICON_SIZE, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  const stride = ICON_SIZE * 4
  const raw = Buffer.alloc((stride + 1) * ICON_SIZE)
  for (let y = 0; y < ICON_SIZE; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function hexToRgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

function renderIcon(name, color) {
  const c = createCanvas()
  SHAPES[name](c)
  const [r, g, b] = hexToRgb(color)
  const { W, cov } = c
  const rgba = Buffer.alloc(ICON_SIZE * ICON_SIZE * 4)
  for (let y = 0; y < ICON_SIZE; y++) {
    for (let x = 0; x < ICON_SIZE; x++) {
      let sum = 0
      for (let sy = 0; sy < SS; sy++) {
        const row = (y * SS + sy) * W + x * SS
        for (let sx = 0; sx < SS; sx++) sum += cov[row + sx]
      }
      const a = Math.round((sum / (SS * SS)) * 255)
      const i = (y * ICON_SIZE + x) * 4
      rgba[i] = r
      rgba[i + 1] = g
      rgba[i + 2] = b
      rgba[i + 3] = a
    }
  }
  return encodePng(rgba)
}

/** 生成 6 张图标到 outDir，返回文件绝对路径列表 */
export function generateIcons(outDir, activeColor = DEFAULT_ACTIVE_COLOR, normalColor = NORMAL_COLOR) {
  fs.mkdirSync(outDir, { recursive: true })
  const written = []
  for (const name of SHAPE_NAMES) {
    for (const [suffix, color] of [
      ['', normalColor],
      ['-on', activeColor],
    ]) {
      const file = path.join(outDir, `${name}${suffix}.png`)
      fs.writeFileSync(file, renderIcon(name, color))
      written.push(file)
    }
  }
  return written
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function writePreviewIndex(outRoot, apps, themes) {
  const sections = apps
    .map((app) => {
      const color = themes[app] || DEFAULT_ACTIVE_COLOR
      const cells = SHAPE_NAMES.map(
        (n) =>
          `<div class="cell"><div class="pair"><img src="${app}/${n}.png" alt=""><img src="${app}/${n}-on.png" alt=""></div><span>${n}</span></div>`
      ).join('')
      return `<section><h3>${app}<code>${color}</code></h3><div class="row">${cells}</div></section>`
    })
    .join('')
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>tabBar 图标 · 各应用主题色</title>
<style>
body{margin:0;padding:32px;background:#f7f8fb;color:#111318;font:14px/1.5 -apple-system,"PingFang SC","Microsoft YaHei",sans-serif}
h2{font-size:22px;margin:0 0 6px}p.sub{color:#5a6070;margin:0 0 28px}
section{background:#fff;border-radius:18px;padding:20px 24px;margin-bottom:16px;box-shadow:0 8px 28px rgba(17,20,28,.05)}
h3{font-size:15px;margin:0 0 16px;display:flex;align-items:center;gap:10px}
code{font-size:12px;color:#5a6070;background:#f2f4f8;padding:3px 8px;border-radius:6px;font-weight:400}
.row{display:flex;gap:40px}.cell{text-align:center}.pair{display:flex;gap:18px;align-items:center}
img{width:44px;height:44px;display:block}.cell span{display:block;margin-top:8px;color:#9ba2b0;font-size:12px}
</style></head><body><h2>tabBar 图标 · 各应用主题色</h2>
<p class="sub">每格左为未选中（中性灰 #9BA2B0），右为选中（应用主题色）。由 scripts/tabbar.mjs 按 src/profiles.ts 实时生成。</p>
${sections}</body></html>`
  fs.writeFileSync(path.join(outRoot, 'index.html'), html, 'utf8')
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2)
  const themes = readThemeMap()
  switch (cmd) {
    case 'theme':
      console.log(themes[rest[0]] || DEFAULT_ACTIVE_COLOR)
      return
    case 'baseline': {
      const out = rest[0] || BASE_TABBAR_DIR
      generateIcons(out, DEFAULT_ACTIVE_COLOR)
      console.log(`[tabbar] 基线图标已重绘：${out}`)
      return
    }
    case 'app': {
      const app = rest[0]
      if (!app) {
        console.error('用法：node scripts/tabbar.mjs app <app> [outDir]')
        process.exit(1)
      }
      const out = rest[1] || path.join(APP_ROOT, app, 'static', 'tabbar')
      const color = resolveThemeColor(app)
      generateIcons(out, color)
      console.log(`[tabbar] ${app} (${color}) → ${out}`)
      return
    }
    case 'all': {
      const outRoot = rest[0] || path.join(ROOT, 'dist', 'tabbar-preview')
      const apps = listApps()
      fs.mkdirSync(outRoot, { recursive: true })
      for (const app of apps) {
        const color = themes[app] || DEFAULT_ACTIVE_COLOR
        generateIcons(path.join(outRoot, app), color)
        console.log(`[tabbar] ${app.padEnd(14)} ${color}`)
      }
      writePreviewIndex(outRoot, apps, themes)
      console.log(`[tabbar] 预览页：${path.join(outRoot, 'index.html')}`)
      return
    }
    default:
      console.log('用法：node scripts/tabbar.mjs <baseline|app|all|theme> ...')
  }
}

const invokedAsScript =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (invokedAsScript) main()
