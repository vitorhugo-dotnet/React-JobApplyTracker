type EventHandler = (event: string, data: unknown) => void

export function createSseParser(onEvent: EventHandler) {
  let buffer = ''

  const dispatch = (block: string) => {
    let event = 'message'
    const data: string[] = []
    for (const rawLine of block.split(/\r?\n/)) {
      if (!rawLine || rawLine.startsWith(':')) continue
      const separator = rawLine.indexOf(':')
      const field = separator < 0 ? rawLine : rawLine.slice(0, separator)
      const value = separator < 0 ? '' : rawLine.slice(separator + 1).replace(/^ /, '')
      if (field === 'event') event = value
      if (field === 'data') data.push(value)
    }
    if (!data.length) return
    onEvent(event, JSON.parse(data.join('\n')) as unknown)
  }

  return {
    push(chunk: string) {
      buffer += chunk
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() ?? ''
      blocks.forEach(dispatch)
    },
    finish() {
      if (buffer.trim()) dispatch(buffer)
      buffer = ''
    },
  }
}
