import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { loadIndex, type Payload, type TemplateItem, type TemplateSection } from './data/store'
import CodeBlock from './components/CodeBlock'
import SearchModal from './components/SearchModal'
import Sidebar from './components/Sidebar'
import { catalogTargets, copyPrefix, elementId, targetId, templateTargets } from './navigation'

const PREVIEW_TEMPLATE_ID = '01 - 数据结构/01 - 并查集（DSU）'
const SA_TEMPLATE_ID = '04 - 字符串/07 - 后缀数组（SA）'

function previewPayload(data: Payload, id = PREVIEW_TEMPLATE_ID): Payload {
  const template = data.templates.find(item => item.id === id)
  if (!template) throw new Error(`未找到样板：${id}`)
  return {
    ...data,
    meta: { ...data.meta, count: 1, chapters: 1 },
    templates: [template],
    nav: [{ chapter: template.chapter, concepts: [], sections: [{ section: template.section, items: templateTargets([template]).map(target => target.id) }] }],
  }
}

/** 从 hash 里还原模板 id：#/05%20-%20数论/03%20-%20扩展欧拉定理 */
function parseHash(hash: string): string {
  const m = /^#\/(.+)$/.exec(hash)
  return m ? decode(m[1]) : ''
}

/** decodeURIComponent 不会把 UTF-8 字节串当整体解码，逐字节 latin1 还原再解一次 */
function decode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    /* fallthrough */
  }
  try {
    const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff)
    return new TextDecoder().decode(bytes)
  } catch {
    return s
  }
}

/** 宽松匹配：id 里全角/半角括号、空格差异不应让深链失效 */
function matchId(h: string, items: { id: string }[]): string {
  const norm = (s: string) =>
    s.replace(/[（）]/g, (c) => (c === '（' ? '(' : ')')).replace(/\s+/g, ' ').trim()
  const t = norm(h)
  return items.find((x) => x.id === h)?.id ?? items.find((x) => norm(x.id) === t)?.id ?? items.find(x => norm(x.id) === t.replace(/::\d+$/, ''))?.id ?? ''
}

