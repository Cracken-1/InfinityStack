import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    logger.info('M-Pesa callback received', { body })

    const { Body } = body
    if (!Body?.stkCallback) {
      return NextResponse.json({ error: 'Invalid callback format' }, { status: 400 })
    }

    const { stkCallback } = Body
    const { 
      MerchantRequestID, 
      CheckoutRequestID, 
      ResultCode, 
      ResultDesc,
      CallbackMetadata 
    } = stkCallback

    let transactionData: any = {
      merchantRequestId: MerchantRequestID,
      checkoutRequestId: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      status: ResultCode === 0 ? 'completed' : 'failed'
    }

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      const metadata = CallbackMetadata.Item.reduce((acc: any, item: any) => {
        acc[item.Name] = item.Value
        return acc
      }, {})

      transactionData = {
        ...transactionData,
        amount: metadata.Amount,
        mpesaReceiptNumber: metadata.MpesaReceiptNumber,
        transactionDate: metadata.TransactionDate,
        phoneNumber: metadata.PhoneNumber
      }
    }

    // Store transaction in database
    await supabaseAdmin
      .from('mpesa_transactions')
      .upsert(transactionData, { 
        onConflict: 'checkout_request_id' 
      })

    if (ResultCode === 0) {
      await updateOrderStatus(CheckoutRequestID, 'paid')
    }

    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: 'Success' 
    })
  } catch (error) {
    logger.error('M-Pesa callback error', error as Error)
    return NextResponse.json({ 
      ResultCode: 1, 
      ResultDesc: 'Failed to process callback' 
    }, { status: 500 })
  }
}

async function updateOrderStatus(checkoutRequestId: string, status: string) {
  try {
    await supabaseAdmin
      .from('orders')
      .update({ 
        payment_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_request_id', checkoutRequestId)
  } catch (error) {
    logger.error('Failed to update order status', error as Error)
  }
}