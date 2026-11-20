import type { TemplateSection } from './data/store'

export function parseTemplate(markdown: string): TemplateSection[] {
  const text = markdown.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const sections: TemplateSection[] = []
  const pattern = /^(#{1,2}) (.+)\n+([\s\S]*?)\n```cpp\n([\s\S]*?)\n```(?=\n|$)/gm
  let end = 0
  for (const match of text.matchAll(pattern)) {
    if (text.slice(end, match.index).trim() || match[1] !== (sections.length ? '##' : '#')) {
      throw new Error('模板必须以一级标题开头，扩展使用二级标题')
    }
    const paragraphs = match[3].trim().split(/(^~~~cpp\n[\s\S]*?^~~~$)/gm).flatMap((part, index) => {
      if (index % 2) return [part]
      if (/^~~~/m.test(part)) throw new Error('讲解片段必须使用配对的 ~~~cpp 和 ~~~')
      return part.trim().split(/\n\s*\n/).filter(Boolean).map(paragraph => paragraph.replace(/\n/g, ' '))
    })
    if (!paragraphs[0] || !match[4].trim() || /```|<\/?(?:details|summary)\b|^#/m.test(match[3])) {
      throw new Error('每节需要说明和一个正式 cpp 代码块；讲解片段请用 ~~~cpp，不支持折叠')
    }
    sections.push({ title: match[2], paragraphs, code: match[4], requiresBase: sections.length > 0 && paragraphs.some(paragraph => paragraph.startsWith('依赖上方')) })
    end = match.index + match[0].length
  }
  if (!sections.length || text.slice(end).trim()) throw new Error('模板格式不完整或含未解析内容')
  if (new Set(sections.map(section => section.title)).size !== sections.length) throw new Error('同一文件中的分节标题不能重复')
  for (const [index, section] of sections.entries()) {
    const dependency = section.paragraphs.find(paragraph => paragraph.startsWith('依赖本文件的'))
    if (!dependency) continue
    const names = Array.from(dependency.matchAll(/「([^」]+)」/g), match => match[1])
    if (!names.length || new Set(names).size !== names.length) throw new Error('依赖说明需要列出不重复的「分节标题」')
    section.dependencies = names.map(name => {
      const position = sections.findIndex(previous => previous.title === name)
      if (position < 0 || position >= index) throw new Error(`依赖必须指向本文件的前文分节：${name}`)
      return position
    })
    section.requiresBase = true
  }
  return sections
}
