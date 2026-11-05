#!/usr/bin/env node
/**
 * 多应用构建切换脚本（参考 mp-video-vue3/miniapp-video 的做法，精简 + 适配）
 *
 * 思路：同一套源码打包出多个应用（同一平台多个 App / 跨平台 H5）。每个应用可在
 * build/<app>/ 下提供「与该应用不同的」两份配置：
 *   1) manifest.json —— 整份覆盖 src/manifest.json（appid / 名称等）
 *   2) 页面集 —— 二选一：
 *      (a) 独立的 pages.json：整份覆盖 src/pages.json（最干净，推荐）；
 *      (b) app.json 内联 pages / subPackages / globalStyle / tabBar 字段：
 *          合并进 src/pages.json（保留 globalStyle 等其余字段）。
 *
 * 另外，脚本会按 src/profiles.ts 的应用主题色「实时重绘 tabBar 图标」并注入
 * selectedColor —— 小程序 tabBar 图标是静态 PNG，无法用 CSS 变量着色。图标由
 * scripts/tabbar.mjs 零依赖生成，构建结束后随 src/ 一起还原为基线蓝色。
 *
 * 构建前脚本把差异覆盖/合并到 src/、构建结束自动还原 src/ 基线，因此源码里永远
 * 只有一个“当前生效”的 pages.json / manifest.json，互不污染。
 *
 * 同时向 uni 注入编译期常量 UNI_MP_APP（= app 名），业务代码用它区分当前应用；
 * 并用 UNI_OUTPUT_DIR 隔离各应用产物，避免互相覆盖。
 *
 * 约定：
 *   build/
 *   ├── weixin-cs/          微信小程序 CS
 *   │   ├── app.json        # 必填：声明 platform；可内联 pages 等页面集
 *   │   └── manifest.json   # 覆盖 src/manifest.json（整份替换，改 appid/名称）
 *   ├── h5-a/               H5 项目 A（仅换肤/换域名，无需覆盖 manifest/pages）
 *   │   └── app.json
 *   └── .backup/            # 自动备份（已 gitignore）
 *
 * app.json 可选字段：
 *   themeColor  显式指定 tabBar 选中色（默认取 src/profiles.ts 的 themeColor）
 *   tabBar      覆盖/替换 tabBar 配置（可改文案、背景色、边框等）
 *
 * 命令：
 *   node scripts/mp-config.mjs list
 *   node scripts/mp-config.mjs apply <app>
 *   node scripts/mp-config.mjs restore
 *   node scripts/mp-config.mjs dev <app>   [--platform X] [-- ...]
 *   node scripts/mp-config.mjs build <app> [--platform X] [-- ...]
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import {
  readThemeMap,
  resolveThemeColor,
  generateIcons,
  ICON_FILES,
  NORMAL_COLOR,
} from './tabbar.mjs'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = path.join(ROOT, 'src')
const APP_ROOT = path.join(ROOT, 'build')
const BACKUP_DIR = path.join(APP_ROOT, '.backup')
const META_FILE = path.join(BACKUP_DIR, 'meta.json')
const PAGES_FILE = 'pages.json'
const SRC_PAGES = path.join(SRC_DIR, PAGES_FILE)
const TABBAR_DIR = path.join(SRC_DIR, 'static', 'tabbar')
const TABBAR_BACKUP = path.join(BACKUP_DIR, 'tabbar')

// 允许被 build/<app>/ 整份替换 src/ 同名文件的白名单（页面集的“整份覆盖”方式）
const OVERRIDE_FILES = [PAGES_FILE, 'manifest.json']
// 应用注册标记文件（声明 platform 等元信息，并可内联页面集 pages/subPackages/globalStyle/tabBar）
const APP_MARKER = 'app.json'

const log = {
  info: (m) => console.log(`[mp-config] ${m}`),
  warn: (m) => console.warn(`[mp-config] ${m}`),
  error: (m) => console.error(`[mp-config] ${m}`),
}

function printHelp() {
  console.log(`
用法：node scripts/mp-config.mjs <command> [app] [options]

  list                       查看 build/ 下所有可用的应用配置
  apply <app>                把 build/<app>/ 的配置应用到 src/
  restore                    还原 src/ 为基线配置（含 tabBar 图标）
  dev <app>                  应用配置并启动 uni 调试（Ctrl+C 后自动还原）
  build <app>                应用配置并执行 uni 构建（成功/失败均自动还原）

选项：
  --platform <platform>      目标平台（默认读取 build/<app>/app.json 的 platform）
  -- <args...>               透传给 uni 的额外参数，如 --watch
`)
}

// 列出 build/ 下有效的应用目录（含 app.json 注册标记）
function listApps() {
  if (!fs.existsSync(APP_ROOT)) return []
  return fs
    .readdirSync(APP_ROOT)
    .filter((n) => !n.startsWith('.'))
    .filter((n) => fs.statSync(path.join(APP_ROOT, n)).isDirectory())
    .filter((n) => fs.existsSync(path.join(APP_ROOT, n, APP_MARKER)))
}

function readMeta() {
  if (!fs.existsSync(META_FILE)) return null
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf8'))
  } catch {
    return null
  }
}

// 还原 tabBar 图标（构建时按主题色临时重绘，构建结束必须还原为基线）
function restoreTabbarIcons() {
  if (!fs.existsSync(TABBAR_BACKUP)) return false
  let count = 0
  for (const file of ICON_FILES) {
    const from = path.join(TABBAR_BACKUP, file)
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, path.join(TABBAR_DIR, file))
      count++
    }
  }
  fs.rmSync(TABBAR_BACKUP, { recursive: true, force: true })
  return count > 0
}

// 还原 src/ 为基线配置
function restore({ silent = false } = {}) {
  const iconsRestored = restoreTabbarIcons()
  const meta = readMeta()
  if (!meta || !Array.isArray(meta.files)) {
    if (fs.existsSync(BACKUP_DIR)) fs.rmSync(BACKUP_DIR, { recursive: true, force: true })
    if (!silent) {
      log.info(
        iconsRestored ? '已还原 tabBar 图标；src/ 配置当前为基线' : 'src/ 当前就是基线配置，无需还原'
      )
    }
    return iconsRestored
  }
  for (const file of meta.files) {
    const backupFile = path.join(BACKUP_DIR, file)
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, path.join(SRC_DIR, file))
    }
  }
  fs.rmSync(BACKUP_DIR, { recursive: true, force: true })
  if (!silent) log.info(`已还原为基线配置（上一次应用的是「${meta.app}」：${meta.files.join('、')}）`)
  return true
}

// tabBar.list 按 pagePath 对齐合并：基线项保留、覆盖项改字段、新增项追加
// 这样 app.json 里只写一个 tab 的文案，也不会把其余两个 tab 弄丢
function mergeTabBarList(baseList, overrideList) {
  const out = baseList.map((item) => {
    const o = overrideList.find((x) => x.pagePath === item.pagePath)
    return o ? { ...item, ...o } : item
  })
  for (const o of overrideList) {
    if (!out.some((x) => x.pagePath === o.pagePath)) out.push(o)
  }
  return out
}

// 将 build/<app>/app.json 内联的页面相关字段合并进 src/pages.json（不整份替换，保留其余字段）
function mergePagesFromMarker(marker) {
  if (!fs.existsSync(SRC_PAGES)) return false
  let base
  try {
    base = JSON.parse(fs.readFileSync(SRC_PAGES, 'utf8'))
  } catch {
    return false
  }
  let changed = false
  if (Array.isArray(marker.pages)) {
    base.pages = marker.pages
    changed = true
  }
  if (Array.isArray(marker.subPackages)) {
    base.subPackages = marker.subPackages
    changed = true
  }
  if (marker.globalStyle) {
    base.globalStyle = marker.globalStyle
    changed = true
  }
  if (marker.tabBar) {
    // tabBar 按字段合并；list 交给 mergeTabBarList，避免只改文案时丢图标路径 / 丢 tab
    const baseBar = base.tabBar || {}
    base.tabBar = { ...baseBar, ...marker.tabBar }
    if (Array.isArray(marker.tabBar.list)) {
      base.tabBar.list = mergeTabBarList(
        Array.isArray(baseBar.list) ? baseBar.list : [],
        marker.tabBar.list
      )
    }
    changed = true
  }
  if (changed) fs.writeFileSync(SRC_PAGES, JSON.stringify(base, null, 2) + '\n', 'utf8')
  return changed
}

// 预判：切换后的页面集是否声明了 tabBar（决定 pages.json 是否要备份/还原）
function willHaveTabBar(appDir, overrideFiles, marker) {
  if (marker.tabBar) return true
  const source = overrideFiles.includes(PAGES_FILE) ? path.join(appDir, PAGES_FILE) : SRC_PAGES
  try {
    return !!JSON.parse(fs.readFileSync(source, 'utf8')).tabBar
  } catch {
    return true // 解析失败时保守处理，避免改了 pages.json 却没备份
  }
}

/**
 * 按当前应用主题色重绘 tabBar 图标 + 注入 selectedColor。
 * 只有页面集声明了 tabBar 才处理（weixin-cs 这类单页应用没有 tabBar）。
 */
