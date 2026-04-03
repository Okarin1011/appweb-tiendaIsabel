'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { 
  MoreHorizontal, 
  DollarSign, 
  Search, 
  Eye, 
  CreditCard,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { addCreditPayment, updateCreditStatus } from '@/lib/actions/credits'
import { toast } from 'sonner'

interface Credit {
  id: string
  customer_id: string
  sale_id: string
  original_amount: number
  current_balance: number
  status: string
  due_date: string | null
  created_at: string
  customers: { id: string; name: string; phone: string | null; email: string | null } | null
  sales: { id: string; total: number; created_at: string } | null
}

interface CreditsTableProps {
  credits: Credit[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function CreditsTable({ credits }: CreditsTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentDialog, setPaymentDialog] = useState<Credit | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const filteredCredits = credits.filter((credit) => {
    const matchesSearch = credit.customers?.name.toLowerCase().includes(search.toLowerCase()) ||
      credit.customers?.phone?.includes(search)
    const matchesStatus = statusFilter === 'all' || credit.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handlePayment = async () => {
    if (!paymentDialog || !paymentAmount) return
    
    const amount = Number(paymentAmount)
    if (amount <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }
    if (amount > paymentDialog.current_balance) {
      toast.error('El monto excede el saldo pendiente')
      return
    }

    setIsProcessing(true)
    try {
      const result = await addCreditPayment(paymentDialog.id, amount, 'Pago de abono')
      if (result.success) {
        toast.success('Pago registrado')
        setPaymentDialog(null)
        setPaymentAmount('')
        router.refresh()
      } else {
        toast.error(result.error || 'Error al registrar pago')
      }
    } catch (error) {
      toast.error('Error al registrar pago')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleMarkAsPaid = async (creditId: string) => {
    const result = await updateCreditStatus(creditId, 'paid')
    if (result.success) {
      toast.success('Credito marcado como pagado')
      router.refresh()
    } else {
      toast.error(result.error || 'Error al actualizar')
    }
  }

  const handleCancel = async (creditId: string) => {
    if (!confirm('¿Cancelar este credito?')) return
    
    const result = await updateCreditStatus(creditId, 'cancelled')
    if (result.success) {
      toast.success('Credito cancelado')
      router.refresh()
    } else {
      toast.error(result.error || 'Error al cancelar')
    }
  }

  const getStatusBadge = (status: string, dueDate: string | null) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'active'
    
    if (isOverdue) {
      return <Badge variant="destructive">Vencido</Badge>
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-chart-2 text-chart-2-foreground">Activo</Badge>
      case 'paid':
        return <Badge variant="secondary">Pagado</Badge>
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                <Clock className="mr-1 h-4 w-4" />
                Activos
              </Button>
              <Button
                variant={statusFilter === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('paid')}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Pagados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Monto Original</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-center">Vencimiento</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCredits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No se encontraron creditos
                  </TableCell>
                </TableRow>
              ) : (
                filteredCredits.map((credit) => (
                  <TableRow key={credit.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{credit.customers?.name || 'Sin cliente'}</p>
                        {credit.customers?.phone && (
                          <p className="text-sm text-muted-foreground">{credit.customers.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(credit.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(credit.original_amount)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(credit.current_balance)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {credit.due_date ? formatDate(credit.due_date) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(credit.status, credit.due_date)}
                    </TableCell>
                    <TableCell>
                      {credit.status === 'active' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPaymentDialog(credit)}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Registrar Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(credit.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar Pagado
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleCancel(credit.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={!!paymentDialog} onOpenChange={() => setPaymentDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Cliente: {paymentDialog?.customers?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between p-4 rounded-lg bg-muted">
              <span>Saldo pendiente:</span>
              <span className="font-bold">{formatCurrency(paymentDialog?.current_balance || 0)}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Monto del pago</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                max={paymentDialog?.current_balance}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPaymentDialog(null)}>
                Cancelar
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing}>
                {isProcessing ? 'Procesando...' : 'Registrar Pago'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
