import { NextResponse } from 'next/server';
import { fetchReportById, updateReportStatus } from '../../../../services/reportService';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const report = await fetchReportById(resolved.id);
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  return NextResponse.json({ report });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolved = await params;
  const body = await req.json();
  const success = await updateReportStatus({
    reportId: resolved.id,
    status: body.status,
    comment: body.comment,
  });
  return NextResponse.json({ success });
}
