import * as React from "react"
import { Composer, ThreadProvider, type ComposerAttachment } from "@opaline/ui/thread"

export default function ComposerAttachmentsDemo() {
  const [attachments, setAttachments] = React.useState<ComposerAttachment[]>([])
  const [sent, setSent] = React.useState<string | null>(null)

  const attach = (files: File[]) => {
    for (const file of files) {
      const id = crypto.randomUUID()
      setAttachments((current) => [...current, { id, url: URL.createObjectURL(file), name: file.name, mimeType: file.type, status: "uploading" }])
      /* Stand-in for an upload. */
      window.setTimeout(() => setAttachments((current) => current.map((item) => (item.id === id ? { ...item, status: "ready" } : item))), 1200)
    }
  }

  return (
    <ThreadProvider>
      <div className="op-thread flex w-full flex-col gap-3">
        <Composer
          attachments={attachments}
          hint={sent ?? "Paste, drop or pick an image"}
          onAttach={attach}
          onRemoveAttachment={(id) => setAttachments((current) => current.filter((item) => item.id !== id))}
          onSubmit={(text, images) => {
            setSent(`Sent "${text}" with ${images.length} image${images.length === 1 ? "" : "s"}`)
            setAttachments([])
          }}
        />
      </div>
    </ThreadProvider>
  )
}