export default function App() {
  const preview = /^(dsu|sa)(?:-\d{8})?$/.exec(new URLSearchParams(location.search).get('preview') || '')
  const focused = Boolean(preview)
  const previewId = preview?.[1] === 'sa' ? SA_TEMPLATE_ID : PREVIEW_TEMPLATE_ID
  const [data, setData] = useState<Payload | null>(null)
  const [err, setErr] = useState('')
  const [cur, setCur] = useState('')
  const [search, setSearch] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [size, setSize] = useState(() => Number(localStorage.getItem('size') || 13))
  const [showLn, setShowLn] = useState(() => localStorage.getItem('ln') !== '0')
  const [collapsed, setCollapsed] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [picked, setPicked] = useState('')
  const [revealVersion, setRevealVersion] = useState(0)
  const [printing, setPrinting] = useState(false)
  const pendingRef = useRef('')
  const lockRef = useRef(0)

  useEffect(() => {
    const media = window.matchMedia('print')
    const updatePrinting = () => flushSync(() => setPrinting(media.matches))
    const beforePrint = () => flushSync(() => setPrinting(true))
    const afterPrint = () => setPrinting(false)
    setPrinting(media.matches)
    media.addEventListener('change', updatePrinting)
    window.addEventListener('beforeprint', beforePrint)
    window.addEventListener('afterprint', afterPrint)
    return () => {
      media.removeEventListener('change', updatePrinting)
      window.removeEventListener('beforeprint', beforePrint)
      window.removeEventListener('afterprint', afterPrint)
    }
  }, [])

  useEffect(() => {
    loadIndex()
      .then((d) => {
        const shown = focused ? previewPayload(d, previewId) : d
        setData(shown)
        const h = matchId(parseHash(location.hash), templateTargets(shown.templates)) || (focused ? previewId : '')
        if (h) {
          setCur(h)
          pendingRef.current = h
        }
      })
      .catch((e) => setErr(String(e)))
  }, [])

  // 深链定位：数据到位后把 hash 指向的板子滚到视口顶部（scrollspy 之前）
  useEffect(() => {
    const id = pendingRef.current
    if (!data || !id) return
    pendingRef.current = ''
    requestAnimationFrame(() => {
      const el = document.getElementById(elementId(id))
      if (!el) return
      el.scrollIntoView({ block: 'start' })
      setCur(id)
      lockRef.current = Date.now() + 500
    })
  }, [data])

  // 主题 / 字号持久化
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  useEffect(() => {
    document.documentElement.style.setProperty('--code-size', `${size}px`)
    localStorage.setItem('size', String(size))
  }, [size])
  useEffect(() => {
    document.documentElement.classList.toggle('hide-ln', !showLn)
    localStorage.setItem('ln', showLn ? '1' : '0')
  }, [showLn])

  const go = useCallback((t: TemplateItem, sectionIndex = 0) => {
    const id = targetId(t.id, sectionIndex)
    const focusContent = Boolean(document.querySelector('.app.drawer-on'))
    setCur(id)
    setPicked(id)
    setRevealVersion(version => version + 1)
    lockRef.current = Date.now() + 500
    history.replaceState(null, '', `#/${encodeURIComponent(id)}`)
    setDrawer(false)
    requestAnimationFrame(() => {
      const article = document.getElementById(elementId(id))
      article?.scrollIntoView({ block: 'start' })
      if (focusContent) article?.querySelector<HTMLElement>('.it-h')?.focus({ preventScroll: true })
    })
  }, [])

  useEffect(() => {
    if (!drawer) return
    const frame = requestAnimationFrame(() => {
      const directory = document.getElementById('template-directory')
      const target = directory?.querySelector<HTMLElement>('a[aria-current="location"]') ?? directory?.querySelector<HTMLElement>('button')
      target?.focus({ preventScroll: true })
    })
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('.mask')) return
      setDrawer(false)
      document.querySelector<HTMLButtonElement>('button.menu')?.focus()
    }
    window.addEventListener('keydown', close)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('keydown', close) }
  }, [drawer])

  // Ctrl/Cmd+K 唤起搜索
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearch(true)
      }
      if (e.key === '?' && !/^(INPUT|TEXTAREA)$/.test((e.target as HTMLElement)?.tagName)) {
        setHelp((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const targets = useMemo(() => data ? catalogTargets(data) : [], [data])

  useEffect(() => {
    const onHashChange = () => {
      const id = matchId(parseHash(location.hash), targets)
      const target = targets.find(item => item.id === id)
      if (target) go(target.template, target.sectionIndex)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [targets, go])

  // scrollspy：正文滚动时更新当前板子
  useEffect(() => {
    if (!data) return
    const onScroll = () => {
      if (Date.now() < lockRef.current) return // 程序化跳转刚发生，别抢
      // 取「阅读线」（视口顶部下方 140px）上的最后一篇。
      // 不能用 top < bestTop：重排瞬间各元素 top 可能相同，那样会错选第一篇。
      const limit = 140
      let best = ''
      for (const target of targets) {
        const el = document.getElementById(elementId(target.id))
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top <= limit) best = target.id
      }
      if (best) setCur(best)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [data, targets])

  const [help, setHelp] = useState(false)

  const groups = useMemo(() => {
    if (!data) return []
    const byId = new Map(targets.map(target => [target.id, target]))
    return data.nav.map(chapter => ({
      ...chapter,
      sections: chapter.sections.map(group => ({ ...group, targets: group.items.map(id => byId.get(id)!) })),
    }))
  }, [data, targets])

  const curItem = useMemo(
    () => targets.find(target => target.id === cur),
    [targets, cur],
  )

  if (err) return <div className="boot err">加载失败：{err}</div>
  if (!data)
    return (
      <div className="boot">
        正在加载模板索引…
      </div>
    )

  return (
    <div className={'app' + (drawer ? ' drawer-on' : '') + (focused ? ' preview-only' : '')}>
      <header className="top">
        {!focused && (
          <button className="icon menu" onClick={() => { setCollapsed(false); setRevealVersion(version => version + 1); setDrawer(value => !value) }} title="目录"
            aria-label={drawer ? '关闭目录' : '打开目录'} aria-expanded={drawer} aria-controls="template-directory">
            ☰
          </button>
        )}
        <a className="logo" href="#" onClick={(e) => (e.preventDefault(), window.scrollTo(0, 0))}>
          XCPC<span>板子</span>
        </a>
        <button className="searchbar" onClick={() => setSearch(true)}>
          <span>搜索模板，Ctrl+K</span>
          <kbd>Ctrl K</kbd>
        </button>
        <div className="tools">
          <button className="icon" onClick={() => setSize((s) => Math.max(11, s - 1))} title="缩小字号">
            A−
          </button>
          <button className="icon" onClick={() => setSize((s) => Math.min(20, s + 1))} title="放大字号">
            A+
          </button>
          <button
            className={'icon' + (showLn ? ' on' : '')}
            onClick={() => setShowLn((v) => !v)}
            title="行号开关"
          >
            #
          </button>
          <button
            className="icon"
            onClick={() => setDark((v) => !v)}
            title={dark ? '切到浅色' : '切到深色'}
          >
            {dark ? '☀' : '☾'}
          </button>
          <button className="icon" onClick={() => window.print()} title="打印 / 导出 PDF">
            ⎙
          </button>
          <button className="icon" onClick={() => setHelp((v) => !v)} title="快捷键（?）">
            ?
          </button>
        </div>
      </header>

      {help && (
        <div className="helpcard">
          <b>快捷键</b>
          <span>
            <kbd>Ctrl</kbd>+<kbd>K</kbd> 搜索
          </span>
          <span>
            <kbd>?</kbd> 本卡片
          </span>
          <span>
            <kbd>Ctrl</kbd>+<kbd>P</kbd> 打印 / 导出 PDF
          </span>
          <span>
            <kbd>Esc</kbd> 关闭弹窗
          </span>
        </div>
      )}

      <div className="body">
        <Sidebar
          nav={data.nav}
          items={data.templates}
          current={cur}
          onPick={go}
          collapsed={collapsed}
          revealVersion={revealVersion}
        />
        <button
          className="side-toggle"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? '展开目录' : '收起目录'}
          aria-label={collapsed ? '展开目录' : '收起目录'} aria-expanded={!collapsed} aria-controls="template-directory"
        >
          {collapsed ? '»' : '«'}
        </button>

        <main className="main" onClick={() => drawer && setDrawer(false)}>
          <section className="cover">
            <h1>XCPC Algorithm Templates</h1>
            <div className="rule" />
            <h2>即贴即用算法板子 · {targets.length} 个功能入口 / {data.meta.chapters} 章</h2>
            <p className="cov-meta">
              {data.meta.version} · {data.meta.date}
            </p>
            <p className="cov-note">
              先看调用顺序和必要限制；参数、返回值与边界见接口旁注释。
              复制代码不含头文件与行号。
            </p>
          </section>

          {groups.map(chapter => (
            <section className="chapter" key={chapter.chapter}>
              <h1 className="ch-h">{chapter.chapter}</h1>
              {chapter.guide?.length ? <Description paragraphs={chapter.guide} /> : null}
              {chapter.sections.map(group => <section className="category" key={group.section}>
                <h2 className="group-h">{group.section}</h2>
                {group.guide?.length ? <Description paragraphs={group.guide} /> : null}
                {group.targets.map(target => {
                  const section = target.template.sections[target.sectionIndex]
                  const nested = section.requiresBase && !section.dependencies
                  return <article
                    className={'item item-preview' + (nested ? ' template-extension' : '') + (cur === target.id ? ' on' : '') + (picked === target.id ? ' flash' : '')}
                    id={elementId(target.id)} key={target.id}
                  >
                    {nested ? <h4 className="it-h" tabIndex={-1}>{target.title}</h4> : <h3 className="it-h" tabIndex={-1}>{target.title}</h3>}
                    <TemplateContent sections={target.template.sections} activeSection={target.sectionIndex} fontSize={size} printing={printing} />
                  </article>
                })}
              </section>)}
            </section>
          ))}

          <footer className="foot">
            <span>
              {data.meta.version} · 更新于 {data.meta.date}
            </span>
            {curItem && <span>当前：{curItem.chapter} / {curItem.title}</span>}
          </footer>
        </main>
      </div>

      <SearchModal
        data={data}
        open={search}
        onClose={() => setSearch(false)}
        onPick={go}
      />
    </div>
  )
}

function TemplateContent({ sections, activeSection = 0, fontSize, printing }: { sections: TemplateSection[]; activeSection?: number; fontSize: number; printing: boolean }) {
  const section = sections[activeSection]
  return <>
    <Description paragraphs={section.paragraphs} />
    <CodeBlock code={section.code} copyPrefix={copyPrefix(sections, activeSection)} fontSize={fontSize} eager={printing} />
  </>
}

function Description({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="template-description">
      {paragraphs.map((paragraph, index) => paragraph.startsWith('~~~cpp\n') ? (
        <pre key={index}><code>{paragraph.slice(7, -4)}</code></pre>
      ) : (
        <p key={index}>{paragraph.replace(/\n/g, ' ').split(/(`[^`]+`)/g).map((part, token) => part.startsWith('`') ? <code key={token}>{part.slice(1, -1)}</code> : part)}</p>
      ))}
    </div>
  )
}
