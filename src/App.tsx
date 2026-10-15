import { FloatingToolbar } from "@/components/floating-toolbar"
import { Bentos } from "@/components/sections/bentos"
import { CallDemo } from "@/components/sections/call-demo"
import { Features } from "@/components/sections/features"
import { Footer } from "@/components/sections/footer"
import { Header } from "@/components/sections/header"
import { Hero } from "@/components/sections/hero"
import { TextBlock } from "@/components/sections/text-block"
import { Toaster } from "@/components/ui/toaster"

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
      <Footer />
      <FloatingToolbar />
      <Toaster />
    </div>
  )
}

export default App
