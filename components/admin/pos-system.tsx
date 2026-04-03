'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Package, User } from 'lucide-react'
import { createSale } from '@/lib/actions/sales'
import { toast } from 'sonner'

interface ProductVariant {
  id: string
  stock: number
  price: number
  size_id: string
  sizes: { id: string; name: string } | null
}

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  categories: { id: string; name: string } | null
  product_images: { id: string; url: string; is_primary: boolean }[]
  product_variants: ProductVariant[]
}

interface Customer {
  id: string
  name: string
  phone: string | null
}

interface Settings {
  store_name: string
  tax_rate: number
} | null

interface CartItem {
  variant_id: string
  product_name: string
  size_name: string
  price: number
  quantity: number
  max_stock: number
}

interface POSSystemProps {
  products: Product[]
  customers: Customer[]
  settings: Settings
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function POSSystem({ products, customers, settings }: POSSystemProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [saleType, setSaleType] = useState<'cash' | 'credit'>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [selectVariantProduct, setSelectVariantProduct] = useState<Product | null>(null)

  const taxRate = settings?.tax_rate || 0

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.categories?.name.toLowerCase().includes(search.toLowerCase())
  )

  const addToCart = (product: Product, variant: ProductVariant) => {
    const existingIndex = cart.findIndex((item) => item.variant_id === variant.id)
    
    if (existingIndex >= 0) {
      const existing = cart[existingIndex]
      if (existing.quantity >= variant.stock) {
        toast.error('No hay suficiente stock')
        return
      }
      const updated = [...cart]
      updated[existingIndex].quantity += 1
      setCart(updated)
    } else {
      if (variant.stock < 1) {
        toast.error('Producto sin stock')
        return
      }
      setCart([...cart, {
        variant_id: variant.id,
        product_name: product.name,
        size_name: variant.sizes?.name || '',
        price: variant.price || product.base_price,
        quantity: 1,
        max_stock: variant.stock,
      }])
    }
    setSelectVariantProduct(null)
  }

  const handleProductClick = (product: Product) => {
    const availableVariants = product.product_variants.filter(v => v.stock > 0)
    
    if (availableVariants.length === 0) {
      toast.error('Producto sin stock')
      return
    }
    
    if (availableVariants.length === 1) {
      addToCart(product, availableVariants[0])
    } else {
      setSelectVariantProduct(product)
    }
  }

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...cart]
    const newQty = updated[index].quantity + delta
    
    if (newQty < 1) {
      updated.splice(index, 1)
    } else if (newQty > updated[index].max_stock) {
      toast.error('No hay suficiente stock')
      return
    } else {
      updated[index].quantity = newQty
    }
    setCart(updated)
  }

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * (taxRate / 100)
  const total = subtotal + tax

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito esta vacio')
      return
    }

    if (saleType === 'credit' && !selectedCustomer) {
      toast.error('Selecciona un cliente para venta a credito')
      return
    }

    setIsProcessing(true)
    
    try {
      const saleData = {
        customer_id: selectedCustomer || null,
        sale_type: saleType,
        subtotal,
        tax,
        total,
        notes: null,
      }

      const items = cart.map((item) => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }))

      const result = await createSale(saleData, items)

      if (result.success) {
        toast.success('Venta completada')
        setCart([])
        setSelectedCustomer('')
        setSaleType('cash')
        setShowCheckout(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Error al procesar la venta')
      }
    } catch (error) {
      toast.error('Error al procesar la venta')
    } finally {
      setIsProcessing(false)
    }
  }

  const getPrimaryImage = (images: Product['product_images']) => {
    const primary = images.find(img => img.is_primary)
    return primary?.url || images[0]?.url
  }

  const getTotalStock = (variants: ProductVariant[]) => {
    return variants.reduce((sum, v) => sum + v.stock, 0)
  }

  return (
    <div className="grid h-full gap-4 lg:grid-cols-3">
      {/* Products Grid */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 pb-4">
            {filteredProducts.map((product) => {
              const primaryImage = getPrimaryImage(product.product_images)
              const totalStock = getTotalStock(product.product_variants)
              
              return (
                <Card
                  key={product.id}
                  className={`cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    totalStock === 0 ? 'opacity-50' : ''
                  }`}
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="p-3">
                    {primaryImage ? (
                      <div className="relative aspect-square mb-2 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square mb-2 flex items-center justify-center rounded-md bg-muted">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(product.base_price)}
                      </span>
                      <Badge variant={totalStock < 5 ? 'destructive' : 'secondary'} className="text-xs">
                        {totalStock}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Cart */}
      <Card className="flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carrito
            {cart.length > 0 && (
              <Badge variant="secondary">{cart.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Agrega productos al carrito
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-4 px-4">
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={item.variant_id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Talla: {item.size_name} - {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(index, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeFromCart(index)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA ({taxRate}%)</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin cliente</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={saleType === 'cash' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSaleType('cash')}
                  >
                    <Banknote className="mr-2 h-4 w-4" />
                    Efectivo
                  </Button>
                  <Button
                    variant={saleType === 'credit' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setSaleType('credit')}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Credito
                  </Button>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || isProcessing}
                >
                  {isProcessing ? 'Procesando...' : `Cobrar ${formatCurrency(total)}`}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Variant Selection Dialog */}
      <Dialog open={!!selectVariantProduct} onOpenChange={() => setSelectVariantProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar Talla</DialogTitle>
            <DialogDescription>
              {selectVariantProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 grid-cols-3">
            {selectVariantProduct?.product_variants
              .filter(v => v.stock > 0)
              .map((variant) => (
                <Button
                  key={variant.id}
                  variant="outline"
                  className="h-auto py-3 flex flex-col"
                  onClick={() => addToCart(selectVariantProduct!, variant)}
                >
                  <span className="font-bold">{variant.sizes?.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Stock: {variant.stock}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(variant.price || selectVariantProduct.base_price)}
                  </span>
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
