/**
 * Market Analysis API
 * Generate and retrieve AI-powered financial analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AnalysisService } from '@/services/analysisService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'Analysis service not configured' },
        { status: 500 }
      );
    }

    const analysisService = new AnalysisService(anthropicApiKey, supabase);
    const analyses = await analysisService.getPastAnalyses(user.id, limit);

    return NextResponse.json({
      analyses,
      count: analyses.length,
    });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: 'Analysis service not configured' },
        { status: 500 }
      );
    }

    const analysisService = new AnalysisService(anthropicApiKey, supabase);
    
    // Generate new analysis
    const analysis = await analysisService.generateWeeklyAnalysis(user.id);

    return NextResponse.json({
      success: true,
      analysis: {
        weekStart: analysis.weekStart,
        weekEnd: analysis.weekEnd,
        executiveSummary: analysis.executiveSummary,
        spendingInsights: analysis.spendingInsights,
        portfolioInsights: analysis.portfolioInsights,
        recommendations: analysis.recommendations,
        alerts: analysis.alerts,
      },
    });
  } catch (error) {
    console.error('Error generating analysis:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}


