function applyTabbarTheme(app, marker) {
  let pages
  try {
    pages = JSON.parse(fs.readFileSync(SRC_PAGES, 'utf8'))
  } catch {
    log.warn(`「${app}」src/pages.json 解析失败，跳过 tabBar 主题化`)
    return null
  }
  if (!pages.tabBar) {
    log.info(`「${app}」页面集未声明 tabBar，跳过图标主题化`)
    return null
  }
  const color = resolveThemeColor(app, marker.themeColor)
  // 备份基线 PNG，restore 时还原
  fs.mkdirSync(TABBAR_BACKUP, { recursive: true })
  for (const file of ICON_FILES) {
    const from = path.join(TABBAR_DIR, file)
    if (fs.existsSync(from)) fs.copyFileSync(from, path.join(TABBAR_BACKUP, file))
  }
  generateIcons(TABBAR_DIR, color, NORMAL_COLOR)
  // app.json 的 tabBar 字段优先级最高；颜色默认跟随 profile，显式指定才覆盖
  const overrides = marker.tabBar && typeof marker.tabBar === 'object' ? marker.tabBar : {}
  const baseList = Array.isArray(pages.tabBar.list) ? pages.tabBar.list : []
  const list = Array.isArray(overrides.list) ? mergeTabBarList(baseList, overrides.list) : baseList
  pages.tabBar = { ...pages.tabBar, ...overrides, list }
  pages.tabBar.color = overrides.color || NORMAL_COLOR
  pages.tabBar.selectedColor = overrides.selectedColor || color
  fs.writeFileSync(SRC_PAGES, JSON.stringify(pages, null, 2) + '\n', 'utf8')
  log.info(`「${app}」tabBar 主题化：选中色 ${color}（6 张图标已重绘）`)
  return color
}

