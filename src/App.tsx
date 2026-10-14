import { Bentos } from "@/components/bentos"
import { Demo } from "@/components/demo"
import { Features } from "@/components/features"
import { GridOverlay } from "@/components/grid-overlay"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { TextBlock } from "@/components/text-block"

export function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Demo />
        <Features />
        <TextBlock />
        <Bentos />
      </main>
      <GridOverlay />
    </div>
  )
}

export default App
