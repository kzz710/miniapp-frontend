# 多应用构建（一套代码 → 多个应用）

同一套 uni-app 源码打包出**多个应用**：同一平台多个 App（如微信小程序 cs / mcm、头条小程序 A / B）
以及跨平台 H5 项目（H5-A / H5-B）。**不复制工程**，而是为每个应用准备差异配置，
构建前整份替换到 `src/`，构建结束后自动还原 `src/` 基线。

> 思路参考 `mp-video-vue3/miniapp-video` 项目，做了精简与适配。

## 目录约定

```
build/
├── weixin-cs/           微信小程序 cs（划算买车，换 appid + 换肤 + 不同页面集）
│   ├── app.json         # 必填：声明 platform，可内联 pages/subPackages/globalStyle/tabBar
│   └── manifest.json    # 覆盖 src/manifest.json（整份替换，改 appid/名称）
├── weixin-mcm/          微信小程序 mcm（买车么，当前主体）
│   ├── app.json
│   └── manifest.json
├── toutiao-a/          头条小程序 A
│   ├── app.json
│   └── manifest.json
├── toutiao-b/          头条小程序 B（换肤 + 关闭历史搜索）
│   ├── app.json
│   └── manifest.json
├── h5-a/               H5 项目 A（仅换肤/换域名，无需覆盖 manifest/pages）
│   └── app.json
├── h5-b/               H5 项目 B
│   └── app.json
└── .backup/            # 切换时自动生成的备份目录（已 gitignore，勿手工编辑）
```

规则：

- **`app.json`**：每个应用的注册标记（声明所属 `platform`），必须存在，`list` 才能识别该应用。
  它还可以**内联页面集字段**（`pages` / `subPackages` / `globalStyle` / `tabBar`），构建时会**合并**进 `src/pages.json`
  （保留其余字段，不整份替换）。`weixin-cs` 就是这种用法：`pages` 只含 `pages/cs/index`，与 mcm 的三个页面不同。
- **`pages.json`**（可选）：如果存在，则**整份替换** `src/pages.json`（比内联更干净，推荐新应用使用）。
- **`manifest.json`**（可选）：存在即**整份替换** `src/manifest.json`（一份完整合法的 uni manifest，只改 appid / 名称）。
- 页面集相同的应用（如 h5-a/h5-b）无需提供 `pages.json` 或内联 `pages`，沿用 `src/` 基线。
- 目录名（`weixin-cs`、`h5-b`…）= uni 的 `mode` 名 = `MP_APP` 编译期常量。

## 使用方式

```bash
npm run mp:list                 # 查看所有可用的应用配置
npm run mp:dev weixin-cs        # 调试「微信小程序 cs」（Ctrl+C 后自动还原 src/）
npm run mp:build weixin-cs      # 构建「微信小程序 cs」→ dist/build/weixin-cs
npm run mp:dev h5-a             # 调试 H5-A
npm run mp:build h5-a           # 构建 H5-A → dist/build/h5-a
npm run mp:restore              # 手工还原 src/ 基线配置（构建异常中断时使用）
```

> 平台由 `build/<app>/app.json` 的 `platform` 决定，无需手动传 `--platform`。
> 非要覆盖时：`npm run mp:build weixin-mcm --platform mp-weixin`。

产物目录按应用隔离，互不覆盖：

| 应用 | 调试产物 | 构建产物 |
| --- | --- | --- |
| weixin-cs | `dist/dev/weixin-cs` | `dist/build/weixin-cs` |
| h5-a | `dist/dev/h5-a` | `dist/build/h5-a` |

## 在代码里区分当前应用

脚本会向 uni 进程注入环境变量 `UNI_MP_APP`，`vite.config.ts` 用 `define` 把它变成编译期常量。
更推荐用 `src/profiles.ts` 的 `getProfile()` 读取整套应用配置（品牌名 / 主题色 / 域名 / 功能开关）：

```ts
import { useApp } from '@/composables/useApp'

const app = useApp()           // 当前应用的 profile
console.log(app.brandName)     // '买车么' | '划算买车' | '买车么头条' | ...
if (!app.features.history) { /* 该应用关闭历史搜索 */ }
```

因为是编译期选定并摇树，运行时不会把所有应用的配置都打进包。

## 新增一个应用

1. 新建 `build/<新应用名>/app.json`，填 `platform` 与 `name`；
2. 如需不同 appid，再放 `manifest.json`（整份）；如需不同页面集，二选一：
   - 在 `app.json` 内联 `pages` / `subPackages` / `globalStyle` / `tabBar`（自动合并进 `src/pages.json`）；
   - 或在 `build/<新应用名>/pages.json` 放一份**完整**页面配置（整份替换 `src/pages.json`）。
   记得把页面指向的 `.vue` 文件建在 `src/pages/` 下，否则构建会报“页面不存在”。
3. 在 `src/profiles.ts` 的 `PROFILES` 里加一条同名记录（品牌名 / 主题色 / 域名 / 功能开关）；
4. `npm run mp:list` 确认可见，然后 `npm run mp:build <新应用名>`。
