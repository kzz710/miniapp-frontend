# 多应用构建（一套代码 → 多个应用）

同一套 uni-app 源码打包出**多个应用**：同一平台多个 App（如微信小程序 cs / mcm、头条小程序 A / B）
以及跨平台 H5 项目（H5-A / H5-B）。**不复制工程**，而是为每个应用准备差异配置，
构建前覆盖/合并到 `src/`，构建结束后自动还原 `src/` 基线。

> 思路参考 `mp-video-vue3/miniapp-video` 项目，做了精简与适配。

## 目录约定

```
build/
├── weixin-cs/           微信小程序 cs（划算买车 · 橙色 · 单页）
│   ├── app.json         # 必填：platform；可选 themeColor / tabBar / 内联页面集
│   ├── pages.json       # 独立页面集：仅 pages/cs/index，无 tabBar
│   └── manifest.json    # 覆盖 src/manifest.json（整份替换，改 appid/名称）
├── weixin-mcm/          微信小程序 mcm（买车么 · 蓝色 · 当前主体）
│   ├── app.json
│   ├── pages.json       # 完整页面集，含 tabBar
│   └── manifest.json
├── toutiao-a/          头条小程序 A（红色）
│   ├── app.json
│   └── manifest.json
├── toutiao-b/          头条小程序 B（绿色 · 关闭历史搜索）
│   ├── app.json
│   └── manifest.json
├── h5-a/               H5 项目 A（蓝色 · 仅换肤/换域名）
│   └── app.json
├── h5-b/               H5 项目 B（橙色）
│   └── app.json
└── .backup/            # 切换时自动生成的备份目录（已 gitignore，勿手工编辑）
```

规则：

- **`app.json`**：应用注册标记（声明 `platform`），必须存在，`list` 才能识别。
  可选字段：`themeColor`（tabBar 选中色）、`tabBar`（覆盖 tabBar 配置）、
  以及内联页面集 `pages` / `subPackages` / `globalStyle`。
- **`pages.json`**（可选）：存在即**整份替换** `src/pages.json`（比内联更干净，推荐）。
  `weixin-cs` / `weixin-mcm` 都用这种方式，页面集可以完全不同。
- **`manifest.json`**（可选）：存在即**整份替换** `src/manifest.json`（一份完整合法的 uni manifest，只改 appid / 名称）。
- 页面集相同的应用（h5-a / h5-b）无需提供 `pages.json`，沿用 `src/` 基线 ——
  但仍会自动获得各自品牌色的 tabBar。
- 目录名 = uni 的 `mode` 名 = `MP_APP` 编译期常量 = `PROFILES` 的键名，**三者必须一致**。

## 使用方式

```bash
npm run mp:list                  # 查看所有应用（含主题色）
npm run mp:dev weixin-cs         # 调试「微信小程序 cs」（Ctrl+C 后自动还原 src/）
npm run mp:build weixin-cs       # 构建 → dist/build/weixin-cs
npm run mp:dev h5-a              # 调试 H5-A
npm run mp:build h5-a            # 构建 → dist/build/h5-a
npm run mp:restore               # 手工还原 src/ 基线（构建异常中断时使用）

npm run mp:tabbar                # 生成全部应用的 tabBar 图标 + 预览页
npm run mp:tabbar:baseline       # 重绘 src/static/tabbar 的基线蓝色图标
```

> 平台由 `build/<app>/app.json` 的 `platform` 决定，无需手动传 `--platform`。
> 非要覆盖时：`npm run mp:build weixin-mcm --platform mp-weixin`。

产物目录按应用隔离，互不覆盖：

| 应用 | 调试产物 | 构建产物 |
| --- | --- | --- |
| weixin-cs | `dist/dev/weixin-cs` | `dist/build/weixin-cs` |
| h5-a | `dist/dev/h5-a` | `dist/build/h5-a` |

## tabBar 主题化（自动，无需手工维护图片）

小程序的 tabBar 图标是**静态 PNG**，无法像页面那样用 CSS 变量着色；而本项目一套源码要产出
蓝 / 橙 / 红 / 绿四种品牌色。因此脚本在构建时按应用主题色**实时重绘图标**：