// 应用 build/<app>/ 的配置到 src/
function apply(app) {
  if (!app) {
    log.error(`请指定应用名称，可选：${listApps().join('、') || '（无）'}`)
    process.exit(1)
  }
  const appDir = path.join(APP_ROOT, app)
  if (!fs.existsSync(appDir)) {
    log.error(`未找到 build/${app}，可选：${listApps().join('、') || '（无）'}`)
    process.exit(1)
  }
  // 先还原，避免把上一次已替换的内容当成基线备份
  restore({ silent: true })

  const markerPath = path.join(appDir, APP_MARKER)
  let platform = ''
  let marker = {}
  if (fs.existsSync(markerPath)) {
    try {
      marker = JSON.parse(fs.readFileSync(markerPath, 'utf8'))
      platform = marker.platform || ''
    } catch {
      /* ignore */
    }
  }
  // 1) 整份覆盖文件（pages.json / manifest.json）
  const overrideFiles = OVERRIDE_FILES.filter((f) => fs.existsSync(path.join(appDir, f)))
  // 2) app.json 内联页面集（pages/subPackages/globalStyle/tabBar），合并进 src/pages.json
  const hasInlinePages =
    Array.isArray(marker.pages) ||
    Array.isArray(marker.subPackages) ||
    !!marker.globalStyle ||
    !!marker.tabBar
  // 3) tabBar 主题化会改写 pages.json，因此也要纳入备份
  const hasTabBar = willHaveTabBar(appDir, overrideFiles, marker)

  const filesToBackup = [...overrideFiles]
  if ((hasInlinePages || hasTabBar) && !overrideFiles.includes(PAGES_FILE)) {
    filesToBackup.push(PAGES_FILE)
  }

  if (!filesToBackup.length) {
    log.info(`「${app}」无 pages/manifest 覆盖，仅按换肤/换域名构建（platform=${platform || '未声明'}）`)
  } else {
    for (const file of filesToBackup) {
      if (!fs.existsSync(path.join(SRC_DIR, file))) {
        log.error(`src/${file} 不存在，无法备份，请检查工程是否完整`)
        process.exit(1)
      }
    }
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
    for (const file of filesToBackup) {
      fs.copyFileSync(path.join(SRC_DIR, file), path.join(BACKUP_DIR, file))
    }
    // 整份覆盖
    for (const file of overrideFiles) {
      fs.copyFileSync(path.join(appDir, file), path.join(SRC_DIR, file))
    }
    // 内联页面集合并
    if (hasInlinePages && !overrideFiles.includes(PAGES_FILE)) {
      const ok = mergePagesFromMarker(marker)
      if (!ok) log.warn(`「${app}」的 app.json 含页面字段但合并失败，请检查 src/pages.json 格式`)
    }
    log.info(`已应用「${app}」配置（已备份：${filesToBackup.join('、')}）`)
  }
  // tabBar 主题化：无论有无配置覆盖都要执行（h5-a/h5-b 仅换肤同样需要）
  const themeColor = applyTabbarTheme(app, marker)
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  fs.writeFileSync(
    META_FILE,
    JSON.stringify(
      {
        app,
        platform,
        themeColor,
        tabbar: !!themeColor,
        appliedAt: new Date().toISOString(),
        files: filesToBackup,
      },
      null,
      2
    ),
    'utf8'
  )
  return { files: filesToBackup, platform, themeColor }
}

