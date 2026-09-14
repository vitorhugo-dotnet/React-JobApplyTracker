import { ChatIcon } from '@/components/ui/icons'

export function AssistantLauncher({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open Ask ApplyWell"
      className="fixed bottom-5 right-5 z-50 hidden h-12 w-12 place-items-center rounded-full bg-mono-0 text-mono-w shadow-xl transition-transform hover:scale-105 active:scale-95 md:grid"
    >
      <ChatIcon size={18} />
    </button>
  )
}
