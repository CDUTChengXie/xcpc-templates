import assert from 'node:assert/strict'
import { readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseTemplate } from '../src/markdown.ts'
import { catalogTargets, templateTargets } from '../src/navigation.ts'

const web = fileURLToPath(new URL('..', import.meta.url))
const content = path.join(web, 'content')
const dataFile = path.join(web, 'data/templates.json')
const publicFile = path.join(web, 'public/templates.json')
const payload = JSON.parse(await readFile(dataFile, 'utf8'))
const checkOnly = process.argv.includes('--check')
const broadTags = new Set(['几何', '数论', '图与网络', '数据结构', '字符串', '动态规划', '杂类', '多项式', '其他'])
assert.equal(payload.templates.length, payload.meta.count, '模板数量与索引不符')
assert.equal(new Set(payload.templates.map(item => item.file)).size, payload.templates.length, '重复的模板路径')
const files = (await readdir(content, { recursive: true })).filter(file => file.endsWith('.md'))
assert.deepEqual(files.map(file => file.replaceAll('\\', '/')).sort(), payload.templates.map(item => item.file.replace(/^content\//, '')).sort(), 'Markdown 与索引不一致；增删模板需同时调整导航')

for (const item of payload.templates) {
  const file = path.resolve(web, item.file)
  assert(file.startsWith(content + path.sep) && file.endsWith('.md'), '模板路径必须位于 content：' + item.file)
  const markdown = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  item.sections = parseTemplate(markdown)
  item.title = (item.title.match(/^\d+\s*-\s*/)?.[0] || '') + item.sections[0].title
  item.complexity = item.sections[0].paragraphs.at(-1)
  delete item.info
  item.code = item.sections.map(section => section.code).join('\n\n')
  item.lines = item.code.split('\n').length
  item.tags = [...new Set(item.tags.filter(tag => !broadTags.has(tag)))]
}

payload.nav = JSON.parse(await readFile(path.join(web, 'data/catalog.json'), 'utf8'))
assert(payload.nav.length && new Set(payload.nav.map(chapter => chapter.chapter)).size === payload.nav.length, '章节名称不能重复或为空')
for (const chapter of payload.nav) {
  assert(chapter.chapter && chapter.sections.length && new Set(chapter.sections.map(group => group.section)).size === chapter.sections.length, '章内分组不能重复或为空')
  for (const group of chapter.sections) assert(group.section && group.items.length, '目录分组名称或条目不能为空')
}
const targets = catalogTargets(payload)
assert.equal(new Set(targets.map(target => target.id)).size, targets.length, '目录不能重复登记同一节')
assert.deepEqual(targets.map(target => target.id).sort(), templateTargets(payload.templates).map(target => target.id).sort(), '目录必须覆盖全部模板和分节')
for (const target of targets.filter(target => target.sectionIndex === 0)) {
  target.template.chapter = target.chapter
  target.template.section = target.section
}
for (const target of targets.filter(target => target.template.sections[target.sectionIndex].requiresBase && !target.template.sections[target.sectionIndex].dependencies)) {
  assert(target.chapter === target.template.chapter && target.section === target.template.section, '依赖基础的扩展必须与基础归为同组：' + target.id)
}
payload.templates = targets.filter(target => target.sectionIndex === 0).map(target => target.template)
payload.meta.chapters = payload.nav.length
payload.meta.date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const output = JSON.stringify(payload, null, 1)
const byId = new Map(targets.map(target => [target.id, target]))
const directory = ['# XCPC 功能目录', '', `${targets.length} 个功能入口，来自 ${payload.templates.length} 份源文档。按下列章节阅读；同一源文件中的不同功能分别列出，链接打开对应 Markdown。`, '', '复制依赖基础的功能时，网页会自动附带必要代码；正文不折叠。', '']
for (const chapter of payload.nav) {
  directory.push('## ' + chapter.chapter, '')
  if (chapter.guide?.length) directory.push(chapter.guide.join('\n\n'), '')
  for (const group of chapter.sections) {
    directory.push('### ' + group.section, '')
    if (group.guide?.length) directory.push(group.guide.join('\n\n'), '')
    for (const id of group.items) {
      const target = byId.get(id)
      const section = target.template.sections[target.sectionIndex]
      const nested = section.requiresBase && !section.dependencies
      const link = target.template.file.split('/').map(part => encodeURIComponent(part).replace(/[()]/g, character => '%' + character.charCodeAt(0).toString(16))).join('/')
      directory.push((nested ? '  ' : '') + '- [' + target.title.replace(/[\\[\]]/g, '\\$&') + '](' + link + ')')
    }
    directory.push('')
  }
}
for (const [file, content] of [[dataFile, output], [publicFile, output], [path.join(web, '目录.md'), directory.join('\n')]]) {
  const previous = await readFile(file, 'utf8').catch(error => {
    if (error.code === 'ENOENT' && !checkOnly) return ''
    throw error
  })
  if (checkOnly) assert.equal(previous, content, file + ': 尚未与 Markdown 同步')
  else if (previous !== content) {
    const temporary = `${file}.${process.pid}.tmp`
    try {
      await writeFile(temporary, content)
      await rename(temporary, file)
    } finally {
      await rm(temporary, { force: true })
    }
  }
}
console.log(`${checkOnly ? '检查通过' : '已同步'}：${payload.templates.length} 份 Markdown，${targets.length} 个功能入口，${payload.nav.length} 章；目录、说明与代码一致。`)
