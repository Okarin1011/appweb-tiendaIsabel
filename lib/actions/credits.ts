'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { CreditUpdate, CreditMovementInsert, CreditStatus } from '@/lib/types/database'

// =============================================
// CRÉDITOS
// =============================================

export async function getCredits(status?: CreditStatus) {
  const supabase = await createClient()
  
  let query = supabase
    .from('credits')
    .select(`
      *,
      customer:customers(id, first_name, last_name, phone, whatsapp),
      sale:sales(id, total, created_at)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)
  return data
}

export async function getActiveCredits() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('active_credits_view')
    .select('*')
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function getCreditById(id: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('credits')
    .select(`
      *,
      customer:customers(id, first_name, last_name, phone, whatsapp, email, document_number, address),
      sale:sales(id, total, subtotal, discount, created_at, items:sale_items(product_name, size_name, quantity, unit_price, total)),
      movements:credit_movements(id, movement_type, amount, payment_method, reference_number, notes, created_at)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getCreditsByCustomer(customerId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('credits')
    .select(`
      *,
      sale:sales(id, total, created_at),
      movements:credit_movements(id, movement_type, amount, created_at)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getOverdueCredits() {
  const supabase = await createClient()
  
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('credits')
    .select(`
      *,
      customer:customers(id, first_name, last_name, phone, whatsapp)
    `)
    .in('status', ['pendiente', 'aprobado'])
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function updateCredit(id: string, credit: CreditUpdate) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credits')
    .update(credit)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('credits', 'max')
  return data
}

export async function updateCreditStatus(id: string, status: CreditStatus) {
  const supabase = await createClient()

  const updates: CreditUpdate = { status }
  
  if (status === 'aprobado') {
    updates.approved_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('credits')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('credits', 'max')
  return data
}

// =============================================
// MOVIMIENTOS DE CRÉDITO (PAGOS)
// =============================================

export async function getCreditMovements(creditId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('credit_movements')
    .select('*')
    .eq('credit_id', creditId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function registerPayment(payment: Omit<CreditMovementInsert, 'id' | 'created_at'>) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_movements')
    .insert(payment)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  // The trigger will automatically update the credit's amount_paid
  revalidateTag('credits', 'max')
  return data
}

export async function registerAdvancePayment(creditId: string, amount: number, paymentMethod: string, referenceNumber?: string, notes?: string) {
  return registerPayment({
    credit_id: creditId,
    movement_type: 'adelanto',
    amount,
    payment_method: paymentMethod,
    reference_number: referenceNumber || null,
    notes: notes || null,
    processed_by: null
  })
}

export async function registerFullPayment(creditId: string, amount: number, paymentMethod: string, referenceNumber?: string, notes?: string) {
  return registerPayment({
    credit_id: creditId,
    movement_type: 'pago',
    amount,
    payment_method: paymentMethod,
    reference_number: referenceNumber || null,
    notes: notes || null,
    processed_by: null
  })
}

export async function cancelCredit(creditId: string, notes?: string) {
  const supabase = await createClient()

  // Get credit to know the remaining balance
  const { data: credit, error: fetchError } = await supabase
    .from('credits')
    .select('balance')
    .eq('id', creditId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  // Register cancellation movement (the trigger will mark the credit as paid)
  const { data, error } = await supabase
    .from('credit_movements')
    .insert({
      credit_id: creditId,
      movement_type: 'cancelacion',
      amount: credit.balance,
      payment_method: 'cancelacion',
      notes: notes || 'Crédito cancelado',
      reference_number: null,
      processed_by: null
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidateTag('credits', 'max')
  return data
}

// =============================================
// REPORTES DE CRÉDITOS
// =============================================

export async function getCreditsSummary() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('credits')
    .select('status, total_amount, amount_paid, balance')

  if (error) throw new Error(error.message)

  const summary = {
    totalCredits: data.length,
    totalAmount: data.reduce((sum, c) => sum + c.total_amount, 0),
    totalPaid: data.reduce((sum, c) => sum + c.amount_paid, 0),
    totalPending: data.reduce((sum, c) => sum + c.balance, 0),
    activeCredits: data.filter(c => ['pendiente', 'aprobado'].includes(c.status)).length,
    activeAmount: data.filter(c => ['pendiente', 'aprobado'].includes(c.status)).reduce((sum, c) => sum + c.balance, 0),
    paidCredits: data.filter(c => c.status === 'pagado').length,
    overdueCredits: data.filter(c => c.status === 'vencido').length,
  }

  return summary
}

export async function getCreditsNearDue(daysAhead = 7) {
  const supabase = await createClient()
  
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  const { data, error } = await supabase
    .from('credits')
    .select(`
      *,
      customer:customers(id, first_name, last_name, phone, whatsapp)
    `)
    .in('status', ['pendiente', 'aprobado'])
    .gte('due_date', today.toISOString().split('T')[0])
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}
