import { createCn } from "cn/config"

// Keep in sync with the type scale in src/styles/typography.css. Without this,
// `cn` reads `text-label` as a color and drops `text-primary-foreground`.
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "title",
            "body",
            "body-sm",
            "label",
            "label-sm",
            "label-xs",
            "micro",
          ],
        },
      ],
    },
  },
})
