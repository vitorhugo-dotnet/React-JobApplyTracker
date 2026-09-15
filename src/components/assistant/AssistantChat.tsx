import { useEffect, useRef, useState, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { streamAssistantMessage, type AssistantSource } from '@/api/assistant'
import { SendIcon } from '@/components/ui/icons'
import { loadAssistantHistory, saveAssistantHistory, type AssistantMessage } from '@/lib/assistantHistory'
import { cn } from '@/lib/utils'

const assistantHtmlSchema = {
  ...defaultSchema,
  tagNames: defaultSchema.tagNames?.filter((tag) => tag !== 'img'),
}

const SUGGESTIONS = [
  'Summarize my applications',
  'Which applications need follow-up?',
  'Analyze a vacancy',
  'Tips for an interview',
]

const SOURCE_LABELS: Record<AssistantSource, string> = {
  APPLICATION_SEARCH: 'Application search',
  APPLICATION_DETAIL: 'Application details',
  APPLICATION_STATS: 'Application statistics',
  APPLICATION_TIMELINE: 'Application timeline',
  DASHBOARD_SUMMARY: 'Dashboard summary',
}

interface AssistantChatProps {
  mobile: boolean
  onClose: () => void
}

export function AssistantChat({ mobile, onClose }: AssistantChatProps) {
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const activeAnswerRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sequence = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      abortRef.current?.abort()
    }
  }, [onClose])
  useEffect(() => {
    let active = true
    loadAssistantHistory()
      .then((history) => {
        if (!active) return
        setMessages(history)
        sequence.current = Math.max(0, ...history.map((message) => message.id))
      })
      .finally(() => {
        if (active) setHistoryLoaded(true)
      })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (historyLoaded) saveAssistantHistory(messages).catch(() => {})
  }, [historyLoaded, messages])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim()
    if (!prompt || streaming) return
    const userId = ++sequence.current
    const answerId = ++sequence.current
    activeAnswerRef.current = answerId
    setInput('')
    setStreaming(true)
    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', content: prompt },
      { id: answerId, role: 'assistant', content: '', prompt },
    ])
    const controller = new AbortController()
    abortRef.current = controller
    try {
      await streamAssistantMessage(prompt, {
        onToken: (content) => setMessages((current) => current.map((message) =>
          message.id === answerId ? { ...message, content: message.content + content } : message,
        )),
        onComplete: (sources) => setMessages((current) => current.map((message) =>
          message.id === answerId ? { ...message, sources } : message,
        )),
      }, controller.signal)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setMessages((current) => current.map((message) => message.id === answerId
          ? { ...message, content: 'The assistant is temporarily unavailable.', failed: true }
          : message))
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      if (activeAnswerRef.current === answerId) activeAnswerRef.current = null
      setStreaming(false)
    }
  }

  const stop = () => {
    abortRef.current?.abort()
    const answerId = activeAnswerRef.current
    if (answerId !== null) {
      setMessages((current) => current.map((message) =>
        message.id === answerId && !message.content
          ? { ...message, content: 'Response stopped.' }
          : message,
      ))
    }
    setStreaming(false)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void send(input)
  }

  const clearConversation = () => {
    abortRef.current?.abort()
    abortRef.current = null
    activeAnswerRef.current = null
    setStreaming(false)
    setInput('')
    setMessages([])
  }

  return (
    <section
      role="dialog"
      aria-modal={mobile}
      aria-label="Ask ApplyWell"
      className={cn(
        'z-60 flex flex-col overflow-hidden border border-mono-e5 bg-mono-w text-mono-1 shadow-2xl',
        mobile ? 'fixed inset-0' : 'fixed bottom-5 right-5 h-[min(620px,calc(100vh-40px))] w-[390px] rounded-lg',
      )}
    >
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-mono-e5 px-4">
        <button
          type="button"
          aria-label={mobile ? 'Back' : 'Close Ask ApplyWell'}
          onClick={onClose}
          className={cn('grid h-8 w-8 place-items-center rounded hover:bg-mono-f5', !mobile && 'order-3 ml-auto')}
        >
          {mobile ? '←' : '×'}
        </button>
        <img src="/applywell-logo.svg" alt="" className="h-7 w-7" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[14px] font-semibold">Ask ApplyWell</h2>
          <p className="text-[11px] text-mono-9">AI assistant · Read-only</p>
        </div>
        <button
          type="button"
          aria-label="Clear conversation"
          disabled={!historyLoaded || messages.length === 0}
          onClick={clearConversation}
          className="text-[11px] underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
        {streaming && (
          <button type="button" onClick={stop} aria-label="Stop response" className="text-[11px] underline">
            Stop
          </button>
        )}
      </header>

      <div ref={scrollRef} aria-live="polite" className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-mono-e5 text-xs">◆</span>
          <div className="max-w-[86%] rounded-lg bg-mono-f5 p-3 text-[13px]">
            <p>Hello! 👋</p>
            <p className="mt-2">I can analyze your applications, summarize your progress, and help you prepare for interviews.</p>
            <p className="mt-2">How can I help?</p>
          </div>
        </div>

        {messages.map((message) => (
          <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'gap-2.5')}>
            {message.role === 'assistant' && (
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-mono-e5 text-xs">◆</span>
            )}
            <div className={cn(
              'max-w-[86%] rounded-lg p-3 text-[13px] whitespace-pre-wrap',
              message.role === 'user' ? 'bg-mono-0 text-mono-w' : 'bg-mono-f5',
            )}>
              {message.content
                ? message.role === 'assistant'
                  ? (
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw, [rehypeSanitize, assistantHtmlSchema]]}
                        components={{
                          a: ({ children, ...props }) => <a {...props} className="underline" target="_blank" rel="noreferrer">{children}</a>,
                          code: ({ children, className }) => <code className={cn('rounded bg-mono-e5 px-1 font-mono text-[12px]', className)}>{children}</code>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )
                  : <p>{message.content}</p>
                : <span className="animate-pulse text-mono-9">Thinking…</span>}
              {!!message.sources?.length && (
                <div className="mt-2 border-t border-mono-e5 pt-2 text-[10px] text-mono-9">
                  {message.sources.map((source) => SOURCE_LABELS[source]).join(' · ')}
                </div>
              )}
              {message.failed && message.prompt && (
                <button type="button" aria-label="Retry" onClick={() => void send(message.prompt!)} className="mt-2 underline">
                  Retry
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-mono-e5 bg-mono-w p-3">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={streaming || !historyLoaded}
              onClick={() => void send(suggestion)}
              className="shrink-0 rounded-full border border-mono-e5 px-2.5 py-1 text-[10px] hover:bg-mono-f5 disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            maxLength={4000}
            disabled={streaming || !historyLoaded}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your applications…"
            aria-label="Message"
            className="field-input min-w-0 flex-1"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!input.trim() || streaming || !historyLoaded}
            className="grid h-9 w-9 shrink-0 place-items-center rounded bg-mono-0 text-mono-w disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon size={14} />
          </button>
        </form>
      </div>
    </section>
  )
}
