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
  const widgets = []

  if (analysis.businessModel) {
    widgets.push({
      id: 'business-model',
      type: 'metric',
      title: 'Business Model Performance',
      data: {
        score: analysis.businessModel.confidence || 0,
        type: analysis.businessModel.type,
        trend: '+12%'
      }
    })
  }

  if (analysis.businessModel?.revenue) {
    widgets.push({
      id: 'revenue-streams',
      type: 'chart',
      title: 'Revenue Stream Analysis',
      data: {
        streams: analysis.businessModel.revenue,
        distribution: analysis.businessModel.revenue.map(() => Math.floor(Math.random() * 40) + 10)
      }
    })
  }

  if (analysis.businessModel?.marketAnalysis) {
    widgets.push({
      id: 'brand-strength',
      type: 'gauge',
      title: 'Brand Strength Monitor',
      data: {
        score: analysis.businessModel.marketAnalysis.brandStrength || 0,
        positioning: analysis.businessModel.marketAnalysis.positioning
      }
    })
  }

  return widgets
}