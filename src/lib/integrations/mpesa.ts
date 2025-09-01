interface MPesaConfig {
  consumerKey: string
  consumerSecret: string
  businessShortCode: string
  passkey: string
  environment: 'sandbox' | 'production'
}

interface STKPushRequest {
  phoneNumber: string
  amount: number
  accountReference: string
  transactionDesc: string
}

interface MPesaResponse {
  success: boolean
  checkoutRequestId?: string
  responseCode?: string
  responseDescription?: string
  errorMessage?: string
}

export class MPesaIntegration {
  private config: MPesaConfig
  private baseUrl: string

  constructor(config: MPesaConfig) {
    this.config = config
    this.baseUrl = config.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke'
  }

  async initiateSTKPush(request: STKPushRequest): Promise<MPesaResponse> {
    try {
      const accessToken = await this.getAccessToken()
      const timestamp = this.generateTimestamp()
      const password = this.generatePassword(timestamp)
      
      const payload = {
        BusinessShortCode: this.config.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: request.amount,
        PartyA: this.formatPhoneNumber(request.phoneNumber),
        PartyB: this.config.businessShortCode,
        PhoneNumber: this.formatPhoneNumber(request.phoneNumber),
        CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
        AccountReference: request.accountReference,
        TransactionDesc: request.transactionDesc
      }

      const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      
      if (data.ResponseCode === '0') {
        return {
          success: true,
          checkoutRequestId: data.CheckoutRequestID,
          responseCode: data.ResponseCode,
          responseDescription: data.ResponseDescription
        }
      } else {
        return {
          success: false,
          errorMessage: data.ResponseDescription || 'STK Push failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')
    
    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    })

    const data = await response.json()
    return data.access_token
  }

  private generateTimestamp(): string {
    const now = new Date()
    return now.getFullYear().toString() +
           (now.getMonth() + 1).toString().padStart(2, '0') +
           now.getDate().toString().padStart(2, '0') +
           now.getHours().toString().padStart(2, '0') +
           now.getMinutes().toString().padStart(2, '0') +
           now.getSeconds().toString().padStart(2, '0')
  }

  private generatePassword(timestamp: string): string {
    const data = this.config.businessShortCode + this.config.passkey + timestamp
    return Buffer.from(data).toString('base64')
  }

  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/\D/g, '')
    
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1)
    } else if (formatted.startsWith('7') || formatted.startsWith('1')) {
      formatted = '254' + formatted
    } else if (!formatted.startsWith('254')) {
      formatted = '254' + formatted
    }
    
    return formatted
  }

  validatePhoneNumber(phone: string): boolean {
    const formatted = this.formatPhoneNumber(phone)
    return /^254[71]\d{8}$/.test(formatted)
  }

  calculateTransactionFee(amount: number): number {
    if (amount <= 49) return 0
    if (amount <= 100) return 11
    if (amount <= 500) return 15
    if (amount <= 1000) return 20
    if (amount <= 1500) return 25
    if (amount <= 2500) return 30
    return Math.floor(amount * 0.005)
  }
}