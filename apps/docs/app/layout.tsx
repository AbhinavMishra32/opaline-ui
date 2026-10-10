import type { Metadata } from "next"
import { RootProvider } from "fumadocs-ui/provider/next"
import "./global.css"

export const metadata: Metadata = {
  title: { default: "Opaline UI", template: "%s · Opaline UI" },
  description: "React components for building agentic app interfaces: an agent thread built to be read, and the controls and surfaces around it.",
}

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
