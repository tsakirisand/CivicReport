'use client';
import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchReportById, updateReportStatus } from '../../../../services/reportService';
import { Report, ReportStatus } from '../../../../types';
import StatusBadge from '../../../../components/StatusBadge';
import { ArrowLeft, MapPin, Calendar, User, CheckCircle2, Camera, ThumbsUp, Sparkles } from 'lucide-react';

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<ReportStatus>('submitted');
  const [comment, setComment] = useState('');
  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetchReportById(resolvedParams.id).then((r) => {
      if (r) {
        setReport(r);
        setStatus(r.status);
        if (r.resolved_photo_url) setResolvedPhotoUrl(r.resolved_photo_url);
      }
    });
  }, [resolvedParams.id]);

  if (!report) {
    return <div style={{ color: '#fff', padding: 32 }}>Loading report details...</div>;
  }

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const success = await updateReportStatus({
      reportId: report.id,
      status,
      comment,
      resolvedPhotoUrl: status === 'resolved' ? resolvedPhotoUrl.trim() || null : null,
    });

    setSaving(false);
    if (success) {
      alert('Report status updated successfully in Supabase!');
      router.push('/reports');
    } else {
      alert('Failed to update status. Please try again.');
    }
  };

  return (
    <div>
      <Link
        href="/reports"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', textDecoration: 'none', fontSize: 13, marginBottom: 20 }}
      >
        <ArrowLeft size={16} />
        <span>Back to Reports List</span>
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Left Side: Photo Gallery & Report Info */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 24, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ fontSize: 20, fontWeight: 'bold', margin: 0 }}>{report.category.replace('_', ' ').toUpperCase()}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {report.confirmations_count && report.confirmations_count > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 'bold' }}>
                  <ThumbsUp size={13} />
                  <span>{report.confirmations_count} Citizen Upvotes</span>
                </div>
              ) : null}
              <StatusBadge status={report.status} />
            </div>
          </div>

          {/* Photo Gallery Display with Error Fallback */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 }}>ORIGINAL CITIZEN PHOTOS</h3>
            {report.photos && report.photos.length > 0 ? (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
                {report.photos.map((pUrl, idx) => {
                  const isError = imageErrorMap[idx];
                  if (isError) {
                    return (
                      <div
                        key={idx}
                        style={{
                          width: 220,
                          height: 160,
                          borderRadius: 10,
                          backgroundColor: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                        }}
                      >
                        <Camera size={32} color="#3b82f6" />
                        <span style={{ fontSize: 12, marginTop: 8, color: '#94a3b8', fontWeight: 500 }}>Photo Attached #{idx + 1}</span>
                      </div>
                    );
                  }
                  return (
                    <img
                      key={idx}
                      src={pUrl}
                      alt={`Report photo ${idx + 1}`}
                      onError={() => setImageErrorMap((prev) => ({ ...prev, [idx]: true }))}
                      style={{ width: 220, height: 160, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  );
                })}
              </div>
            ) : (
              <div style={{ height: 120, backgroundColor: '#0f172a', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <Camera size={28} />
                <span style={{ fontSize: 12, marginTop: 4 }}>No Original Photos Uploaded</span>
              </div>
            )}
          </div>

          {/* Feature A: Before & After Proof Photo Display */}
          {report.status === 'resolved' && (
            <div style={{ marginBottom: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34d399', fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>
                <Sparkles size={18} />
                <span>OFFICIAL MUNICIPAL "AFTER REPAIR" PROOF PHOTO</span>
              </div>
              {report.resolved_photo_url ? (
                <img
                  src={report.resolved_photo_url}
                  alt="Resolved Proof Photo"
                  style={{ width: '100%', maxHeight: 220, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(16, 185, 129, 0.4)' }}
                />
              ) : (
                <div style={{ fontSize: 13, color: '#a7f3d0' }}>No After-Repair proof photo uploaded yet. Add one in the form on the right!</div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8', marginBottom: 6 }}>PROBLEM DESCRIPTION</h3>
            <p style={{ fontSize: 14, color: '#f8fafc', lineHeight: 1.5 }}>{report.description}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#cbd5e1', paddingTop: 16, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#60a5fa' }}>
              <MapPin size={16} />
              <span>📍 {report.address} ({report.latitude.toFixed(4)}, {report.longitude.toFixed(4)})</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} />
              <span>Reported by: {report.is_anonymous ? 'Anonymous Citizen' : report.user_full_name || 'Citizen'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} />
              <span>Submission date: {new Date(report.created_at).toLocaleString('el-GR')}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Update Status Form ONLY */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 24, color: '#fff' }}>
          <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>Update Municipal Report Status</h2>

          <form onSubmit={handleSaveStatus}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Select New Report Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReportStatus)}
                style={{ width: '100%', backgroundColor: '#0f172a', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: 14, fontSize: 14, fontWeight: 'bold' }}
              >
                <option value="submitted">Submitted (Υποβλήθηκε)</option>
                <option value="acknowledged">Acknowledged (Παραλήφθηκε)</option>
                <option value="in_progress">In Progress (Σε Εξέλιξη)</option>
                <option value="resolved">Resolved (Επιλύθηκε)</option>
                <option value="cannot_fix">Cannot Fix (Αδυναμία Επίλυσης)</option>
              </select>
            </div>

            {/* Feature A: Proof Photo URL Uploader when status is RESOLVED */}
            {status === 'resolved' && (
              <div style={{ marginBottom: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 10, padding: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>
                  📷 Attach "After Repair" Proof Photo URL (Feature A)
                </label>
                <input
                  type="text"
                  placeholder="https://... or data:image/jpeg;base64,..."
                  value={resolvedPhotoUrl}
                  onChange={(e) => setResolvedPhotoUrl(e.target.value)}
                  style={{ width: '100%', backgroundColor: '#0f172a', color: '#fff', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 8, padding: 10, fontSize: 13 }}
                />
                <span style={{ fontSize: 11, color: '#a7f3d0', marginTop: 4, display: 'block' }}>
                  Upload a photo of the completed repair to show citizens proof of completion.
                </span>
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Official Municipal Note / Message to Citizen</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="e.g. Municipal crew completed repairs on Poseidonos Ave..."
                style={{ width: '100%', backgroundColor: '#0f172a', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8, padding: 12, fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                backgroundColor: '#16a34a',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: 14,
                fontWeight: 'bold',
                fontSize: 15,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={18} />
              <span>{saving ? 'Saving...' : 'Update Status & Notify Citizen'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
