# 成都理工大学程序设计协会 · XCPC 算法模板库

228 份 Markdown，整理为 278 个功能入口。可以直接读 [功能目录](目录.md)，也可以本地打开网页搜索、复制代码和打印。

## 本地打开

需要 Node.js 24 和 npm：

```sh
npm ci
npm run dev
```

打开终端显示的本地地址。打印时用浏览器的打印功能。

## 维护

源模板在 `content/`，章节和分组在 `data/catalog.json`。改好后运行：

```sh
npm run sync:content
node src/ui.check.mjs
npm run build
```

同步命令会更新目录和网页索引；`dist/` 是可部署的构建产物，不提交到仓库。`npm run check:performance` 是可选的浏览器检查，需要已启动的本地网页、Edge 和脚本所用的 Playwright 运行时。

## 来源与许可

本库基于 [hh2048/XCPC](https://github.com/hh2048/XCPC) 整理。各模板的来源保存在 `data/templates.json` 的 `source` 字段；这里保留上游 [GNU GPL v3 许可文本](LICENSE)，不附带外部 PDF、收集资料或旧离线包。
