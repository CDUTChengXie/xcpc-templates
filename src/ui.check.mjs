// Run: node src/ui.check.mjs
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { parseTemplate } from './markdown.ts'
import { catalogTargets, copyPrefix, elementId, targetId, templateTargets } from './navigation.ts'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const source = await readFile(new URL('./App.tsx', import.meta.url), 'utf8')
const bundle = await build({
  stdin: {
    contents: source + '\nexport { Description, TemplateContent, Sidebar, matchId, PREVIEW_TEMPLATE_ID, SA_TEMPLATE_ID, previewPayload };\nexport { CodeBlock } from "./components/CodeBlock";\nexport { compactCpp, cppParts, splitDsuCode } from "./code-format";',
    resolveDir: fileURLToPath(new URL('.', import.meta.url)), loader: 'tsx',
  },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic',
  loader: { '.md': 'text' },
  define: { 'import.meta.env.BASE_URL': '"./"' }, logLevel: 'silent',
})
const require = createRequire(import.meta.url)
function load(extra = {}) {
  const module = { exports: {} }
  runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require, ...extra })
  return module.exports
}
const { Description, TemplateContent, Sidebar, matchId, PREVIEW_TEMPLATE_ID, SA_TEMPLATE_ID, CodeBlock, compactCpp, cppParts, splitDsuCode } = load()
const data = JSON.parse(await readFile(new URL('../public/templates.json', import.meta.url), 'utf8'))
const DSU_DRAFT_SECTIONS = data.templates.find(item => item.id === PREVIEW_TEMPLATE_ID).sections
const SA_DRAFT_SECTIONS = data.templates.find(item => item.id === SA_TEMPLATE_ID).sections
const focused = load().previewPayload(data)
assert.equal(focused.templates.length, 1)
assert.equal(focused.templates[0].id, PREVIEW_TEMPLATE_ID)
assert.equal(focused.templates[0], data.templates.find(item => item.id === PREVIEW_TEMPLATE_ID))
assert.equal(focused.meta.count, 1)
assert.equal(focused.nav.length, 1)
assert.equal(focused.nav[0].sections[0].items[0], focused.templates[0].id)
assert.equal(focused.nav[0].sections[0].items[1], targetId(PREVIEW_TEMPLATE_ID, 1))
assert.equal(focused.nav[0].concepts.length, 0)
assert.equal(data.templates.length, data.meta.count)
assert.equal(data.meta.count, 228)
assert.throws(() => load().previewPayload({ ...data, templates: [] }), /未找到样板/)
const saFocused = load().previewPayload(data, SA_TEMPLATE_ID)
assert.equal(saFocused.templates.length, 1)
assert.equal(saFocused.templates[0].id, SA_TEMPLATE_ID)
assert.equal(saFocused.nav[0].sections[0].items[0], saFocused.templates[0].id)
const allTargets = templateTargets(data.templates)
const navigation = catalogTargets(data)
assert.equal(new Set(navigation.map(target => target.id)).size, allTargets.length)
assert.deepEqual(navigation.map(target => target.id).sort(), allTargets.map(target => target.id).sort())
assert.equal(new Set(allTargets.map(target => elementId(target.id))).size, allTargets.length, '中文标题不能导致 DOM id 碰撞')
assert(!data.nav.some(chapter => chapter.sections.some(group => group.section === '其他')))
assert.equal(data.nav.length, 13)
assert.equal(data.nav[0].chapter, '第零章 基础与工具')
assert(!data.templates.find(item => item.id === '05 - 数论/14 - SG 函数').tags.includes('几何'))
for (const [id, category] of [
  ['05 - 数论/13 - BSGS & exBSGS', '离散对数与原根'],
  ['05 - 数论/14 - SG 函数', '博弈基础'],
  ['05 - 数论/16 - FWT（沃尔什变换）', '集合与位运算卷积'],
  ['02 - 图论/26 - HopcroftKarp与二分图最小点覆盖', '匹配与点覆盖'],
  ['01 - 数据结构/34 - 区间加区间和（双树状数组）', '树状数组'],
  ['08 - 动态规划/03 - 区间 DP::1', '区间 DP'],
  ['08 - 动态规划/08 - 背包补充（混合 依赖 二维费用 单调队列）::1', '背包'],
  ['08 - 动态规划/08 - 背包补充（混合 依赖 二维费用 单调队列）::2', '背包'],
  ['08 - 动态规划/13 - 树上背包（同色点对距离最大和）', '树形 DP'],
  ['08 - 动态规划/14 - 棋盘国王与字符串数位例题::4', 'GCD 与整数计算'],
]) assert.equal(navigation.find(target => target.id === id)?.section, category, id)
assert(!data.templates.some(item => /\bdpMinWindow\b/.test(item.code)), '不保留恒等于求和的滑窗递推')
const knapsacks = navigation.filter(target => target.chapter === '第十章 动态规划' && target.section === '背包')
assert.deepEqual(knapsacks.map(({ template, sectionIndex }) => {
  const section = template.sections[sectionIndex]
  const copiedCode = [copyPrefix(template.sections, sectionIndex), section.code].join('\n')
  return Array.from(copiedCode.matchAll(/^\s*(?:inline )?(?:i64|std::vector<int>) (\w+)\(/gm), match => match[1])
}), [
  ['knapsack01'], ['knapsackComplete'], ['knapsackMultiple'], ['bounded'], ['bounded', 'mixed'],
  ['knapsackGroup'], ['twoCosts'], ['dependent'], ['count01'], ['countComplete'], ['recover01'],
], '每个背包入口只复制本节函数和必要依赖')
const graph = data.templates.find(item => item.id === '02 - 图论/24 - Prim 二分染色与基础图搜索')
assert.equal(graph.sections.length, 4)
assert.equal(navigation.find(target => target.id === targetId(graph.id, 2)).section, '图搜索与可达性')
assert(!data.templates.find(item => item.id === '00 - 基础/01 - 二分').code.includes('ternarySearch'))
const ternary = data.templates.find(item => item.id === '00 - 基础/07 - 三分法')
assert.equal(ternary.sections.length, 1)
assert(ternary.code.includes('ternarySearchMax'))
assert.equal(matchId(ternary.id + '::1', allTargets), ternary.id, '已合并的旧分节链接回到完整板子')
assert(!data.nav.some(chapter => /附录|兼容|受限|专题/.test(chapter.chapter + chapter.sections.map(group => group.section).join(' '))))
assert(!allTargets.some(target => /兼容|受限|专题|旧接口/.test(target.title)))
const sidebar = renderToStaticMarkup(React.createElement(Sidebar, { nav: data.nav, items: data.templates, current: PREVIEW_TEMPLATE_ID + '::1', onPick() {}, collapsed: false }))
assert(sidebar.includes('<nav') && sidebar.includes('aria-label="算法目录"') && sidebar.includes('<ul'))
const chapterButtons = Array.from(sidebar.matchAll(/<button class="side-ch-h"[^>]*>/g), match => match[0])
assert.equal(chapterButtons.length, data.nav.length)
assert.equal(chapterButtons.filter(button => button.includes('aria-expanded="true"')).length, 1)
assert.equal(Array.from(sidebar.matchAll(/<button class="side-sec-h"[^>]*aria-expanded="true"/g)).length, 1)
for (const match of sidebar.matchAll(/aria-controls="([^"]+)"/g)) assert(sidebar.includes(`id="${match[1]}"`))
const hiddenSidebar = renderToStaticMarkup(React.createElement(Sidebar, { nav: data.nav, items: data.templates, current: PREVIEW_TEMPLATE_ID, onPick() {}, collapsed: true }))
assert(hiddenSidebar.includes('hidden=""') && !hiddenSidebar.includes('<a') && !hiddenSidebar.includes('side-ico'))
const lca = data.templates.find(item => item.id === '03 - 树上算法/02 - LCA（倍增）')
const lcaNotes = lca.sections[0].paragraphs.join('\n')
for (const call of ['LCA(n)', 'addEdge(u,v)', 'work(root)', 'init(n)']) assert(lcaNotes.includes(call), 'LCA 保留完整调用顺序')
assert(!/dfn|根的父节点|支持深链|显式栈/.test(lcaNotes), '字段约定与实现介绍不混在调用说明中')
assert(lca.code.includes('dfn[u] 为从 0 编号的首次访问序'))
assert(lca.code.includes('越过根时停在根；要求 0 <= k < n'))
for (const [id, chapter] of [
  ['09 - 进阶补充/05 - 序列技巧（LIS LCS 约瑟夫 与对拍工具）', '第十章 动态规划'],
  ['09 - 进阶补充/05 - 序列技巧（LIS LCS 约瑟夫 与对拍工具）::4', '第零章 基础与工具'],
  ['00 - 基础/17 - 浮点比较与幂表达式排序::1', '第七章 线性代数与数值计算'],
  ['00 - 基础/04 - 快读', '第零章 基础与工具'],
  ['01 - 数据结构/09 - 分数（Frac）', '第七章 线性代数与数值计算'],
]) assert.equal(navigation.find(target => target.id === id)?.chapter, chapter, id)
for (const t of data.templates) {
  const markdown = await readFile(new URL('../' + t.file, import.meta.url), 'utf8')
  const sections = parseTemplate(markdown)
  assert.deepEqual(t.sections, sections, t.title + ': Markdown and website sections match')
  assert.equal(sections[0].title, t.title.replace(/^\d+\s*-\s*/, ''))
  assert.equal(t.complexity, sections[0].paragraphs.at(-1))
  assert.equal(t.code, sections.map(section => section.code).join('\n\n'))
  assert.equal(t.lines, t.code.split('\n').length)
  assert(!Object.hasOwn(t, 'info'), t.title + ': obsolete calls/card payload removed')
  assert(!/^\s*\/\/\s*(?:场景|接口|复杂度)[:：]/m.test(t.code), t.title + ': no embedded interface/example header')
  assert(!/^---|\*\*直接调用\*\*|\*\*代码模板\*\*|<details|<summary/m.test(markdown))
  const html = sections.map((section, activeSection) => renderToStaticMarkup(React.createElement(TemplateContent, { sections, activeSection, fontSize: 13, printing: false }))).join('')
  assert(!/<details|<summary|quick-card|quick-label|cb-comments/.test(html))
  assert.equal((html.match(/class="cb"/g) || []).length, sections.length)
  assert.equal((html.match(/复制（含基础）/g) || []).length, sections.filter(section => section.requiresBase).length)
  for (const section of sections) {
    assert(!section.paragraphs.some(paragraph => /支持深链|显式栈|用栈代替递归/.test(paragraph)), t.title + ': 正文是调用速查，不是实现介绍')
    assert(html.includes(renderToStaticMarkup(React.createElement(Description, { paragraphs: section.paragraphs }))))
    for (const paragraph of section.paragraphs.filter(part => !part.startsWith('~~~cpp\n'))) assert(!/\b(?:vector|array|pair|optional|bitset|Frac|Point|Line)</.test(paragraph.replace(/`[^`]*`/g, '')), t.title + ': generic types must remain visible in standard Markdown')
  }
  assert(!/^\s*#\s*include\b/m.test(t.code), t.title + ': no headers')
  assert(!/^\s*(?:int|signed)\s+main\s*\(/m.test(t.code), t.title + ': no main')
  assert(!/^\s*void\s+example\s*\(/m.test(t.code), t.title + ': no selftest')
  assert.equal(compactCpp(compactCpp(t.code)), compactCpp(t.code), t.title + ': comment stripping is idempotent')
}
const sample = '# Template\n\nPurpose with \u0060init()\u0060.\n\nO(n).\n\n\u0060\u0060\u0060cpp\nint value;\n\u0060\u0060\u0060\n'
assert.equal(parseTemplate('\uFEFF' + sample.replace(/\n/g, '\r\n'))[0].code, 'int value;')
const independent = parseTemplate(sample + '\n## Independent\n\n可独立复制。\n\n```cpp\nint other;\n```\n')
const teachingText = '~~~cpp\nold[0] = 1;\n\nnext = old;\n~~~'
const teaching = parseTemplate(sample.replace('O(n).', teachingText + '\n\nO(n).'))[0]
assert.equal(teaching.paragraphs[1], teachingText)
assert.equal(teaching.code, 'int value;')
for (const printing of [false, true]) {
  const html = renderToStaticMarkup(React.createElement(TemplateContent, { sections: [teaching], printing }))
  assert(html.includes('<pre><code>old[0] = 1;\n\nnext = old;</code></pre>'))
  assert.equal((html.match(/class="cb"/g) || []).length, 1)
}
assert.throws(() => parseTemplate(sample.replace('O(n).', '~~~cpp\nold[0] = 1;')), /讲解片段/)
assert.equal(independent[1].requiresBase, false)
assert.equal(parseTemplate(sample + '\n## Extension\n\n依赖上方实现。\n\n```cpp\nint other;\n```\n')[1].requiresBase, true)
const dependencies = parseTemplate(sample + '\n## Helper\n\n依赖本文件的「Template」。\n\n```cpp\nint helper;\n```\n\n## Result\n\n依赖本文件的「Template」「Helper」。\n\n```cpp\nint result;\n```\n')
assert.deepEqual(dependencies[2].dependencies, [0, 1])
assert.equal(copyPrefix(dependencies, 2), 'int value;\n\nint helper;', '传递依赖只复制一次，并按原顺序组成')
assert.equal(copyPrefix(independent, 1), '', '独立版不附带无关实现')
assert.throws(() => copyPrefix([{ ...dependencies[0], dependencies: [0] }], 0), /依赖/)
for (const names of ['「Missing」', '「Result」', '「Template」「Template」', '未命名']) {
  assert.throws(() => parseTemplate(sample + '\n## Result\n\n依赖本文件的' + names + '。\n\n```cpp\nint result;\n```\n'), /依赖/)
}
for (const invalid of ['', sample + 'unparsed', sample.replace('# Template', '## Template'), sample.replace('int value;', ''), sample.replace('O(n).', '<details>hidden</details>'), sample + sample, sample.replace('Purpose', '\u0060\u0060\u0060cpp\nint hidden;\n\u0060\u0060\u0060\nPurpose')]) {
  assert.throws(() => parseTemplate(invalid), 'malformed Markdown must not silently lose content')
}
const fullCode = Array.from({ length: 45 }, (_, i) => '// line ' + i).join('\n')
const codeHtml = renderToStaticMarkup(React.createElement(CodeBlock, { code: fullCode }))
assert(codeHtml.includes('代码模板') && codeHtml.includes('// line 44'))
const previewHtml = renderToStaticMarkup(React.createElement(CodeBlock, { code: 'int value = 1; // 说明', compact: true }))
assert(!previewHtml.includes('// 说明') && previewHtml.includes('显示注释'))
assert.equal(compactCpp('// 说明\nint value = 1; // 说明\n'), 'int value = 1;')
assert.match(compactCpp('int/**/value;'), /^int\s+value;$/)
for (const literal of ['"https://site/path/*keep*/"', String.raw`'\''`, "u8'a'", '"escaped\\\"//keep"', 'u8R"tag(// keep\n\n/* keep */  \n)tag"']) {
  assert.equal(compactCpp(`auto value = ${literal}; // remove\n`), `auto value = ${literal};`)
}
assert.equal(compactCpp("auto value = 0xAB'CD + 1'000'000; // remove"), "auto value = 0xAB'CD + 1'000'000;")
for (const input of ['#define VALUE \\\n  1 // keep\n', '#define VALUE 1 /*\nkeep*/ + 2\n', 'int value = __LINE__; // keep', '/* unterminated', '"unterminated\n', 'R"tag(unterminated']) {
  assert.equal(compactCpp(input), input)
}
const previewTemplate = data.templates.find(item => item.id === PREVIEW_TEMPLATE_ID)
const pieces = { base: DSU_DRAFT_SECTIONS[0].code, extension: DSU_DRAFT_SECTIONS[1].code }
const draftMarkdown = (await readFile(new URL('../并查集-打印样稿.md', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
const draftBlocks = Array.from(draftMarkdown.matchAll(/^```cpp\n([\s\S]*?)\n```/gm), match => match[1])
assert.equal(draftBlocks.length, 2)
assert.equal(tokens(DSU_DRAFT_SECTIONS[0].code), tokens(draftBlocks[0]))
assert.equal(tokens(DSU_DRAFT_SECTIONS[1].code), tokens(draftBlocks[1]))
assert(!/<details|<summary/.test(draftMarkdown))
assert(pieces.base.includes('struct DSU') && !pieces.base.includes('GraphComponentDSU'))
assert(pieces.extension.includes('class GraphComponentDSU') && !/\bstruct\s+DSU\b/.test(pieces.extension))
assert(pieces.base.includes('// 返回 x 所在集合的代表编号'))
assert(pieces.extension.includes('class GraphComponentDSU'))
assert(!pieces.extension.includes('// 场景：'))
function tokens(code) { return cppParts(code).filter(part => part.kind !== 'comment').map(part => part.kind === 'literal' ? JSON.stringify(part.text) : part.text.replace(/\s+/g, '')).join('') }
assert.equal(tokens(pieces.base + '\n\n' + pieces.extension), tokens(previewTemplate.code))
assert.equal(tokens(draftBlocks.join('\n\n')), tokens(previewTemplate.code), 'Markdown 样稿不改变算法')
const sampleSplit = splitDsuCode('// struct DSU {};\nstruct DSU { const char* text = R"tag(}; // keep)tag"; void work() { if (true) {} } };\nclass GraphComponentDSU {};')
assert(sampleSplit.base.includes('void work()') && sampleSplit.base.endsWith('};'))
assert.equal(sampleSplit.extension, 'class GraphComponentDSU {};')
assert.throws(() => splitDsuCode('// struct DSU {};'), /未找到/)
assert.throws(() => splitDsuCode('struct DSU;'), /未找到/)
assert.throws(() => splitDsuCode('struct DSU {}'), /分号/)
assert.throws(() => splitDsuCode('struct DSU {'), /不完整/)
const layeredHtml = renderToStaticMarkup(React.createElement(TemplateContent, { sections: DSU_DRAFT_SECTIONS, activeSection: 1, fontSize: 13, printing: false }))
assert(!/<details|<summary|可选扩展/.test(layeredHtml))
assert(layeredHtml.includes('GraphComponentDSU') && layeredHtml.includes('复制（含基础）'))
const printedHtml = renderToStaticMarkup(React.createElement(TemplateContent, { sections: DSU_DRAFT_SECTIONS, activeSection: 1, fontSize: 13, printing: true }))
assert(!/<details|<summary/.test(printedHtml))
assert(printedHtml.includes('GraphComponentDSU'))

const saMarkdown = (await readFile(new URL('../后缀数组-SA-打印样稿.md', import.meta.url), 'utf8')).replace(/\r\n/g, '\n')
const saBlocks = Array.from(saMarkdown.matchAll(/^```cpp\n([\s\S]*?)\n```/gm), match => match[1])
assert.equal(saBlocks.length, 1)
assert.equal(tokens(SA_DRAFT_SECTIONS[0].code), tokens(saBlocks[0]), 'SA 正式稿保留已确认的算法')
assert.equal(tokens(saBlocks[0]), tokens(saFocused.templates[0].code), 'SA 样稿不改变算法')
assert(!/<details|<summary/.test(saMarkdown))
for (const printing of [false, true]) {
  const html = renderToStaticMarkup(React.createElement(TemplateContent, { sections: SA_DRAFT_SECTIONS, fontSize: 13, printing }))
  assert(!/template-extension|<details|<summary|quick-card|复制（含基础）/.test(html))
  assert(html.includes('lc[k]：sa[k] 与 sa[k+1]'))
  assert(html.includes('空串只允许 lcp(0,0)'))
  assert.equal((html.match(/class="cb"/g) || []).length, 1)
}

let copied, status, removed = false
const hooks = { ...React, useState: value => [value, next => { status = next }],
  useMemo: fn => fn(), useCallback: fn => fn, useRef: () => ({}), useEffect: () => {} }
const mock = load({ require: name => name === 'react' ? hooks : require(name),
  navigator: { clipboard: { writeText: async value => { copied = value } } },
  window: { clearTimeout() {}, setTimeout() { return 1 } },
  document: { createElement: () => ({ style: {}, select() {}, remove() { removed = true } }),
    body: { appendChild() {} }, execCommand: () => false },
})
function copyButton(code, props = {}) {
  return mock.CodeBlock({ code, ...props }).props.children[0].props.children.find(child => child.props?.onClick && child.props.className === 'cb-btn')
}
await copyButton('#ifndef TEMPLATE\n# define TEMPLATE\n#include <vector>\n  # include "helper.h"\r\nint value = 1; // 中文\n#endif\n').props.onClick()
assert.equal(copied, '#ifndef TEMPLATE\n# define TEMPLATE\nint value = 1; // 中文\n#endif')
assert.equal(status, '已复制')
await copyButton(saBlocks[0]).props.onClick()
assert.equal(copied, saBlocks[0], '复制 SA 保留接口注释及完整实现')
await copyButton(pieces.extension, { copyPrefix: pieces.base, compact: true }).props.onClick()
assert.equal(copied, compactCpp(pieces.base) + '\n\n' + compactCpp(pieces.extension))
assert.equal((copied.match(/\bstruct\s+DSU\b/g) || []).length, 1)
assert.equal((copied.match(/\bclass\s+GraphComponentDSU\b/g) || []).length, 1)
await copyButton(pieces.extension, { copyPrefix: pieces.base }).props.onClick()
assert.equal(copied, pieces.base + '\n\n' + pieces.extension)
const failed = load({ require: name => name === 'react' ? hooks : require(name), navigator: {},
  window: { clearTimeout() {}, setTimeout() { return 1 } },
  document: { createElement: () => ({ style: {}, select() {}, remove() { removed = true } }),
    body: { appendChild() {} }, execCommand: () => false },
})
const button = failed.CodeBlock({ code: 'int value;' }).props.children[0].props.children.find(child => child.props?.onClick && child.props.className === 'cb-btn')
await button.props.onClick()
assert.equal(status, '复制失败，请手动选择')
assert(removed)
console.log('UI self-check passed: ' + data.templates.length + ' templates, plain Markdown parity, all contracts rendered, idempotent comments, complete code, clipboard filtering/failure.')
