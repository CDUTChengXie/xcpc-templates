/** 内容索引的类型定义 + 加载（对应需求文档第八节生成的数据格式）。 */

export interface TemplateSection {
  title: string
  paragraphs: string[]
  code: string
  requiresBase: boolean
  dependencies?: number[]
}

export interface TemplateItem {
  id: string
  chapter: string
  chapterReq: string
  chapterKey: string
  section: string
  title: string
  tags: string[]
  complexity: string
  source: string
  sections: TemplateSection[]
  file: string
  code: string
  lines: number
}

export interface NavSection {
  section: string
  guide?: string[]
  items: string[]
}

export interface NavChapter {
  chapter: string
  concepts: { term: string; meaning: string }[]
  guide?: string[]
  sections: NavSection[]
}

export interface Payload {
  meta: { version: string; date: string; count: number; chapters: number }
  nav: NavChapter[]
  templates: TemplateItem[]
}

let cache: Payload | null = null

export async function loadIndex(): Promise<Payload> {
  if (cache) return cache
  // 分享版把同一份数据嵌入 HTML，直接双击打开时无需本地服务。
  const embedded = document.getElementById('xcpc-data')
  if (embedded?.textContent) {
    cache = JSON.parse(embedded.textContent) as Payload
    return cache
  }
  const base = import.meta.env.BASE_URL || './'
  // 模板数据不参与构建哈希。打印/导出前必须读到当前源码生成的新版本，
  // 否则浏览器会继续展示同 URL 下的旧缓存。
  const res = await fetch(`${base}templates.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`无法加载 templates.json: ${res.status}`)
  cache = (await res.json()) as Payload
  return cache
}
