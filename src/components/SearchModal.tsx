import { useEffect, useMemo, useRef, useState } from 'react'
import type { Payload, TemplateItem } from '../data/store'
import { catalogTargets } from '../navigation'

/** 需求 6.2：Ctrl/Cmd+K 唤起，模糊匹配标题与代码内容，结果按章/节/小节分组。 */
interface Props {
  data: Payload
  open: boolean
  onClose: () => void
  onPick: (t: TemplateItem, sectionIndex?: number) => void
}

/** 打分：标题命中 > 节命中 > 标签 > 代码。返回 0 表示不匹配。 */
function score(it: ReturnType<typeof catalogTargets>[number], q: string): number {
  const t = it.title.toLowerCase()
  const s = it.section.toLowerCase()
  const tag = it.tags.join(' ').toLowerCase()
  if (t === q) return 1000
  if (t.startsWith(q)) return 800
  if (t.includes(q)) return 600
  if (tag.includes(q)) return 400
  if (s.includes(q)) return 300
  if (it.chapter.toLowerCase().includes(q)) return 200
  if (q.length >= 2 && it.template.sections[it.sectionIndex].code.toLowerCase().includes(q)) return 50
  return 0
}

export default function SearchModal({ data, open, onClose, onPick }: Props) {
  const [q, setQ] = useState('')
  const [cur, setCur] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const targets = useMemo(() => catalogTargets(data), [data])

  useEffect(() => {
    if (open) {
      setQ('')
      setCur(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  const results = useMemo(() => {
    const key = q.trim().toLowerCase()
    if (!key) return []
    return targets
      .map((it) => ({ it, sc: score(it, key) }))
      .filter((r) => r.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 60)
      .map((r) => r.it)
  }, [q, targets])

  // 按「章 / 节」分组。
  //
  // 这里必须先建 Map 再输出，不能用「和上一条比较、变了就新开一组」的写法：
  // results 是按 score 排序的，同一个 章/节 的条目会被别的分数组打断，
  // 用相邻比较会得到 `Dijkstra / Dijkstra / MinCostFlow / HLD / LCA / LCA ...`
  // 这种**重复分组**，于是 React 侧出现重复 key，列表就再也刷不干净了
  // —— 表现是「清空输入框后旧结果还挂在页面上」「搜不到的东西一边显示未找到、
  // 一边把上一轮的结果列出来」。
  const groups = useMemo(() => {
    const m = new Map<string, { key: string; label: string; items: typeof targets }>()
    for (const it of results) {
      const key = `${it.chapter} / ${it.section}`
      let g = m.get(key)
      if (!g) {
        g = { key, label: key, items: [] }
        m.set(key, g)
      }
      g.items.push(it)
    }
    // 组内保持 score 降序（results 已排序），组间按首次出现顺序
    return [...m.values()]
  }, [results])

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  useEffect(() => setCur(0), [q])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCur((c) => Math.min(c + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCur((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const it = flat[cur]
      if (it) {
        onPick(it.template, it.sectionIndex)
        onClose()
      }
    }
  }

  if (!open) return null
  let idx = -1

  return (
    <div className="mask" onClick={onClose}>
      <div className="modal" ref={boxRef} onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="s-input"
          placeholder="搜索模板，Ctrl+K（试试：最大流 / 线段树 / KMP / 二分）"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="s-body">
          {!q && (
            <div className="s-hint">
              共 {targets.length} 个功能入口 · {data.meta.count} 份源文档 · 标题 / 标签 / 代码全文可搜
            </div>
          )}
          {q && !flat.length && (
            <div className="s-hint">
              未找到「{q}」，试试：最大流 / 线段树 / KMP / 二分
            </div>
          )}
          {groups.map((g) => (
            <div className="s-group" key={g.key}>
              <div className="s-label">{g.label}</div>
              {g.items.map((it) => {
                idx++
                const mine = idx
                return (
                  <div
                    key={`${g.key}::${it.id}`}
                    className={'s-item' + (mine === cur ? ' on' : '')}
                    onMouseEnter={() => setCur(mine)}
                    onClick={() => {
                      onPick(it.template, it.sectionIndex)
                      onClose()
                    }}
                  >
                    <span className="s-t">{it.title}</span>
                    <span className="s-tags">
                      {it.tags.slice(0, 3).map((t) => (
                        <em key={t}>{t}</em>
                      ))}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        <div className="s-foot">
          <span>↑↓ 选择</span>
          <span>Enter 跳转</span>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  )
}
