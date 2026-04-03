'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
}

interface Size {
  id: string
  name: string
}

interface ProductVariant {
  id?: string
  size_id: string
  stock: number
  price: number
}

interface ProductImage {
  id?: string
  url: string
  is_primary: boolean
}

interface ProductFormProps {
  categories: Category[]
  sizes: Size[]
  product?: {
    id: string
    name: string
    description: string | null
    base_price: number
    category_id: string | null
    status: string
    product_variants: (ProductVariant & { sizes: Size | null })[]
    product_images: ProductImage[]
  }
}

export function ProductForm({ categories, sizes, product }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product

  const [name, setName] = useState(product?.name || '')
  const [description, setDescription] = useState(product?.description || '')
  const [basePrice, setBasePrice] = useState(product?.base_price?.toString() || '')
  const [categoryId, setCategoryId] = useState(product?.category_id || '')
  const [status, setStatus] = useState(product?.status || 'active')
  const [variants, setVariants] = useState<ProductVariant[]>(
    product?.product_variants.map(v => ({
      id: v.id,
      size_id: v.size_id,
      stock: v.stock,
      price: v.price,
    })) || []
  )
  const [images, setImages] = useState<ProductImage[]>(product?.product_images || [])
  const [imageUrl, setImageUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addVariant = () => {
    if (sizes.length === 0) {
      toast.error('Primero debes crear tallas en la configuracion')
      return
    }
    setVariants([...variants, { size_id: sizes[0].id, stock: 0, price: Number(basePrice) || 0 }])
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number) => {
    const updated = [...variants]
    if (field === 'stock' || field === 'price') {
      updated[index][field] = Number(value)
    } else {
      updated[index][field] = value as string
    }
    setVariants(updated)
  }

  const addImage = () => {
    if (!imageUrl.trim()) return
    const isPrimary = images.length === 0
    setImages([...images, { url: imageUrl.trim(), is_primary: isPrimary }])
    setImageUrl('')
  }

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    // Make first image primary if we removed the primary
    if (images[index].is_primary && updated.length > 0) {
      updated[0].is_primary = true
    }
    setImages(updated)
  }

  const setPrimaryImage = (index: number) => {
    setImages(images.map((img, i) => ({ ...img, is_primary: i === index })))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSubmitting(true)

    try {
      const productData = {
        name: name.trim(),
        description: description.trim() || null,
        base_price: Number(basePrice) || 0,
        category_id: categoryId || null,
        status: status as 'active' | 'inactive' | 'draft',
      }

      let result
      if (isEditing) {
        result = await updateProduct(product.id, productData, variants, images)
      } else {
        result = await createProduct(productData, variants, images)
      }

      if (result.success) {
        toast.success(isEditing ? 'Producto actualizado' : 'Producto creado')
        router.push('/admin/productos')
        router.refresh()
      } else {
        toast.error(result.error || 'Error al guardar')
      }
    } catch (error) {
      toast.error('Error al guardar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion General</CardTitle>
              <CardDescription>Datos basicos del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Camisa de algodon"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripcion del producto..."
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Precio Base</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Variantes (Tallas)</CardTitle>
                  <CardDescription>Stock y precio por talla</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay variantes. Agrega tallas con stock y precio.
                </p>
              ) : (
                <div className="space-y-3">
                  {variants.map((variant, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Select
                        value={variant.size_id}
                        onValueChange={(value) => updateVariant(index, 'size_id', value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Talla" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizes.map((size) => (
                            <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        placeholder="Stock"
                        className="w-[100px]"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        placeholder="Precio"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariant(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Imagenes</CardTitle>
              <CardDescription>URLs de las imagenes del producto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addImage}>
                  <Upload className="mr-2 h-4 w-4" />
                  Agregar
                </Button>
              </div>
              {images.length > 0 && (
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative group rounded-lg overflow-hidden border-2 ${
                        image.is_primary ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!image.is_primary && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setPrimaryImage(index)}
                          >
                            Principal
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {image.is_primary && (
                        <span className="absolute top-1 left-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Producto'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
