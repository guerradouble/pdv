import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UtensilsCrossed, ArrowRight, ShoppingBag } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Sistema de Gestão de Cardápio</h1>

          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Gerencie o cardápio do seu restaurante de forma simples e eficiente
          </p>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/cadastro">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <UtensilsCrossed className="h-4 w-4" />
                Cadastro de Produtos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/cozinha">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto bg-transparent">
                <ShoppingBag className="h-4 w-4" />
                Cozinha
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Funcionalidades:</strong> Cadastro de produtos, registro de pedidos presenciais,
              organização por categorias, exportação para PDF e CSV
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
