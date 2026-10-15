import { GridOverlay } from "@/components/grid-overlay"
import { Bentos } from "@/components/sections/bentos"
import { CallDemo } from "@/components/sections/call-demo"
import { Features } from "@/components/sections/features"
import { Header } from "@/components/sections/header"
import { Hero } from "@/components/sections/hero"
import { TextBlock } from "@/components/sections/text-block"

function App() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <CallDemo />
        <Features />
        <TextBlock />
        <Bentos />
      </main>
      <GridOverlay />
    </div>
  )
}

export default App