| 环节 | 行为 |
| --- | --- |
| 数据源 | `src/profiles.ts` 的 `themeColor`（唯一来源，不维护第二份颜色表） |
| `apply` | 备份 `src/static/tabbar/*.png` → 生成 6 张 81×81 PNG（3 图标 × 普通/选中）→ 把 `selectedColor` 注入当前生效的 `pages.json` |
| `restore` | 还原备份的 PNG 与 `pages.json`，源码回到蓝色基线 |
| 无 tabBar 的应用 | 自动跳过（如 `weixin-cs` 单页应用） |

图标由 `scripts/tabbar.mjs` 用纯 Node 生成（zlib 手写 PNG 编码 + 4× 超采样抗锯齿几何绘制），
**零第三方依赖**，线性风格与新版设计系统一致；生成物不入库。
`npm run mp:tabbar` 输出到 `dist/tabbar-preview/`，打开其中的 `index.html` 可一次看全 6 个应用。

在 `build/<app>/app.json` 里可以按需覆盖：

```json
{
  "platform": "mp-weixin",
  "name": "划算买车",
  "themeColor": "#FF6B2F",
  "tabBar": {
    "list": [
      { "pagePath": "pages/input/input", "text": "查价" }
    ]
  }
}
```

- `themeColor` 不填就取 `src/profiles.ts`；显式填时以它为准。
- `tabBar.list` 按 `pagePath` 与基线**逐项合并**：只写要改的文案即可，其余 tab、
  `iconPath` / `selectedIconPath` 都会自动保留；写入基线没有的 `pagePath` 则追加新 tab。
  若要**删减** tab，请改用独立的 `build/<app>/pages.json` 整份替换。
- `tabBar.selectedColor` / `color` / `backgroundColor` / `borderStyle` 也可直接写在 `app.json` 里强制指定。
- 不要给 `tabBar.list` 指向别的图标目录，否则颜色会与生成物失配。

## 在代码里区分当前应用

脚本向 uni 进程注入环境变量 `UNI_MP_APP`，`vite.config.ts` 用 `define` 把它变成编译期常量。
页面样式用 `useAppTheme()` 注入 CSS 变量，业务配置用 `getProfile()`：

```ts
import { useApp } from '@/composables/useApp'

const app = useApp()           // 当前应用的 profile
console.log(app.brandName)     // '买车么' | '划算买车' | '买车么头条' | ...
if (!app.features.history) { /* 该应用关闭历史搜索 */ }
```

编译期选定并摇树，运行时不会把所有应用的配置都打进包。

## 新增一个应用

1. 新建 `build/<新应用名>/app.json`，填 `platform` 与 `name`；
2. 如需不同 appid，放 `manifest.json`（整份）；如需不同页面集，二选一：
   - 放一份**完整**的 `build/<新应用名>/pages.json`（整份替换，推荐）；
   - 或在 `app.json` 内联 `pages` / `subPackages` / `globalStyle` / `tabBar`（按字段合并）。
   记得把页面指向的 `.vue` 文件建在 `src/pages/` 下，否则构建会报「页面不存在」。
3. 在 `src/profiles.ts` 的 `PROFILES` 里加一条**同名**记录（品牌名 / 主题色 / 域名 / 功能开关）——
   主题色会自动用于页面 CSS 变量与 tabBar 图标，无需再改别处；
4. `npm run mp:list` 确认可见（应显示新主题色），再 `npm run mp:build <新应用名>`。


## 买车么四端（微信 / 抖音 / 快手 / 百度）

品牌名统一「买车么」，生产接口 `https://kzzmyself.cn`。

| 应用 | 平台 | AppID | 构建 | 产物 |
|---|---|---|---|---|
| weixin-mcm | mp-weixin | wx7262c0605d2bf998 | `npm run mp:build weixin-mcm` | dist/build/weixin-mcm |
| toutiao-a | mp-toutiao | ttc78cb13158a68335 | `npm run mp:build toutiao-a` | dist/build/toutiao-a |
| kuaishou-mcm | mp-kuaishou | ks702843020083943663 | `npm run mp:build kuaishou-mcm` | dist/build/kuaishou-mcm |
| baidu-mcm | mp-baidu | 15297539 | `npm run mp:build baidu-mcm` | dist/build/baidu-mcm |

正式包请用 `mp:build`（不要用 `mp:dev`）。各端开发者后台把 request 合法域名配成 `https://kzzmyself.cn`（分享封面也走该域名，如有「downloadFile / 业务域名」一并加上）。
