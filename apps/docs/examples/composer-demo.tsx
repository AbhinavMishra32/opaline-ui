import * as React from "react"
import { Globe, Paperclip } from "lucide-react"
import { Composer, ComposerPill, ThreadProvider } from "@opaline/ui/thread"

export default function ComposerDemo() {
  const [web, setWeb] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  return (
    <ThreadProvider labels={{ placeholder: "Plan, build, or ask anything" }}>
      <div className="op-thread w-full">
        <Composer
          busy={busy}
          hint={busy ? "Working… send to steer" : undefined}
          leading={
            <>
              <ComposerPill icon={Paperclip}>Attach</ComposerPill>
              <ComposerPill active={web} icon={Globe} onClick={() => setWeb(!web)}>
                Web
              </ComposerPill>
            </>
          }
          onStop={() => setBusy(false)}
          onSubmit={() => setBusy(true)}
        />
      </div>
    </ThreadProvider>
  )
}
