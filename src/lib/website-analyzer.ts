import { AnalysisResults, BusinessModelAnalysis, TechnicalAnalysis, CompetitiveAnalysis, Recommendation } from '@/types'

export class WebsiteAnalyzer {
  private url: string

  constructor(url: string) {
    this.url = this.normalizeUrl(url)
  }

  private normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    return url
  }

  async analyze(): Promise<AnalysisResults> {
    try {
      // Fetch website content
      const response = await fetch(this.url)
      const html = await response.text()
      
      // Parse HTML content (server-side)
      const doc = this.parseHTML(html)

      // Run parallel analysis
      const [businessModel, technical, competitive] = await Promise.all([
        this.analyzeBusinessModel(doc, html),
        this.analyzeTechnical(doc, response),
        this.analyzeCompetitive(doc)
      ])

      // Generate recommendations
      const recommendations = this.generateRecommendations(businessModel, technical, competitive)

      return {
        businessModel,
        technical,
        competitive,
        recommendations
      }
    } catch (error) {
      throw new Error(`Analysis failed: ${error}`)
    }
  }

  private async analyzeBusinessModel(doc: any, html: string): Promise<BusinessModelAnalysis> {
    const title = doc.title || ''
    const description = doc.querySelector('meta[name="description"]')?.getAttribute() || ''
    const content = this.extractContent(html)
    
    // Enhanced business model detection
    let type: 'ECOMMERCE' | 'SAAS' | 'MARKETPLACE' | 'CONTENT' = 'CONTENT'
    let confidence = 0
    
    const ecommerceKeywords = ['add to cart', 'shop', 'product', 'buy now', 'checkout', 'shopping cart']
    const saasKeywords = ['pricing', 'subscription', 'free trial', 'dashboard', 'api', 'plans']
    const marketplaceKeywords = ['marketplace', 'vendors', 'sellers', 'buy and sell', 'commission']
    
    const ecommerceScore = ecommerceKeywords.filter(k => html.toLowerCase().includes(k)).length
    const saasScore = saasKeywords.filter(k => html.toLowerCase().includes(k)).length
    const marketplaceScore = marketplaceKeywords.filter(k => html.toLowerCase().includes(k)).length
    
    if (ecommerceScore > saasScore && ecommerceScore > marketplaceScore) {
      type = 'ECOMMERCE'
      confidence = Math.min(ecommerceScore * 20, 100)
    } else if (saasScore > marketplaceScore) {
      type = 'SAAS'
      confidence = Math.min(saasScore * 20, 100)
    } else if (marketplaceScore > 0) {
      type = 'MARKETPLACE'
      confidence = Math.min(marketplaceScore * 20, 100)
    }

    return {
      type,
      revenue: this.detectRevenueStreams(html),
      products: this.extractProductsEnhanced(html),
      pricing: this.analyzePricing(doc, html),
      content,
      confidence
    }
  }

  private async analyzeTechnical(doc: any, response: Response): Promise<TechnicalAnalysis> {
    const headers = Object.fromEntries(response.headers.entries())
    
    // Detect tech stack
    const stack = this.detectTechStack(doc, headers)
    
    // Performance metrics
    const performance = {
      loadTime: 0, // Would implement actual measurement
      pageSize: response.headers.get('content-length') || '0',
      requests: 1, // Would count actual requests
      coreWebVitals: {
        lcp: 0,
        fid: 0,
        cls: 0
      }
    }

    // Security assessment
    const security = this.assessSecurity(headers, doc)
    
    // SEO analysis
    const seo = this.analyzeSEO(doc)

    return {
      stack,
      performance,
      security,
      seo
    }
  }

  private async analyzeCompetitive(doc: any): Promise<CompetitiveAnalysis> {
    // This would integrate with competitive intelligence APIs
    return {
      competitors: [],
      marketPosition: 'Unknown',
      opportunities: ['Improve SEO', 'Enhance mobile experience'],
      threats: ['Competitive pricing pressure']
    }
  }

  private generateRecommendations(
    business: BusinessModelAnalysis,
    technical: TechnicalAnalysis,
    competitive: CompetitiveAnalysis
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Performance recommendations
    if (technical.performance.loadTime > 3000) {
      recommendations.push({
        category: 'PERFORMANCE',
        priority: 'HIGH',
        title: 'Improve Page Load Speed',
        description: 'Page load time exceeds 3 seconds. Consider optimizing images, minifying CSS/JS, and using a CDN.',
        impact: 'Could improve conversion rates by 15-20%'
      })
    }

    // SEO recommendations
    if (!technical.seo.metaDescription) {
      recommendations.push({
        category: 'SEO',
        priority: 'MEDIUM',
        title: 'Add Meta Description',
        description: 'Missing meta description. Add compelling descriptions to improve search engine visibility.',
        impact: 'Could improve click-through rates from search results'
      })
    }

    // Security recommendations
    if (!technical.security.https) {
      recommendations.push({
        category: 'SECURITY',
        priority: 'HIGH',
        title: 'Enable HTTPS',
        description: 'Website is not using HTTPS. This is critical for security and SEO.',
        impact: 'Essential for user trust and search engine rankings'
      })
    }

    return recommendations
  }

  private extractProductsEnhanced(html: string) {
    const products: { name: string; price: string }[] = []
    
    // Look for product patterns
    const productPatterns = [
      /<div[^>]*class=["'][^"']*product[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,
      /<article[^>]*>[\s\S]*?<\/article>/gi
    ]
    
    productPatterns.forEach(pattern => {
      const matches = html.match(pattern) || []
      matches.slice(0, 5).forEach(match => {
        const nameMatch = match.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/i)
        const priceMatch = match.match(/[\$£€]\s*[\d,]+(?:\.\d{2})?/)
        
        if (nameMatch) {
          products.push({
            name: nameMatch[1].trim(),
            price: priceMatch ? priceMatch[0] : 'N/A'
          })
        }
      })
    })
    
    return products.slice(0, 10)
  }

  private analyzePricing(doc: any, html: string) {
    const hasFreeTrial = html.includes('free trial') || html.includes('try free')
    const hasSubscription = html.includes('monthly') || html.includes('yearly') || html.includes('subscription')
    const hasOneTime = html.includes('buy now') || html.includes('purchase')

    return {
      model: hasSubscription ? 'subscription' : hasOneTime ? 'one-time' : 'unknown',
      hasFreeTrial,
      currency: this.detectCurrency(html)
    }
  }

  private detectRevenueStreams(html: string): string[] {
    const streams = []
    
    if (html.includes('subscription') || html.includes('monthly')) streams.push('Subscription')
    if (html.includes('advertising') || html.includes('ads')) streams.push('Advertising')
    if (html.includes('commission') || html.includes('marketplace')) streams.push('Commission')
    if (html.includes('product') || html.includes('shop')) streams.push('Product Sales')
    
    return streams.length > 0 ? streams : ['Unknown']
  }

  private detectTechStack(doc: any, headers: any): string[] {
    const stack = []
    
    // Check headers
    if (headers['server']?.includes('nginx')) stack.push('Nginx')
    if (headers['x-powered-by']) stack.push(headers['x-powered-by'])
    
    // Check HTML content
    const html = doc.documentElement.outerHTML
    if (html.includes('wp-content')) stack.push('WordPress')
    if (html.includes('shopify')) stack.push('Shopify')
    if (html.includes('react')) stack.push('React')
    if (html.includes('next')) stack.push('Next.js')
    
    return stack
  }

  private assessSecurity(headers: any, doc: any) {
    return {
      https: headers['strict-transport-security'] ? true : false,
      headers: {
        hsts: !!headers['strict-transport-security'],
        csp: !!headers['content-security-policy'],
        xframe: !!headers['x-frame-options']
      },
      vulnerabilities: []
    }
  }

  private analyzeSEO(doc: any) {
    return {
      title: doc.title,
      metaDescription: doc.querySelector('meta[name="description"]')?.getAttribute(),
      headings: {
        h1: doc.querySelectorAll('h1').length,
        h2: doc.querySelectorAll('h2').length,
        h3: doc.querySelectorAll('h3').length
      },
      images: {
        total: doc.querySelectorAll('img').length,
        withAlt: doc.querySelectorAll('img[alt]').length
      }
    }
  }

  private detectCurrency(html: string): string {
    if (html.includes('$')) return 'USD'
    if (html.includes('€')) return 'EUR'
    if (html.includes('£')) return 'GBP'
    if (html.includes('KSh') || html.includes('Ksh')) return 'KES'
    return 'Unknown'
  }

  private parseHTML(html: string) {
    return {
      title: this.extractTag(html, 'title'),
      querySelector: (selector: string) => {
        if (selector === 'meta[name="description"]') {
          const match = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
          return match ? { getAttribute: () => match[1] } : null
        }
        return null
      },
      querySelectorAll: (selector: string) => {
        const matches = html.match(new RegExp(`<${selector}[^>]*>`, 'gi')) || []
        return { length: matches.length }
      },
      documentElement: { outerHTML: html },
      html
    }
  }

  private extractContent(html: string) {
    // Extract main content areas
    const headings = this.extractHeadings(html)
    const links = this.extractLinks(html)
    const images = this.extractImages(html)
    const forms = this.extractForms(html)
    const socialMedia = this.extractSocialMedia(html)
    const contactInfo = this.extractContactInfo(html)
    
    return { headings, links, images, forms, socialMedia, contactInfo }
  }

  private extractHeadings(html: string) {
    const headings = []
    const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || []
    const h2Matches = html.match(/<h2[^>]*>([^<]*)<\/h2>/gi) || []
    const h3Matches = html.match(/<h3[^>]*>([^<]*)<\/h3>/gi) || []
    
    h1Matches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim()
      if (text) headings.push({ level: 1, text })
    })
    h2Matches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim()
      if (text) headings.push({ level: 2, text })
    })
    h3Matches.forEach(match => {
      const text = match.replace(/<[^>]*>/g, '').trim()
      if (text) headings.push({ level: 3, text })
    })
    
    return headings.slice(0, 10)
  }

  private extractLinks(html: string) {
    const linkMatches = html.match(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi) || []
    return linkMatches.slice(0, 20).map(match => {
      const hrefMatch = match.match(/href=["']([^"']*)["']/)
      const textMatch = match.match(/>([^<]*)</)
      return {
        url: hrefMatch ? hrefMatch[1] : '',
        text: textMatch ? textMatch[1].trim() : ''
      }
    }).filter(link => link.text && !link.text.includes('<'))
  }

  private extractImages(html: string) {
    const imgMatches = html.match(/<img[^>]*>/gi) || []
    return imgMatches.slice(0, 10).map(match => {
      const srcMatch = match.match(/src=["']([^"']*)["']/)
      const altMatch = match.match(/alt=["']([^"']*)["']/)
      return {
        src: srcMatch ? srcMatch[1] : '',
        alt: altMatch ? altMatch[1] : ''
      }
    })
  }

  private extractForms(html: string) {
    const formMatches = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) || []
    return formMatches.map(form => {
      const actionMatch = form.match(/action=["']([^"']*)["']/)
      const methodMatch = form.match(/method=["']([^"']*)["']/)
      const inputMatches = form.match(/<input[^>]*>/gi) || []
      
      return {
        action: actionMatch ? actionMatch[1] : '',
        method: methodMatch ? methodMatch[1] : 'GET',
        inputs: inputMatches.length
      }
    })
  }

  private extractSocialMedia(html: string) {
    const social = []
    if (html.includes('facebook.com')) social.push('Facebook')
    if (html.includes('twitter.com') || html.includes('x.com')) social.push('Twitter/X')
    if (html.includes('instagram.com')) social.push('Instagram')
    if (html.includes('linkedin.com')) social.push('LinkedIn')
    if (html.includes('youtube.com')) social.push('YouTube')
    if (html.includes('tiktok.com')) social.push('TikTok')
    return social
  }

  private extractContactInfo(html: string) {
    const emailMatches = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []
    const phoneMatches = html.match(/[\+]?[1-9]?[0-9]{7,15}/g) || []
    
    return {
      emails: [...new Set(emailMatches)].slice(0, 3),
      phones: [...new Set(phoneMatches)].slice(0, 3),
      hasContactForm: html.includes('contact') && html.includes('form')
    }
  }

  private extractTag(html: string, tag: string): string {
    const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'))
    return match ? match[1].trim() : ''
  }
}