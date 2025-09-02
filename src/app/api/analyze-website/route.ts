import { NextRequest, NextResponse } from 'next/server'
import { WebsiteAnalyzer } from '@/lib/website-analyzer'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    const analyzer = new WebsiteAnalyzer(url)
    const results = await analyzer.analyze()

    return NextResponse.json(results)
  } catch (error) {
    console.error('Website analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}