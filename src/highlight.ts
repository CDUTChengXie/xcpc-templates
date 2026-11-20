/**
 * C++ 语法高亮（零依赖正则实现）。
 *
 * 为什么不用 shiki：需求文档把它列为建议项，但本项目要能**离线**使用与打印，
 * 而 shiki 在浏览器端需要拉 WASM 并异步着色。这里改为构建无关的纯函数，
 * 配色与需求文档 5.2 的 token 色一致。
 *
 * 代价是不支持复杂的模板/原始字符串上下文；对模板合集这种场景足够。
 */

export interface Token {
  cls: string
  text: string
}

const RE = new RegExp(
  [
    '(?<com>/\\*[\\s\\S]*?\\*/|//[^\\n]*)',
    '(?<str>"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')',
    '(?<chr>\'(?:\\\\.|[^\'\\\\\\n])\')',
    '(?<pp>^[ \\t]*#\\s*\\w+[^\\n]*)',
    '(?<num>\\b0[xX][0-9a-fA-F]+\\b|\\b\\d+\\.?\\d*(?:[eE][+-]?\\d+)?[uUlLfF]*\\b)',
    '(?<kw>\\b(?:if|else|for|while|do|switch|case|default|break|continue|return|goto)\\b)',
    '(?<kw2>\\b(?:void|int|long|short|char|bool|float|double|unsigned|signed|auto|' +
      'const|constexpr|static|inline|extern|mutable|virtual|override|explicit|' +
      'template|typename|class|struct|union|enum|namespace|using|public|private|' +
      'protected|new|delete|sizeof|decltype|noexcept|operator|this|nullptr|' +
      'true|false|and|or|not)\\b)',
    '(?<typ>\\b(?:std|string|vector|map|unordered_map|set|unordered_set|pair|tuple|' +
      'deque|queue|stack|priority_queue|array|function|optional|bitset|complex|' +
      'int8_t|int16_t|int32_t|int64_t|uint8_t|uint16_t|uint32_t|uint64_t|' +
      'size_t|ptrdiff_t|i64|i128|u32|u64|i8|i16|i32|u8|u16|ll|ull)\\b)',
    '(?<fn>\\b[A-Za-z_]\\w*(?=\\s*\\())',
    '(?<cls>\\b[A-Z]\\w*\\b)',
  ].join('|'),
  'gm',
)

export function highlight(line: string): Token[] {
  const out: Token[] = []
  let last = 0
  let m: RegExpExecArray | null
  RE.lastIndex = 0
  while ((m = RE.exec(line)) !== null) {
    if (m.index > last) out.push({ cls: '', text: line.slice(last, m.index) })
    const g = (m.groups ?? {}) as Record<string, string | undefined>
    let cls = ''
    for (const k of ['com', 'str', 'chr', 'pp', 'num', 'kw', 'kw2', 'typ', 'fn', 'cls']) {
      if (g[k] !== undefined) {
        cls = k
        break
      }
    }
    out.push({ cls, text: m[0] })
    last = m.index + m[0].length
  }
  if (last < line.length) out.push({ cls: '', text: line.slice(last) })
  return out
}