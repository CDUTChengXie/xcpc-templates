import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { highlight } from '../highlight'
import { compactCpp } from '../code-format'

/**
 * 需求 6.1：代码块是本项目最重要的组件。
 *   - 左侧固定行号列，不可选中（复制时不带行号）
 *   - 右上角悬浮「复制 / 字号- / 字号+」
 *   - 复制后按钮变绿勾「已复制」，1.5s 还原
 *   - 悬停行整行浅蓝高亮
 *   - 始终显示完整代码，屏幕阅读和打印使用相同内容
 *   - 代码不换行、横向滚动（保持与 PDF 一致的排版）
 */
interface Props {
  code: string
  /** 每张卡片的基准字号（px），受顶栏 A-/A+ 全局控制 */
  fontSize?: number
  eager?: boolean
  compact?: boolean
  copyPrefix?: string
}

export function CodeBlock({ code, fontSize = 13, eager = false, compact = false, copyPrefix = '' }: Props) {
  const [copyStatus, setCopyStatus] = useState('')
  const [localSize, setLocalSize] = useState(fontSize)
  const [showComments, setShowComments] = useState(false)
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  const container = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()
  const renderRows = visible || eager

  useEffect(() => setLocalSize(fontSize), [fontSize])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !container.current) return
    const observer = new IntersectionObserver(entries => {
      setVisible(entries.some(entry => entry.isIntersecting))
    }, { rootMargin: '800px 0px' })
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  const compactCode = useMemo(() => compact ? compactCpp(code) : code, [code, compact])
  const compactPrefix = useMemo(() => compact ? compactCpp(copyPrefix) : copyPrefix, [copyPrefix, compact])
  const displayed = showComments ? code : compactCode
  const prefix = showComments ? copyPrefix : compactPrefix
  const copyCode = useMemo(() => [prefix, displayed].filter(Boolean).join('\n\n').replace(/^[ \t]*#[ \t]*include\b[^\n]*(?:\n|$)/gm, '').trim(), [prefix, displayed])
  const lines = useMemo(() => displayed.replace(/\s+$/, '').split('\n'), [displayed])

  const rows = useMemo(
    () =>
      renderRows ? lines.map((ln, i) => {
        const toks = highlight(ln)
        return {
          no: i + 1,
          html: toks.length
            ? toks
                .map(
                  (t) =>
                    t.cls
                      ? `<span class="tok-${t.cls}">${escapeHtml(t.text)}</span>`
                      : escapeHtml(t.text),
                )
                .join('')
            : '&nbsp;',
        }
      }) : [],
    [lines, renderRows],
  )

  const copy = useCallback(async () => {
    try {
      try {
        await navigator.clipboard.writeText(copyCode)
      } catch {
        // 非安全上下文下退回 execCommand，失败时保留手动复制提示。
        const ta = document.createElement('textarea')
        ta.value = copyCode
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        try {
          ta.select()
          if (!document.execCommand('copy')) throw new Error('copy failed')
        } finally {
          ta.remove()
        }
      }
      setCopyStatus('已复制')
    } catch {
      setCopyStatus('复制失败，请手动选择')
    }
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopyStatus(''), 1500)
  }, [copyCode])

  return (
    <div className="cb" ref={container}>
      <div className="cb-bar">
        <span className="cb-title">代码模板</span>
        <button className="cb-btn" onClick={copy} title={copyPrefix ? '复制基础及扩展代码' : '复制代码（不含头文件与行号）'} aria-live="polite">
          {copyStatus === '已复制' ? <span className="ok">✓ 已复制</span> : copyStatus || (copyPrefix ? '复制（含基础）' : '复制')}
        </button>
        <span className="cb-sp" />
        {compactCode !== code && (
          <button className="cb-btn cb-comments" onClick={() => setShowComments(value => !value)} aria-pressed={showComments}>
            {showComments ? '隐藏注释' : '显示注释'}
          </button>
        )}
        <button
          className="cb-btn ico"
          onClick={() => setLocalSize((s) => Math.max(10, s - 1))}
          title="缩小字号"
        >
          A−
        </button>
        <span className="cb-size">{localSize}px</span>
        <button
          className="cb-btn ico"
          onClick={() => setLocalSize((s) => Math.min(20, s + 1))}
          title="放大字号"
        >
          A+
        </button>
      </div>
      <div className="cb-body" style={{ fontSize: `${localSize}px` }}>
        {!renderRows && <pre className="cb-plain">{lines.join('\n') || ' '}</pre>}
        {rows.map((r) => (
          <div className="cb-row" key={r.no}>
            <span className="cb-ln" aria-hidden="true">
              {r.no}
            </span>
            <span className="cb-code" dangerouslySetInnerHTML={{ __html: r.html }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default memo(CodeBlock)

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
