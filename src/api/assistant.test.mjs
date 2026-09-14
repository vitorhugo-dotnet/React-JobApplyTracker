import assert from 'node:assert/strict'
import test from 'node:test'
import { createSseParser } from '../lib/sse.ts'

test('parses SSE events split across arbitrary chunks', () => {
  const events = []
  const parser = createSseParser((event, data) => events.push({ event, data }))

  parser.push('event: token\ndata: {"content":"Hel')
  parser.push('lo"}\n\nevent: complete\ndata: {"sources":["APPLIC')
  parser.push('ATION_STATS"]}\n\n')
  parser.finish()

  assert.deepEqual(events, [
    { event: 'token', data: { content: 'Hello' } },
    { event: 'complete', data: { sources: ['APPLICATION_STATS'] } },
  ])
})

test('joins multiple data lines and ignores SSE comments', () => {
  const events = []
  const parser = createSseParser((event, data) => events.push({ event, data }))

  parser.push(': keep-alive\nevent: token\ndata: {"content":\ndata: "Hello"}\n\n')
  parser.finish()

  assert.deepEqual(events, [{ event: 'token', data: { content: 'Hello' } }])
})
