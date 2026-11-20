type CppPart = { kind: 'code' | 'literal' | 'comment'; text: string }

export function cppParts(code: string): CppPart[] {
  const parts: CppPart[] = []
  let start = 0
  let index = 0
  while (index < code.length) {
    let end = -1
    let kind: CppPart['kind'] = 'literal'
    if (code.startsWith('//', index)) {
      kind = 'comment'
      end = code.indexOf('\n', index + 2)
      while (end >= 0 && code[end - 1] === '\\') end = code.indexOf('\n', end + 1)
      if (end < 0) end = code.length
    } else if (code.startsWith('/*', index)) {
      kind = 'comment'
      end = code.indexOf('*/', index + 2)
      if (end < 0) return [{ kind: 'literal', text: code }]
      end += 2
    } else if (code.startsWith('R"', index)) {
      const opening = code.indexOf('(', index + 2)
      const delimiter = code.slice(index + 2, opening)
      if (opening >= 0 && /^[^\s()\\]{0,16}$/.test(delimiter)) {
        const closing = ')' + delimiter + '"'
        end = code.indexOf(closing, opening + 1)
        if (end < 0) return [{ kind: 'literal', text: code }]
        end += closing.length
      }
    } else if (code[index] === '"' || code[index] === "'") {
      const separator = code[index] === "'" && /\b\d[\w.']*$/.test(code.slice(0, index)) && /[\w]/.test(code[index + 1] || '')
      if (!separator) {
        end = index + 1
        while (end < code.length && code[end] !== code[index]) end += code[end] === '\\' ? 2 : 1
        if (end >= code.length) return [{ kind: 'literal', text: code }]
        end++
      }
    }
    if (end < 0) {
      index++
      continue
    }
    if (start < index) parts.push({ kind: 'code', text: code.slice(start, index) })
    parts.push({ kind, text: code.slice(index, end) })
    start = index = end
  }
  if (start < code.length) parts.push({ kind: 'code', text: code.slice(start) })
  return parts
}

export function compactCpp(code: string): string {
  if (/\\[ \t]*\r?\n|\b__LINE__\b/.test(code)) return code
  const parts = cppParts(code)
  if (parts.length === 1 && parts[0].kind === 'literal') return code
  const protectedLines = new Set<number>()
  let line = 0
  let offset = 0
  for (const part of parts) {
    const count = part.text.split('\n').length - 1
    if (part.kind === 'comment' && part.text.startsWith('/*') && count && /^\s*#/.test(code.slice(0, offset).split('\n').pop() || '')) return code
    if (part.kind === 'literal') for (let current = line; current < line + count; current++) protectedLines.add(current)
    line += count
    offset += part.text.length
  }
  const stripped = parts.map(part => part.kind === 'comment' ? part.text.replace(/[^\n]/g, ' ') : part.text).join('').split('\n')
  const original = code.split('\n')
  const output: string[] = []
  for (let current = 0; current < stripped.length; current++) {
    if (protectedLines.has(current)) output.push(stripped[current])
    else if (stripped[current].trim()) output.push(stripped[current].trimEnd())
    else if (!original[current].trim() && output.length && output[output.length - 1] !== '') output.push('')
  }
  while (output[output.length - 1] === '') output.pop()
  return output.join('\n')
}

export function splitDsuCode(code: string): { base: string; extension: string } {
  const structure = cppParts(code).map(part => part.kind === 'code' ? part.text : part.text.replace(/[^\n]/g, ' ')).join('')
  const definition = /\b(?:struct|class)\s+DSU\b[^;{]*\{/.exec(structure)
  if (!definition) throw new Error('未找到基础 DSU 定义')
  let depth = 1
  for (let index = definition.index + definition[0].length; index < structure.length; index++) {
    if (structure[index] === '{') depth++
    if (structure[index] !== '}' || --depth !== 0) continue
    const terminator = /^\s*;/.exec(structure.slice(index + 1))
    if (!terminator) throw new Error('基础 DSU 定义缺少结束分号')
    const end = index + 1 + terminator[0].length
    const extensionStart = structure.slice(end).search(/\S/)
    return { base: code.slice(0, end).trim(), extension: extensionStart < 0 ? '' : code.slice(end + extensionStart).trim() }
  }
  throw new Error('基础 DSU 定义不完整')
}
