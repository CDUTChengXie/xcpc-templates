import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { catalogTargets, copyPrefix, elementId } from '../src/navigation.ts'

const require = createRequire(import.meta.url)
const { chromium } = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright-core'))
const base = process.env.XCPC_URL || 'http://127.0.0.1:5173/'
const data = JSON.parse(await readFile(new URL('../public/templates.json', import.meta.url), 'utf8'))
const targets = catalogTargets(data)
const byId = new Map(targets.map(target => [target.id, target]))
const dsuId = '01 - 数据结构/01 - 并查集（DSU）'
const ioId = '00 - 基础/03 - int128 与基础函数'
const timerId = '09 - 进阶补充/05 - 序列技巧（LIS LCS 约瑟夫 与对拍工具）::4'
const printRows = list => list.reduce((sum, target) => sum + target.template.sections[target.sectionIndex].code.trimEnd().split('\n').length, 0)
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const article = id => page.locator(`article[id="${elementId(id)}"]`)
  const link = id => page.locator(`a.side-it[href="#/${encodeURIComponent(id)}"]`)
  async function navigate(id) {
    const target = byId.get(id)
    const chapterButton = page.getByRole('button', { name: target.chapter, exact: true })
    if (await chapterButton.getAttribute('aria-expanded') === 'false') await chapterButton.click()
    const groupButton = chapterButton.locator('..').getByRole('button', { name: target.section, exact: true })
    if (await groupButton.getAttribute('aria-expanded') === 'false') await groupButton.click()
    await link(id).click()
    await page.waitForFunction(expected => decodeURIComponent(location.hash.slice(2)) === expected, id)
    assert.equal(await link(id).getAttribute('aria-current'), 'location')
    assert.equal(await article(id).locator('xpath=ancestor::section[contains(@class,"chapter")][1]').locator('.ch-h').innerText(), target.chapter)
    assert.equal(await article(id).locator('xpath=ancestor::section[contains(@class,"category")][1]').locator('.group-h').innerText(), target.section)
  }
  async function checkCopy(id) {
    const target = byId.get(id)
    const section = target.template.sections[target.sectionIndex]
    const expected = [copyPrefix(target.template.sections, target.sectionIndex), section.code].filter(Boolean).join('\n\n').trim()
    await article(id).locator('button[title^="复制"]').click()
    await page.waitForFunction(value => navigator.clipboard.readText().then(text => text.replace(/\r\n/g, '\n').trim() === value), expected)
  }
  async function search(query, expectedId) {
    await page.keyboard.press('Control+k')
    await page.locator('.s-input').fill(query)
    await page.locator('.s-t').filter({ hasText: byId.get(expectedId).title, exact: true }).waitFor()
    await page.keyboard.press('Enter')
    await page.waitForFunction(expected => decodeURIComponent(location.hash.slice(2)) === expected, expectedId)
    await link(expectedId).waitFor({ state: 'visible' })
    assert.equal(await link(expectedId).getAttribute('aria-current'), 'location')
  }
  async function checkSelectedContrast() {
    const contrast = await page.locator('.side-it.on').evaluate(element => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      const context = canvas.getContext('2d')
      context.fillStyle = getComputedStyle(document.querySelector('.side')).backgroundColor
      context.fillRect(0, 0, 1, 1)
      context.fillStyle = getComputedStyle(element).backgroundColor
      context.fillRect(0, 0, 1, 1)
      const background = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3)
      context.fillStyle = getComputedStyle(element).color
      context.fillRect(0, 0, 1, 1)
      const foreground = Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3)
      const luminance = channels => channels.map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0)
      const values = [luminance(background), luminance(foreground)].sort((left, right) => left - right)
      return (values[1] + .05) / (values[0] + .05)
    })
    assert(contrast >= 4.5, `选中条目的文字对比度不足：${contrast}`)
  }
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.cb-row')
  const initial = await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return { readyMs: performance.now(), nodes: document.querySelectorAll('*').length, rows: document.querySelectorAll('.cb-row').length }
  })
  const interactionMs = await page.evaluate(async () => {
    const start = performance.now()
    document.querySelector('button[title="切到深色"]').click()
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return performance.now() - start
  })
  console.log(JSON.stringify({ ...initial, interactionMs }))
  assert(initial.rows < 5000 && initial.nodes < 30000)
  assert(interactionMs < 300)
  assert.equal(await page.locator('.item').count(), targets.length)
  assert.equal(await page.locator('.side-ch-h[aria-expanded="true"]').count(), 1, '默认只展开一个章节')
  assert.equal(await page.locator('.side-sec-h[aria-expanded="true"]').count(), 1, '默认只展开一个分类')
  assert.equal(await page.locator('.side-ico').count(), 0, '收起目录不再留下竖排按钮栏')
  assert.equal(await page.locator('.cb').count(), targets.length)
  assert.equal(await page.locator('details, summary, .quick-card, .cb-comments').count(), 0)
  assert.deepEqual(await page.locator('article.item').evaluateAll(nodes => nodes.map(node => node.id)), targets.map(target => elementId(target.id)), '正文和目录必须采用相同功能顺序')
  const dp = data.nav.find(chapter => chapter.chapter === '第十章 动态规划')
  assert(dp.guide?.length && dp.sections.every(group => group.guide?.length), 'DP 章首和每类都应有起手提示')
  const dpChapter = page.locator('.chapter').filter({ has: page.getByRole('heading', { name: dp.chapter, exact: true }) })
  const guides = dpChapter.locator(':scope > .template-description, :scope > .category > .template-description')
  const paragraphs = [...dp.guide, ...dp.sections.flatMap(group => group.guide)]
  assert.equal(await guides.count(), dp.sections.length + 1)
  assert.deepEqual(await guides.locator('p').allTextContents(), paragraphs.map(paragraph => paragraph.replace(/`([^`]+)`/g, '$1')))
  const directory = await readFile(new URL('../目录.md', import.meta.url), 'utf8')
  assert(paragraphs.every(paragraph => directory.includes(paragraph)), '网页与 Markdown 的 DP 提示一致')
  const last = targets.at(-1)
  assert((await article(last.id).locator('.cb-body').textContent()).includes(last.template.sections[last.sectionIndex].code.trim()))
  await navigate(dsuId + '::1')
  assert((await link(dsuId + '::1').getAttribute('class')).includes('side-sub'))
  await checkSelectedContrast()
  await page.locator('.side').screenshot({ path: path.join(os.tmpdir(), 'xcpc-sidebar-dark.png') })
  await page.reload()
  await page.waitForSelector('.side-it[aria-current="location"]')
  assert.equal(await page.locator('.side-it.on').innerText(), '连通块统计（扩展）')
  const dsuChapter = page.getByRole('button', { name: byId.get(dsuId).chapter, exact: true })
  await dsuChapter.click()
  await search('连通块统计（扩展）', dsuId + '::1')
  assert.equal(await dsuChapter.getAttribute('aria-expanded'), 'true', '再次搜索当前板子也会展开被收起的章节')
  await dsuChapter.locator('..').getByRole('button', { name: '并查集', exact: true }).click()
  await search('连通块统计（扩展）', dsuId + '::1')
  assert.equal(await link(dsuId + '::1').isVisible(), true)
  for (const target of targets.filter(target => target.sectionIndex > 0)) {
    await navigate(target.id)
    await checkCopy(target.id)
  }
  await search('KMP', '04 - 字符串/01 - KMP')
  await checkCopy('04 - 字符串/01 - KMP')
  await page.reload()
  await page.waitForSelector('.side-it[aria-current="location"]')
  assert.equal(await page.locator('.side-it.on').innerText(), 'KMP')
  const hashKey = '09 - 进阶补充/17 - 随机数据生成与组合键哈希'
  await search('组合键哈希（嵌套容器）', hashKey)
  assert(!(await article(hashKey).locator('.cb-body').textContent()).includes('SampleTools'), '哈希入口不能再混入随机数据生成器')
  await search('128 位整数输入输出', ioId)
  assert(!(await article(ioId).locator('.cb-body').textContent()).includes('ceilDiv'), '输入输出入口不再混入取整函数')
  await checkCopy(ioId)
  await navigate(timerId)
  assert.equal(await article(timerId).locator('xpath=ancestor::section[contains(@class,"chapter")][1]').locator('.ch-h').innerText(), '第零章 基础与工具')
  await checkCopy(timerId)
  const oldTernaryURL = new URL(base)
  oldTernaryURL.hash = '/' + encodeURIComponent('00 - 基础/07 - 三分法::1')
  await page.goto(oldTernaryURL.href)
  await page.waitForSelector('.side-it[aria-current="location"]')
  assert.equal(await page.locator('.side-it.on').innerText(), '三分与黄金分割搜索')
  const longId = '02 - 图论/23 - 负边最短路与全源最短路'
  await navigate(longId)
  const longTitle = await link(longId).evaluate(element => ({
    whitespace: getComputedStyle(element).whiteSpace,
    width: element.clientWidth, scrollWidth: element.scrollWidth, height: element.getBoundingClientRect().height,
  }))
  assert.equal(longTitle.whitespace, 'normal')
  assert(longTitle.height > 32 && longTitle.scrollWidth <= longTitle.width + 1, '长标题应完整换行而不是截断或溢出')
  await page.emulateMedia({ media: 'print' })
  await page.waitForFunction(expected => document.querySelectorAll('.cb-row').length === expected, printRows(targets))
  assert((await Promise.all((await guides.all()).map(guide => guide.isVisible()))).every(Boolean), '打印保留 DP 提示')
  assert.equal(await page.locator('.cb-plain').count(), 0)
  assert.equal(await page.locator('.side').isVisible(), false)
  await page.emulateMedia({ media: 'screen' })
  await page.waitForFunction(() => document.querySelectorAll('.cb-row').length < 5000)
  const synchronized = await page.evaluate(() => {
    window.dispatchEvent(new Event('beforeprint'))
    return document.querySelectorAll('.cb-row').length
  })
  assert.equal(synchronized, printRows(targets))
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')))
  const focused = new URL(base)
  focused.searchParams.set('preview', 'dsu')
  focused.hash = '/' + encodeURIComponent(dsuId + '::1')
  await page.goto(focused.href)
  await page.waitForSelector('.side-it[aria-current="location"]', { state: 'attached' })
  assert.equal(await page.locator('.item').count(), 2)
  assert.equal(await page.locator('.side').isVisible(), false)
  assert.equal(await page.locator('.cover').isVisible(), false)
  await checkCopy(dsuId + '::1')
  await page.emulateMedia({ media: 'print' })
  await page.waitForFunction(expected => document.querySelectorAll('.cb-row').length === expected, printRows(targets.filter(target => target.template.id === dsuId)))
  await page.emulateMedia({ media: 'screen' })
  const inspection = new URL(base)
  inspection.hash = '/' + encodeURIComponent(ioId)
  await page.goto(inspection.href)
  await page.waitForSelector('.side-it[aria-current="location"]')
  if (await page.locator('button[title="切到浅色"]').count()) await page.locator('button[title="切到浅色"]').click()
  await checkSelectedContrast()
  await page.getByRole('button', { name: '收起目录', exact: true }).click()
  assert.equal(await page.locator('.side').isVisible(), false)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: '打开目录', exact: true }).click()
  await page.waitForFunction(() => Math.abs(document.querySelector('.side').getBoundingClientRect().left) < 1)
  assert.equal(await page.locator('.side').isVisible(), true, '桌面收起后切到手机仍可打开目录')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('.side').getBoundingClientRect().right <= 1)
  assert.equal(await page.locator('button.menu').evaluate(element => element === document.activeElement), true)
  for (const viewport of [{ width: 1400, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport)
    await page.waitForFunction(() => innerWidth >= 1024 || document.querySelector('.side').getBoundingClientRect().right <= 1)
    await article(ioId).evaluate(element => element.scrollIntoView({ block: 'start' }))
    await article(ioId).locator('.cb-row').first().waitFor()
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: path.join(os.tmpdir(), `xcpc-reorganized-${viewport.width}.png`) })
  }
  await page.locator('button.menu').click()
  await page.waitForFunction(() => Math.abs(document.querySelector('.side').getBoundingClientRect().left) < 1)
  assert.equal(await page.locator('.side').evaluate(element => element.contains(document.activeElement)), true)
  await page.screenshot({ path: path.join(os.tmpdir(), 'xcpc-reorganized-menu.png') })
  await link(ioId).focus()
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('.side').getBoundingClientRect().right <= 1)
  assert.equal(await article(ioId).locator('.it-h').evaluate(element => element === document.activeElement), true, '手机选择板子后焦点转到正文标题')
  assert.deepEqual(errors, [])
  console.log(`PASS: ${targets.length} 个入口的目录/正文一致；分节跳转、精确依赖复制、旧链接刷新、搜索、完整打印及桌面/手机检查。`)
} finally {
  await browser.close()
}
