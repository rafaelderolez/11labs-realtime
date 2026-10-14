import { LazyMotion, MotionConfig } from "motion/react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import { ThemeProvider } from "@/components/theme-provider.tsx"

import App from "./App.tsx"

const loadMotionFeatures = () =>
  import("@/lib/motion-features").then((module) => module.default)

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={loadMotionFeatures} strict>
          <App />
        </LazyMotion>
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>
)
