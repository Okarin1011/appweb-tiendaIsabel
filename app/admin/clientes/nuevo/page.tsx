import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { CustomerForm } from '@/components/admin/customer-form'

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/clientes">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo Cliente</h1>
          <p className="text-muted-foreground">Agrega un nuevo cliente</p>
        </div>
      </div>

      <CustomerForm />
    </div>
  )
}
