'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { MoreHorizontal, Edit, Trash2, Eye, Search, Package } from 'lucide-react'
import { deleteProduct } from '@/lib/actions/products'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  description: string | null
  base_price: number
  status: string
  categories: { id: string; name: string } | null
  product_images: { id: string; url: string; is_primary: boolean }[]
  product_variants: { id: string; stock: number; price: number; sizes: { id: string; name: string } | null }[]
}

interface Category {
  id: string
  name: string
}

interface ProductsTableProps {
  products: Product[]
  categories: Category[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.categories?.id === categoryFilter
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estas seguro de eliminar este producto?')) return
    
    const result = await deleteProduct(id)
    if (result.success) {
      toast.success('Producto eliminado')
      router.refresh()
    } else {
      toast.error(result.error || 'Error al eliminar')
    }
  }

  const getTotalStock = (variants: Product['product_variants']) => {
    return variants.reduce((sum, v) => sum + v.stock, 0)
  }

  const getPrimaryImage = (images: Product['product_images']) => {
    const primary = images.find(img => img.is_primary)
    return primary?.url || images[0]?.url
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagen</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => {
                  const primaryImage = getPrimaryImage(product.product_images)
                  const totalStock = getTotalStock(product.product_variants)
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {primaryImage ? (
                          <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={primaryImage}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.categories?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(product.base_price)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={totalStock < 5 ? 'destructive' : 'secondary'}>
                          {totalStock}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            product.status === 'active' ? 'default' :
                            product.status === 'inactive' ? 'secondary' : 'outline'
                          }
                        >
                          {product.status === 'active' ? 'Activo' :
                           product.status === 'inactive' ? 'Inactivo' : 'Borrador'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/productos/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/productos/${product.id}/editar`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
