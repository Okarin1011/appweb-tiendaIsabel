'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { SaleInsert, SaleItemInsert, CreditInsert } from '@/lib/types/database'

// =============================================
// VENTAS
// =============================================

export async function getSales(options?: { limit?: number; offset?: number; type?: 'contado' | 'credito' }) {
  const supabase = await createClient()
  
  let query = supabase
    .from('sales')
    .select(`
      *,
      customer:customers(id, first_name, last_name, phone),
      items:sale_items(id, product_name, size_name, quantity, unit_price, discount, total)
    `)
    .order('created_at', { ascending: false })

  if (options?.type) {
    query = query.eq('sale_type', options.type)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data
}

export async function getSaleById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      customer:customers(id, first_name, last_name, phone, email, document_number),
      items:sale_items(id, product_id, product_variant_id, product_name, size_name, quantity, unit_price, discount, total),
      credit:credits(id, total_amount, amount_paid, balance, status, due_date, installments)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getSalesByCustomer(customerId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      items:sale_items(id, product_name, size_name, quantity, unit_price, total)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getSalesToday() {
  const supabase = await createClient()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data, error } = await supabase
    .from('sales')
    .select(`
      *,
      customer:customers(id, first_name, last_name),
      items:sale_items(id, product_name, quantity, total)
    `)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

interface CreateSaleData {
  sale: Omit<SaleInsert, 'subtotal' | 'total'>
  items: Array<{
    product_id: string
    product_variant_id?: string
    product_name: string
    size_name?: string
    quantity: number
    unit_price: number
    discount?: number
  }>
  creditData?: {
    installments: number
    due_date?: string
    notes?: string
  }
}

export async function createSale({ sale, items, creditData }: CreateSaleData) {
  const supabase = await createClient()

  // Calculate totals
  const itemsWithTotals = items.map(item => ({
    ...item,
    discount: item.discount || 0,
    total: (item.unit_price * item.quantity) - (item.discount || 0)
  }))

  const subtotal = itemsWithTotals.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  const itemDiscounts = itemsWithTotals.reduce((sum, item) => sum + item.discount, 0)
  const totalDiscount = (sale.discount || 0) + itemDiscounts
  const tax = sale.tax || 0
  const total = subtotal - totalDiscount + tax

  // Create sale
  const { data: newSale, error: saleError } = await supabase
    .from('sales')
    .insert({
      ...sale,
      subtotal,
      discount: totalDiscount,
      total,
      amount_paid: sale.sale_type === 'contado' ? total : (sale.amount_paid || 0)
    })
    .select()
    .single()

  if (saleError) throw new Error(saleError.message)

  // Create sale items
  const saleItems: Omit<SaleItemInsert, 'id' | 'created_at'>[] = itemsWithTotals.map(item => ({
    sale_id: newSale.id,
    product_id: item.product_id,
    product_variant_id: item.product_variant_id || null,
    product_name: item.product_name,
    size_name: item.size_name || null,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount,
    total: item.total
  }))

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(saleItems)

  if (itemsError) throw new Error(itemsError.message)

  // If credit sale, create credit record
  if (sale.sale_type === 'credito' && sale.customer_id && creditData) {
    const credit: Omit<CreditInsert, 'id' | 'balance' | 'created_at' | 'updated_at'> = {
      sale_id: newSale.id,
      customer_id: sale.customer_id,
      total_amount: total,
      amount_paid: sale.amount_paid || 0,
      installments: creditData.installments,
      installment_amount: total / creditData.installments,
      status: 'aprobado',
      due_date: creditData.due_date || null,
      notes: creditData.notes || null,
      approved_at: null,
      approved_by: null
    }

    const { error: creditError } = await supabase
      .from('credits')
      .insert(credit)

    if (creditError) throw new Error(creditError.message)
  }

  revalidateTag('sales', 'max')
  revalidateTag('products', 'max') // Stock was updated via trigger
  
  return newSale
}

export async function cancelSale(id: string) {
  const supabase = await createClient()

  // Get sale items to restore stock
  const { data: sale, error: fetchError } = await supabase
    .from('sales')
    .select('*, items:sale_items(product_variant_id, quantity)')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  // Restore stock for each item
  for (const item of sale.items) {
    if (item.product_variant_id) {
      await supabase.rpc('restore_stock', {
        variant_id: item.product_variant_id,
        quantity: item.quantity
      })
    }
  }

  // Delete the sale (will cascade to items)
  const { error: deleteError } = await supabase
    .from('sales')
    .delete()
    .eq('id', id)

  if (deleteError) throw new Error(deleteError.message)

  revalidateTag('sales', 'max')
  revalidateTag('products', 'max')
  
  return true
}

// =============================================
// REPORTES DE VENTAS
// =============================================

export async function getSalesSummary(startDate: string, endDate: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sales')
    .select('sale_type, total, discount')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw new Error(error.message)

  const summary = {
    totalSales: data.length,
    totalAmount: data.reduce((sum, s) => sum + s.total, 0),
    totalDiscount: data.reduce((sum, s) => sum + s.discount, 0),
    cashSales: data.filter(s => s.sale_type === 'contado').length,
    cashAmount: data.filter(s => s.sale_type === 'contado').reduce((sum, s) => sum + s.total, 0),
    creditSales: data.filter(s => s.sale_type === 'credito').length,
    creditAmount: data.filter(s => s.sale_type === 'credito').reduce((sum, s) => sum + s.total, 0),
  }

  return summary
}

export async function getTopProducts(startDate: string, endDate: string, limit = 10) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sale_items')
    .select(`
      product_id,
      product_name,
      quantity,
      total,
      sale:sales!inner(created_at)
    `)
    .gte('sales.created_at', startDate)
    .lte('sales.created_at', endDate)

  if (error) throw new Error(error.message)

  // Aggregate by product
  const productMap = new Map<string, { product_id: string; product_name: string; total_quantity: number; total_revenue: number }>()

  data.forEach(item => {
    const existing = productMap.get(item.product_id)
    if (existing) {
      existing.total_quantity += item.quantity
      existing.total_revenue += item.total
    } else {
      productMap.set(item.product_id, {
        product_id: item.product_id,
        product_name: item.product_name,
        total_quantity: item.quantity,
        total_revenue: item.total
      })
    }
  })

  return Array.from(productMap.values())
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit)
}

export async function getDailySales(startDate: string, endDate: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sales_summary')
    .select('*')
    .gte('sale_date', startDate)
    .lte('sale_date', endDate)
    .order('sale_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}
