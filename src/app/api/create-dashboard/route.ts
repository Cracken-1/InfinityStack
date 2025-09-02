import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { analysisData, userEmail } = await request.json()

    if (!analysisData || !userEmail) {
      return NextResponse.json(
        { error: 'Analysis data and email are required' },
        { status: 400 }
      )
    }

    const steps = [
      'Analyzing business model...',
      'Generating KPI widgets...',
      'Creating revenue tracking...',
      'Setting up competitive monitoring...',
      'Configuring SEO dashboard...',
      'Building custom analytics...',
      'Finalizing dashboard layout...'
    ]

    return NextResponse.json({
      dashboardId: `dash_${Date.now()}`,
      steps,
      widgets: generateWidgetsFromAnalysis(analysisData),
      estimatedTime: 45000
    })
  } catch (error) {
    console.error('Dashboard creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    )
  }
}

function generateWidgetsFromAnalysis(analysis: any) {
  const companyName = analysis.companyName || 'Your Company'
  const websiteUrl = analysis.websiteUrl || 'example.com'
  
  return {
    companyInfo: {
      name: companyName,
      url: websiteUrl,
      industry: determineIndustry(analysis.businessModel?.type),
      founded: 'Analyzing...',
      employees: estimateEmployees(analysis.businessModel)
    },
    metrics: [
      {
        title: 'Business Model Score',
        value: `${analysis.businessModel?.confidence || 0}/100`,
        change: '+5 points',
        trend: 'up',
        description: `${analysis.businessModel?.type || 'Unknown'} model detected`
      },
      {
        title: 'Brand Strength',
        value: `${analysis.businessModel?.marketAnalysis?.brandStrength || 0}/100`,
        change: '+3 points',
        trend: 'up',
        description: analysis.businessModel?.marketAnalysis?.positioning || 'Analyzing position'
      },
      {
        title: 'Revenue Streams',
        value: analysis.businessModel?.revenue?.length || 0,
        change: 'Identified',
        trend: 'neutral',
        description: 'Active revenue channels'
      },
      {
        title: 'SEO Health',
        value: calculateSEOScore(analysis.technical?.seo),
        change: 'Needs improvement',
        trend: 'down',
        description: 'Search optimization status'
      }
    ],
    insights: generateBusinessInsights(analysis),
    recommendations: analysis.recommendations || [],
    competitiveAnalysis: {
      advantages: analysis.businessModel?.competitiveAdvantage?.advantages || [],
      positioning: analysis.businessModel?.marketAnalysis?.positioning || 'Unknown',
      marketFocus: analysis.businessModel?.marketAnalysis?.marketFocus || 'General Market'
    }
  }
}

function determineIndustry(businessType: string): string {
  const industryMap: { [key: string]: string } = {
    'ECOMMERCE': 'E-commerce & Retail',
    'SAAS': 'Software & Technology',
    'MARKETPLACE': 'Marketplace & Platform',
    'CONTENT': 'Media & Content'
  }
  return industryMap[businessType] || 'General Business'
}

function estimateEmployees(businessModel: any): string {
  const confidence = businessModel?.confidence || 0
  if (confidence > 80) return '50-200 employees'
  if (confidence > 60) return '10-50 employees'
  return '1-10 employees'
}

function calculateSEOScore(seo: any): string {
  if (!seo) return '0/100'
  let score = 0
  if (seo.title) score += 30
  if (seo.metaDescription) score += 30
  if (seo.headings?.h1 > 0) score += 20
  if (seo.images?.withAlt > 0) score += 20
  return `${score}/100`
}

function generateBusinessInsights(analysis: any): string[] {
  const insights = []
  
  if (analysis.businessModel?.confidence > 70) {
    insights.push('Strong business model clarity detected')
  } else {
    insights.push('Business model messaging needs improvement')
  }
  
  if (analysis.businessModel?.revenue?.length > 2) {
    insights.push('Good revenue diversification strategy')
  } else {
    insights.push('Consider diversifying revenue streams')
  }
  
  if (analysis.technical?.security?.https) {
    insights.push('Security foundation is solid')
  } else {
    insights.push('Security improvements needed urgently')
  }
  
  return insights
}