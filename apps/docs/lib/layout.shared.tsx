import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { poppins } from "./fonts"
import { githubUrl } from "./shared"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <span className={`${poppins.className} text-[0.9375rem] tracking-[-0.01em]`}>Opaline UI</span>,
    },
    githubUrl,
    links: [{ text: "Docs", url: "/docs", active: "nested-url" }],
  }
}