function list() {
  const apps = listApps()
  if (!apps.length) {
    log.warn('build/ 下没有可用的应用配置目录')
    return
  }
  const themes = readThemeMap()
  log.info(`可用应用配置（${apps.length} 个）：`)
  for (const app of apps) {
    const overrideFiles = OVERRIDE_FILES.filter((f) => fs.existsSync(path.join(APP_ROOT, app, f)))
    let marker = {}
    try {
      marker = JSON.parse(fs.readFileSync(path.join(APP_ROOT, app, APP_MARKER), 'utf8'))
    } catch {
      /* ignore */
    }
    const inlinePages = Array.isArray(marker.pages) || Array.isArray(marker.subPackages)
    const parts = []
    if (overrideFiles.length) parts.push(overrideFiles.join('、'))
    if (inlinePages) parts.push(`pages(${(marker.pages || []).length}页)`)
    if (marker.tabBar) parts.push('tabBar')
    if (!parts.length) parts.push('（无，仅换肤/域名）')
    const theme = marker.themeColor || themes[app] || '默认'
    console.log(
      `  - ${app}  [platform=${marker.platform || '?'}]  [theme=${theme}]  覆盖：${parts.join('、')}`
    )
  }
  const meta = readMeta()
  if (meta) {
    log.warn(
      `src/ 当前已切换为「${meta.app}」的配置（构建中，或上一次构建异常中断）。非该应用构建请先执行：npm run mp:restore`
    )
  }
}

function resolveUniBin() {
  const relative = path.join('node_modules', '@dcloudio', 'vite-plugin-uni', 'bin', 'uni.js')
  const local = path.join(ROOT, relative)
  return fs.existsSync(local) ? local : require.resolve('@dcloudio/vite-plugin-uni/bin/uni.js')
}

// 应用配置 → 执行 uni → 无论成功失败都还原
function run(type, app, flags, passthrough) {
  if (!app) {
    log.error(`请指定应用名称，可选：${listApps().join('、') || '（无）'}`)
    process.exit(1)
  }
  const { platform } = apply(app)
  const targetPlatform = flags.platform || platform
  if (!targetPlatform) {
    log.error(`未声明平台：请在 build/${app}/app.json 设置 "platform"，或传 --platform <platform>`)
    restore({ silent: true })
    process.exit(1)
  }

  const outDir = path.join(ROOT, 'dist', type === 'build' ? 'build' : 'dev', app)
  const args = type === 'build' ? ['build'] : []
  // H5 平台无需 -p（uni 默认即 H5），其余平台显式指定
  if (targetPlatform !== 'h5') args.push('-p', targetPlatform)
  args.push('-m', app, ...passthrough)

  log.info(`开始${type === 'build' ? '构建' : '调试'}「${app}」（${targetPlatform}）`)
  log.info(`产物目录：${path.relative(ROOT, outDir)}`)

  const child = spawn(process.execPath, [resolveUniBin(), ...args], {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      // uni 会优先读取 UNI_OUTPUT_DIR，用它隔离各应用产物目录，避免互相覆盖
      UNI_OUTPUT_DIR: outDir,
      // 传给 vite.config.ts 的 define，业务代码里用 process.env.UNI_MP_APP 区分应用
      UNI_MP_APP: app,
    },
  })

  let finished = false
  const finish = (code) => {
    if (finished) return
    finished = true
    restore({ silent: true })
    log.info('已还原 src/ 基线配置')
    process.exit(code)
  }

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (child.exitCode === null) child.kill(signal)
      else finish(130)
    })
  }
  child.on('error', (error) => {
    log.error(`启动 uni 失败：${error.message}`)
    finish(1)
  })
  child.on('exit', (code, signal) => finish(signal ? 130 : code ?? 1))
}

function parseArgv(argv) {
  const flags = { platform: '' }
  const rest = []
  const passthrough = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--platform') {
      if (argv[i + 1]) flags.platform = argv[++i]
      continue
    }
    if (arg === '--') {
      passthrough.push(...argv.slice(i + 1))
      break
    }
    rest.push(arg)
  }
  return { flags, rest, passthrough }
}

function main() {
  const [command, ...argv] = process.argv.slice(2)
  const { flags, rest, passthrough } = parseArgv(argv)
  switch (command) {
    case 'list':
      return list()
    case 'apply':
      return apply(rest[0])
    case 'restore':
      return restore()
    case 'dev':
      return run('dev', rest[0], flags, passthrough)
    case 'build':
      return run('build', rest[0], flags, passthrough)
    default:
      return printHelp()
  }
}

main()
