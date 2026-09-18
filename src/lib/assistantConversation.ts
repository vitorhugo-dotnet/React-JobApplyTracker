const ASSISTANT_CONVERSATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidAssistantConversationId(value: unknown): value is string {
  return typeof value === 'string' && ASSISTANT_CONVERSATION_ID_PATTERN.test(value)
}

export function createAssistantConversationId(): string {
  return crypto.randomUUID()
}

export function ensureAssistantConversationId(value: unknown): string {
  return isValidAssistantConversationId(value) ? value : createAssistantConversationId()
}
