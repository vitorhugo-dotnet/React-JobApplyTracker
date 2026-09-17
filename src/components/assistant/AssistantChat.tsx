import { useEffect, useRef, useState, type FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import {
  AssistantStreamError,
  streamAssistantMessage,
  type AssistantErrorCode,
  type AssistantSource,
} from '@/api/assistant'
import { BrandLogo } from '@/components/layout/BrandLogo'
import { ErrorIcon, RetryIcon, SendIcon } from '@/components/ui/icons'
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

function retrySeconds(message: AssistantMessage, now: number): number {
  if (!message.retryAvailableAt) return 0
  return Math.max(0, Math.ceil((message.retryAvailableAt - now) / 1000))
}

function failureLabel(message: AssistantMessage, remainingSeconds: number): string {
  if (message.errorCode !== 'RATE_LIMITED') return 'Message failed.'
  if (remainingSeconds > 0) return 'Rate limit reached. Try again in ' + remainingSeconds + 's.'
  if (message.retryAvailableAt) return 'Rate limit reached. You can retry now.'
  return 'Rate limit reached. Try again.'
}

export function AssistantChat({ mobile, onClose }: AssistantChatProps) {
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const abortRef = useRef<AbortController | null>(null)
  const activeAnswerRef = useRef<number | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sequence = useRef(0)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  useEffect(() => () => {
    abortRef.current?.abort()
  }, [])

  useEffect(() => {
    let active = true
    loadAssistantHistory()
      .then((history) => {
        if (!active) return
        conversationIdRef.current = history.conversationId
        setMessages(history.messages)
        sequence.current = Math.max(0, ...history.messages.map((message) => message.id))
      })
      .finally(() => {
        if (active) setHistoryLoaded(true)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const conversationId = conversationIdRef.current
    if (historyLoaded && conversationId) {
      saveAssistantHistory(conversationId, messages).catch(() => {})
    }
  }, [historyLoaded, messages])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const hasActiveCountdown = messages.some((message) =>
      message.failed && message.retryAvailableAt && message.retryAvailableAt > Date.now(),
    )
    if (!hasActiveCountdown) return

    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [messages])

  const runRequest = async (userId: number, answerId: number, prompt: string) => {
    const conversationId = conversationIdRef.current
    if (!conversationId) return

    activeAnswerRef.current = answerId
    setStreaming(true)
    setMessages((current) => current.map((message) =>
      message.id === answerId
        ? { ...message, content: '', sources: undefined }
        : message,
    ))

    const controller = new AbortController()
    abortRef.current = controller
    try {
      await streamAssistantMessage(conversationId, prompt, {
        onToken: (content) => setMessages((current) => current.map((message) =>
          message.id === answerId ? { ...message, content: message.content + content } : message,
        )),
        onComplete: (sources) => setMessages((current) => current.map((message) => {
          if (message.id === answerId) return { ...message, sources }
          if (message.id === userId) {
            return {
              ...message,
              failed: undefined,
              errorCode: undefined,
              retryAvailableAt: undefined,
            }
          }
          return message
        })),
      }, controller.signal)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        const providerError = error instanceof AssistantStreamError
          ? error
          : new AssistantStreamError('PROVIDER_UNAVAILABLE', 'Assistant provider is unavailable')
        const errorCode: AssistantErrorCode = providerError.code
        const retryAvailableAt = providerError.retryAfterSeconds === undefined
          ? undefined
          : Date.now() + providerError.retryAfterSeconds * 1000
        const responseText = errorCode === 'RATE_LIMITED'
          ? 'Gemini rate limit exceeded.'
          : 'The assistant is temporarily unavailable.'

        setNow(Date.now())
        setMessages((current) => current.map((message) => {
          if (message.id === userId) {
            return {
              ...message,
              failed: true,
              errorCode,
              retryAvailableAt,
            }
          }
          if (message.id === answerId) {
            return { ...message, content: responseText, sources: undefined }
          }
          return message
        }))
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      if (activeAnswerRef.current === answerId) activeAnswerRef.current = null
      setStreaming(false)
    }
  }

  const send = async (rawPrompt: string) => {
    const prompt = rawPrompt.trim()
    if (!prompt || streaming || !conversationIdRef.current) return

    const userId = ++sequence.current
    const answerId = ++sequence.current
    setInput('')
    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', content: prompt, responseId: answerId },
      { id: answerId, role: 'assistant', content: '', prompt },
    ])
    await runRequest(userId, answerId, prompt)
  }

  const retry = async (message: AssistantMessage) => {
    if (streaming || !message.failed || message.responseId === undefined) return
    if (retrySeconds(message, Date.now()) > 0) return
    await runRequest(message.id, message.responseId, message.content)
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
    conversationIdRef.current = crypto.randomUUID()
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
        <BrandLogo compact />
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

        {messages.map((message) => {
          const remainingSeconds = retrySeconds(message, now)
          return (
            <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'gap-2.5')}>
              {message.role === 'assistant' && (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-mono-e5 text-xs">◆</span>
              )}
              {message.role === 'user' ? (
                <div className="flex max-w-[86%] flex-col items-end gap-1">
                  <div className={cn(
                    'rounded-lg bg-mono-0 p-3 text-[13px] whitespace-pre-wrap text-mono-w',
                    message.failed && 'ring-1 ring-red-500',
                  )}>
                    <p>{message.content}</p>
                  </div>
                  {message.failed && (
                    <div className="flex max-w-full items-center justify-end gap-1.5 text-[10px] text-red-600">
                      <span role="status" aria-label="Message failed" className="inline-flex shrink-0">
                        <ErrorIcon />
                      </span>
                      <span>{failureLabel(message, remainingSeconds)}</span>
                      {message.responseId !== undefined && (
                        <button
                          type="button"
                          aria-label="Retry message"
                          disabled={streaming || remainingSeconds > 0}
                          onClick={() => void retry(message)}
                          className="inline-flex shrink-0 items-center gap-1 underline disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <RetryIcon />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-[86%] rounded-lg bg-mono-f5 p-3 text-[13px] whitespace-pre-wrap">
                  {message.content
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
                    : <span className="animate-pulse text-mono-9">Thinking…</span>}
                  {!!message.sources?.length && (
                    <div className="mt-2 border-t border-mono-e5 pt-2 text-[10px] text-mono-9">
                      {message.sources.map((source) => SOURCE_LABELS[source]).join(' · ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
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
