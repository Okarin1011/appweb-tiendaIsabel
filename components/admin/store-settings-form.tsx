'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Store, CreditCard, Phone } from 'lucide-react'
import { updateStoreSettings } from '@/lib/actions/store-settings'
import { toast } from 'sonner'

interface Settings {
  id: string
  store_name: string
  address: string | null
  phone: string | null
  email: string | null
  tax_rate: number
  currency: string
  default_credit_days: number
  receipt_footer: string | null
} | null

interface StoreSettingsFormProps {
  settings: Settings
}

export function StoreSettingsForm({ settings }: StoreSettingsFormProps) {
  const router = useRouter()
  
  const [storeName, setStoreName] = useState(settings?.store_name || 'Mi Tienda')
  const [address, setAddress] = useState(settings?.address || '')
  const [phone, setPhone] = useState(settings?.phone || '')
  const [email, setEmail] = useState(settings?.email || '')
  const [taxRate, setTaxRate] = useState(settings?.tax_rate?.toString() || '16')
  const [currency, setCurrency] = useState(settings?.currency || 'MXN')
  const [defaultCreditDays, setDefaultCreditDays] = useState(settings?.default_credit_days?.toString() || '30')
  const [receiptFooter, setReceiptFooter] = useState(settings?.receipt_footer || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const settingsData = {
        store_name: storeName.trim(),
        address: address.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        tax_rate: Number(taxRate) || 0,
        currency: currency.trim() || 'MXN',
        default_credit_days: Number(defaultCreditDays) || 30,
        receipt_footer: receiptFooter.trim() || null,
      }

      const result = await updateStoreSettings(settings?.id || null, settingsData)

      if (result.success) {
        toast.success('Configuracion guardada')
        router.refresh()
      } else {
        toast.error(result.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar la configuracion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Informacion de la Tienda
          </CardTitle>
          <CardDescription>Datos basicos de tu negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Nombre de la Tienda</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Mi Tienda de Ropa"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Direccion</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle, Numero, Colonia, Ciudad"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tienda@email.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configuracion de Ventas
          </CardTitle>
          <CardDescription>Impuestos, moneda y creditos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tasa de IVA (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="16"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="MXN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditDays">Dias de Credito</Label>
              <Input
                id="creditDays"
                type="number"
                min="1"
                value={defaultCreditDays}
                onChange={(e) => setDefaultCreditDays(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="receiptFooter">Pie de Recibo</Label>
            <Textarea
              id="receiptFooter"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Gracias por su compra. Cambios y devoluciones dentro de los primeros 7 dias."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Este texto aparecera al final de los recibos
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar Configuracion'}
        </Button>
      </div>
    </form>
  )
}
