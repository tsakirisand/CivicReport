import { NextResponse } from 'next/server';
import { fetchReports } from '../../../services/reportService';

export async function GET() {
  const reports = await fetchReports();
  return NextResponse.json({ reports });
}
