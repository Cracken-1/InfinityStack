import { NextRequest, NextResponse } from 'next/server'
import { WebsiteAnalyzer } from '@/lib/website-analyzer'
import { db } from '@/lib/supabase'
import { AnalysisStatus } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { url, tenantId } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Create analysis record
    const analysis = await db.createAnalysis({
      url,
      tenant_id: tenantId || 'default',
      status: AnalysisStatus.ANALYZING,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

    // Perform analysis
    try {
      const analyzer = new WebsiteAnalyzer(url)
      const results = await analyzer.analyze()
      
      // Update with results
      const updatedAnalysis = await db.updateAnalysis(analysis.id, {
        status: AnalysisStatus.COMPLETED,
        results,
        updated_at: new Date().toISOString()
      })

      return NextResponse.json({
        success: true,
        analysis: updatedAnalysis
      })
    } catch (analysisError: any) {
      // Update with error status
      await db.updateAnalysis(analysis.id, {
        status: AnalysisStatus.FAILED,
        updated_at: new Date().toISOString()
      })

      return NextResponse.json(
        { error: `Analysis failed: ${analysisError.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}