import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

/**
 * Opaline's type scale, declared to tailwind-merge.
 *
 * tailwind-merge infers a class's group from its name, and a custom size token
 * it has never heard of gets filed as a colour. Two classes in one group means
 * the later wins, so a row built from a size plus an arbitrary colour shipped
 * the colour and silently dropped the size. A token added to `@theme` in
 * opaline.css has to be added here too.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{
        text: [
          "ui", "ui-sm",
          "content", "content-sm", "content-title",
          "source", "source-sm",
          "thread", "thread-tool",
        ],
      }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
