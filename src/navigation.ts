import type { Payload, TemplateItem, TemplateSection } from './data/store'

export function copyPrefix(sections: TemplateSection[], sectionIndex: number): string {
  const required = new Set<number>()
  function collect(index: number) {
    const section = sections[index]
    const dependencies = section.dependencies ?? (section.requiresBase ? Array.from({ length: index }, (_, position) => position) : [])
    for (const dependency of dependencies) {
      if (!Number.isInteger(dependency) || dependency < 0 || dependency >= index) throw new Error('复制依赖必须指向前文分节')
      if (required.has(dependency)) continue
      required.add(dependency)
      collect(dependency)
    }
  }
  collect(sectionIndex)
  return [...required].sort((left, right) => left - right).map(index => sections[index].code).join('\n\n')
}

export function targetId(id: string, sectionIndex = 0): string {
  return sectionIndex ? `${id}::${sectionIndex}` : id
}

export function elementId(id: string): string {
  return `t-${encodeURIComponent(id)}`
}

export function templateTargets(items: TemplateItem[]) {
  return items.flatMap(template => template.sections.map((section, sectionIndex) => ({
    id: targetId(template.id, sectionIndex),
    title: section.title,
    tags: template.sections.length === 1 ? template.tags : template.tags.filter(tag => [section.title, ...section.paragraphs].join('\n').toLowerCase().includes(tag.toLowerCase())),
    chapter: template.chapter,
    section: template.section,
    template,
    sectionIndex,
  })))
}

export function catalogTargets(data: Pick<Payload, 'nav' | 'templates'>) {
  const targets = new Map(templateTargets(data.templates).map(target => [target.id, target]))
  return data.nav.flatMap(chapter => chapter.sections.flatMap(group => group.items.map(id => {
    const target = targets.get(id)
    if (!target) throw new Error(`目录引用不存在：${id}`)
    return { ...target, chapter: chapter.chapter, section: group.section }
  })))
}
