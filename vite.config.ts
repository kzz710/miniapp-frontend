import { defineConfig } from "vite";
import type { Plugin } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import fs from "node:fs";
import path from "node:path";

/**
 * 多应用构建的一致性守卫。
 *
 * 1. 若 src/ 当前仍是某个应用的切换状态（上一次构建异常中断），
 *    此时用其他 mode 构建会打出错误产物，需先还原；
 * 2. 若检测到 mode 指向某个应用，但 src/ 并未切换到它，说明没走 mp:dev/mp:build，
 *    需先 apply，避免静默打出错误页面 / AppID。
 */
function mpAppVariantGuardPlugin(): Plugin {
  const readAppliedApp = () => {
    try {
      return JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "build", ".backup", "meta.json"), "utf8")
      ).app;
    } catch {
      return undefined;
    }
  };
  return {
    name: "uni-mp-app-variant-guard",
    enforce: "pre",
    config(_config, env) {
      const appliedApp = readAppliedApp();
      if (appliedApp && appliedApp !== env.mode) {
        throw new Error(
          `[mp-config] src/ 当前仍是「${appliedApp}」的配置（上一次构建可能异常中断）。\n` +
            `请先执行：npm run mp:restore，再重新构建。`
        );
      }
      const appDir = path.resolve(__dirname, "build", String(env.mode || ""));
      if (!fs.existsSync(appDir)) return;
      if (appliedApp !== env.mode) {
        throw new Error(
          `[mp-config] 检测到 mode="${env.mode}"，但 src/ 中的配置并未切换到该应用。\n` +
            `请使用对应的 npm script：npm run mp:dev ${env.mode} 或 npm run mp:build ${env.mode}`
        );
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    // 编译期常量：当前构建的应用变体（由 scripts/mp-config.mjs 注入）。
    // '' 表示未按变体构建（普通 dev/build 或 H5 默认）。
    define: {
      "process.env.UNI_MP_APP": JSON.stringify(process.env.UNI_MP_APP || ""),
    },
    plugins: [mpAppVariantGuardPlugin(), uni()],
  };
});
