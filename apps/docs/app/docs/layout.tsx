import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { BlocksIcon, GithubIcon, PaletteIcon } from "lucide-react";
import { baseOptions } from "@/lib/layout";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      {...baseOptions}
      tree={source.getPageTree()}
      links={[
        { icon: <BlocksIcon />, text: "Components", url: "/docs/components" },
        { icon: <PaletteIcon />, text: "Foundation", url: "/docs/foundation" },
        { icon: <GithubIcon />, text: "GitHub", url: "https://github.com/AbhinavMishra32/opaline-ui", external: true },
      ]}
      sidebar={{ defaultOpenLevel: 1, prefetch: false }}
    >
      {children}
    </DocsLayout>
  );
}
