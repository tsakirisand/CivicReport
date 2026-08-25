import { supabase } from '../lib/supabase';
import { Report, ReportStatus, ReportMessage } from '../types';

export async function fetchReports(): Promise<Report[]> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, photos(*), report_updates(*), report_confirmations(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Query Error:', error.message || JSON.stringify(error));
      return [];
    }

    if (!data) return [];

    return data.map((r: any) => {
      const upvotes = r.report_confirmations ? r.report_confirmations.length : (r.confirmations_count || 0);

      return {
        id: r.id,
        user_id: r.user_id,
        category: r.category,
        description: r.description,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        address: r.address,
        priority_level: r.priority_level || 'medium',
        is_anonymous: r.is_anonymous || false,
        status: r.status || 'submitted',
        resolved_photo_url: r.resolved_photo_url || null,
        confirmations_count: upvotes,
        photos_count: r.photos_count || (r.photos ? r.photos.length : 0),
        view_count: r.view_count || 1,
        created_at: r.created_at,
        updated_at: r.updated_at,
        photos: r.photos?.map((p: any) => p.photo_url) || [],
        user_full_name: r.is_anonymous ? 'Anonymous Citizen' : 'Citizen',
        updates: r.report_updates || [],
      };
    });
  } catch (err: any) {
    console.error('Failed to connect to Supabase:', err?.message || err);
    return [];
  }
}

export async function fetchReportById(id: string): Promise<Report | null> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, photos(*), report_updates(*), report_confirmations(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;

    const upvotes = data.report_confirmations ? data.report_confirmations.length : (data.confirmations_count || 0);

    return {
      id: data.id,
      user_id: data.user_id,
      category: data.category,
      description: data.description,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      address: data.address,
      priority_level: data.priority_level || 'medium',
      is_anonymous: data.is_anonymous || false,
      status: data.status || 'submitted',
      resolved_photo_url: data.resolved_photo_url || null,
      confirmations_count: upvotes,
      photos_count: data.photos_count || (data.photos ? data.photos.length : 0),
      view_count: data.view_count || 1,
      created_at: data.created_at,
      updated_at: data.updated_at,
      photos: data.photos?.map((p: any) => p.photo_url) || [],
      user_full_name: data.is_anonymous ? 'Anonymous Citizen' : 'Citizen',
      updates: data.report_updates || [],
    };
  } catch (err) {
    return null;
  }
}

export async function updateReportStatus(params: {
  reportId: string;
  status: ReportStatus;
  comment?: string;
  resolvedPhotoUrl?: string | null;
}): Promise<boolean> {
  try {
    const { reportId, status, comment, resolvedPhotoUrl } = params;

    const payload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (resolvedPhotoUrl !== undefined) {
      payload.resolved_photo_url = resolvedPhotoUrl;
    }

    const { error: updateErr } = await supabase.from('reports').update(payload).eq('id', reportId);
    if (updateErr) {
      console.error('Error updating report status in Supabase:', updateErr.message || JSON.stringify(updateErr));
      return false;
    }

    if ((comment && comment.trim()) || resolvedPhotoUrl) {
      await supabase.from('report_updates').insert({
        report_id: reportId,
        status,
        message: comment ? comment.trim() : `Status updated to ${status.toUpperCase()}`,
        resolved_photo_url: resolvedPhotoUrl || null,
      });
    }

    // Insert audit log
    await supabase.from('audit_logs').insert({
      action: `STATUS_CHANGE_${status.toUpperCase()}`,
      report_id: reportId,
      changes: { status, comment: comment || null, resolved_photo_url: resolvedPhotoUrl || null },
    });

    return true;
  } catch (err: any) {
    console.error('Error in updateReportStatus:', err?.message || err);
    return false;
  }
}

export async function fetchReportMessages(reportId: string): Promise<ReportMessage[]> {
  try {
    const { data, error } = await supabase
      .from('report_messages')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching report messages:', error.message);
      return [];
    }

    return data || [];
  } catch (err: any) {
    console.error('Error in fetchReportMessages:', err?.message || err);
    return [];
  }
}

export async function sendReportMessage(params: {
  reportId: string;
  senderId?: string;
  senderName?: string;
  message: string;
}): Promise<ReportMessage | null> {
  try {
    const { reportId, senderId = 'admin-officer', senderName = 'Municipality Admin', message } = params;
    if (!message.trim()) return null;

    const { data, error } = await supabase
      .from('report_messages')
      .insert({
        report_id: reportId,
        sender_id: senderId,
        sender_type: 'admin',
        sender_name: senderName,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending report message:', error.message);
      return null;
    }

    // Insert audit log for chat action
    await supabase.from('audit_logs').insert({
      action: 'ADMIN_SENT_CHAT_MESSAGE',
      report_id: reportId,
      changes: { message: message.trim(), sender_name: senderName },
    });

    return data;
  } catch (err: any) {
    console.error('Error in sendReportMessage:', err?.message || err);
    return null;
  }
}
