import { useEffect, useMemo, useRef, useState } from 'react'
import type { NavChapter, TemplateItem } from '../data/store'
import { catalogTargets } from '../navigation'

interface Props {
  nav: NavChapter[]
  items: TemplateItem[]
  current: string
  onPick: (template: TemplateItem, sectionIndex?: number) => void
  collapsed: boolean
  revealVersion?: number
}

export default function Sidebar({ nav, items, current, onPick, collapsed, revealVersion = 0 }: Props) {
  const byId = useMemo(() => new Map(catalogTargets({ nav, templates: items }).map(target => [target.id, target])), [nav, items])
  const [openChapter, setOpenChapter] = useState(() => byId.get(current)?.chapter || nav[0]?.chapter || '')
  const [openGroup, setOpenGroup] = useState(() => {
    const target = byId.get(current)
    return target ? `${target.chapter}|${target.section}` : `${nav[0]?.chapter}|${nav[0]?.sections[0]?.section}`
  })
  const activeRef = useRef<HTMLAnchorElement>(null)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const target = byId.get(current)
    if (!target) return
    const key = `${target.chapter}|${target.section}`
    setOpenChapter(target.chapter)
    setOpenGroup(key)
  }, [current, byId, revealVersion])

  useEffect(() => {
    if (collapsed || !activeRef.current || !containerRef.current || !activeRef.current.getClientRects().length) return
    const bounds = activeRef.current.getBoundingClientRect()
    const viewport = containerRef.current.getBoundingClientRect()
    if (bounds.top < viewport.top + 12) containerRef.current.scrollTop += bounds.top - viewport.top - 12
    else if (bounds.bottom > viewport.bottom - 12) containerRef.current.scrollTop += bounds.bottom - viewport.bottom + 12
  }, [current, openChapter, openGroup, collapsed, revealVersion])

  if (collapsed) return <nav id="template-directory" className="side collapsed" aria-label="算法目录" hidden />

  return (
    <nav id="template-directory" className="side" aria-label="算法目录" ref={containerRef}>
      <div className="side-scroll">
        {nav.map((chapter, chapterIndex) => {
          const expanded = openChapter === chapter.chapter
          const chapterId = `directory-chapter-${chapterIndex}`
          const label = chapter.chapter.replace(/^第[零一二三四五六七八九十百]+章\s*/, '').replace(/^附录\s*/, '')
          return <div className="side-ch" key={chapter.chapter}>
            <button className="side-ch-h" type="button" title={chapter.chapter} aria-label={chapter.chapter}
              aria-expanded={expanded} aria-controls={chapterId}
              onClick={() => {
                setOpenChapter(expanded ? '' : chapter.chapter)
                if (!expanded) {
                  const target = byId.get(current)
                  setOpenGroup(`${chapter.chapter}|${target?.chapter === chapter.chapter ? target.section : chapter.sections[0]?.section}`)
                }
              }}>
              <svg className="dir-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="m4 2 4 4-4 4" /></svg>
              <span>{label}</span>
            </button>
            <div id={chapterId} hidden={!expanded}>
              {chapter.sections.map((group, groupIndex) => {
                const key = `${chapter.chapter}|${group.section}`
                const groupId = `directory-group-${chapterIndex}-${groupIndex}`
                const groupExpanded = openGroup === key
                return <div className="side-sec" key={key}>
                  <button className="side-sec-h" type="button" aria-expanded={groupExpanded} aria-controls={groupId}
                    onClick={() => setOpenGroup(previous => previous === key ? '' : key)}>
                    <svg className="dir-chevron" viewBox="0 0 12 12" aria-hidden="true"><path d="m4 2 4 4-4 4" /></svg>
                    <span>{group.section}</span>
                  </button>
                  <ul className="side-items" id={groupId} hidden={!groupExpanded}>
                    {group.items.map(id => {
                      const target = byId.get(id)
                      if (!target) return null
                      const section = target.template.sections[target.sectionIndex]
                      const nested = target.sectionIndex > 0 && section.requiresBase && !section.dependencies
                      return <li key={id}>
                        <a ref={id === current ? activeRef : undefined} className={'side-it' + (nested ? ' side-sub' : '') + (id === current ? ' on' : '')}
                          title={target.title} aria-current={id === current ? 'location' : undefined}
                          href={`#/${encodeURIComponent(id)}`} onClick={event => { event.preventDefault(); onPick(target.template, target.sectionIndex) }}>
                          {target.title}
                        </a>
                      </li>
                    })}
                  </ul>
                </div>
              })}
            </div>
          </div>
        })}
      </div>
    </nav>
  )
}
