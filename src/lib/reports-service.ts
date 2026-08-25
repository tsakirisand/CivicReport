import { supabase } from './supabase';
import { useCivicStore } from './store';
import { Report, ReportCategory, PriorityLevel, ReportStatus, ReportMessage } from '../types';

/**
 * Converts ANY string (e.g. Firebase UID "8x8IrvOlVqd...", email, or local ID "cr-8816")
 * into a deterministic 100% valid PostgreSQL UUID v4 string.
 */
export function toValidUuid(idStr: string | null | undefined): string | null {
  if (!idStr) return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idStr)) return idStr;

  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < idStr.length; i++) {
    const ch = idStr.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex = (Math.abs(h1).toString(16).padStart(8, '0') + Math.abs(h2).toString(16).padStart(8, '0') + '0000000000000000').slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export function isReportOwnedByUser(
  reportUserId: string | null | undefined,
  user: { id?: string; email?: string } | null | undefined
): boolean {
  if (!reportUserId || !user) return false;
  const raw = String(reportUserId).trim();
  if (!raw) return false;

  const targetId = user.id ? String(user.id).trim() : '';
  const targetEmail = user.email ? String(user.email).trim().toLowerCase() : '';

  // 1. Direct string match with Firebase UID or Email
  if (targetId && raw === targetId) return true;
  if (targetEmail && raw.toLowerCase() === targetEmail) return true;

  // 2. Deterministic UUID from Firebase UID (e.g. "8x8IrvOlVqd...")
  const uuidFromId = targetId ? toValidUuid(targetId) : null;
  if (uuidFromId && raw === uuidFromId) return true;

  // 3. Deterministic UUID from User Email (e.g. "user@example.com")
  const uuidFromEmail = targetEmail ? toValidUuid(targetEmail) : null;
  if (uuidFromEmail && raw === uuidFromEmail) return true;

  // 4. Converted Report UUID match against User UUIDs
  const reportUuid = toValidUuid(raw);
  if (reportUuid) {
    if (uuidFromId && reportUuid === uuidFromId) return true;
    if (uuidFromEmail && reportUuid === uuidFromEmail) return true;
  }

  return false;
}

/**
 * Uploads a local mobile image URI to Supabase Storage bucket 'report-photos'
 * Returns the public HTTP URL for web/mobile accessibility.
 */
async function uploadPhotoToSupabase(localUri: string, index: number): Promise<string> {
  if (localUri.startsWith('http://') || localUri.startsWith('https://') || localUri.startsWith('data:image/')) {
    return localUri;
  }

  try {
    const fileName = `photo_${Date.now()}_${index}.jpg`;
    const response = await fetch(localUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('report-photos')
      .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });

    if (error || !data) {
      console.warn('Storage upload error, using local fallback:', error?.message);
      return localUri;
    }

    const { data: publicUrlData } = supabase.storage.from('report-photos').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Photo upload failed, using local URI fallback:', err);
    return localUri;
  }
}

export async function fetchAllReports(): Promise<Report[]> {
  try {
    const currentUser = useCivicStore.getState().user;
    const userUuid = currentUser ? toValidUuid(currentUser.id || currentUser.email) : null;

    const { data, error } = await supabase
      .from('reports')
      .select('*, photos(*), report_updates(*), report_confirmations(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetchAllReports error:', error.message || JSON.stringify(error));
      return useCivicStore.getState().reports || [];
    }

    if (!data) {
      useCivicStore.getState().setReports([]);
      return [];
    }

    const remoteFormatted: Report[] = data.map((r: any) => {
      const confirmations = r.report_confirmations || [];
      const upvotesCount = confirmations.length > 0 ? confirmations.length : (r.confirmations_count || 0);
      const isConfirmedByMe = userUuid
        ? confirmations.some((c: any) => String(c.user_id) === String(userUuid))
        : false;

      return {
        id: r.id,
        user_id: r.user_id || null,
        category: r.category as ReportCategory,
        description: r.description,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        address: r.address,
        priority_level: (r.priority_level || 'medium') as PriorityLevel,
        is_anonymous: r.is_anonymous || false,
        status: (r.status || 'submitted') as ReportStatus,
        resolved_photo_url: r.resolved_photo_url || null,
        confirmations_count: upvotesCount,
        has_user_confirmed: isConfirmedByMe,
        photos_count: r.photos_count || (r.photos ? r.photos.length : 0),
        view_count: r.view_count || 1,
        created_at: r.created_at,
        updated_at: r.updated_at,
        photos: r.photos?.map((p: any) => p.photo_url) || [],
        user_full_name: r.is_anonymous ? 'Anonymous Citizen' : 'Citizen',
        updates: (r.report_updates || []).map((u: any) => ({
          id: u.id,
          report_id: u.report_id,
          status: u.status,
          message: u.message,
          resolved_photo_url: u.resolved_photo_url || null,
          updated_at: u.updated_at,
        })),
      };
    });

    useCivicStore.getState().setReports(remoteFormatted);
    return remoteFormatted;
  } catch (err: any) {
    console.error('Error in fetchAllReports:', err?.message || err);
    return useCivicStore.getState().reports || [];
  }
}

export async function ensureUserInSupabase(user: any): Promise<string | null> {
  if (!user) return null;
  const userUuid = toValidUuid(user.id || user.email);
  if (!userUuid) return null;

  try {
    const { error } = await supabase.from('users').upsert(
      {
        id: userUuid,
        email: user.email.toLowerCase(),
        full_name: user.full_name || user.email.split('@')[0],
        age: user.age || 25,
        municipality: user.municipality || 'Παλαιό Φάληρο',
        occupation: user.occupation || null,
        phone: user.phone || null,
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('Supabase ensureUserInSupabase notice:', error.message);
    }
    return userUuid;
  } catch (err) {
    console.warn('Supabase user upsert exception:', err);
    return userUuid;
  }
}

export async function submitNewReport(reportData: {
  category: ReportCategory;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  priority_level: PriorityLevel;
  is_anonymous: boolean;
  photos: string[];
}): Promise<Report> {
  try {
    const currentUser = useCivicStore.getState().user;
    let authorUuid = currentUser ? toValidUuid(currentUser.id || currentUser.email) : null;

    if (currentUser) {
      authorUuid = await ensureUserInSupabase(currentUser);
    }

    const uploadedPhotoUrls: string[] = [];
    for (let i = 0; i < reportData.photos.length; i++) {
      const publicUrl = await uploadPhotoToSupabase(reportData.photos[i], i);
      uploadedPhotoUrls.push(publicUrl);
    }

    let insertedReport: any = null;
    let reportErr: any = null;

    // 1st Attempt: Insert with authorUuid
    const res1 = await supabase
      .from('reports')
      .insert({
        user_id: authorUuid,
        category: reportData.category,
        description: reportData.description,
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        address: reportData.address,
        priority_level: reportData.priority_level,
        is_anonymous: reportData.is_anonymous,
        status: 'submitted',
        photos_count: uploadedPhotoUrls.length,
      })
      .select()
      .single();

    insertedReport = res1.data;
    reportErr = res1.error;

    // 2nd Attempt Fallback: If foreign key constraint is violated, insert with user_id: null
    if (reportErr && !insertedReport) {
      console.warn('First insert attempt failed with user_id, retrying with fallback:', reportErr.message);
      const res2 = await supabase
        .from('reports')
        .insert({
          user_id: null,
          category: reportData.category,
          description: reportData.description,
          latitude: reportData.latitude,
          longitude: reportData.longitude,
          address: reportData.address,
          priority_level: reportData.priority_level,
          is_anonymous: reportData.is_anonymous,
          status: 'submitted',
          photos_count: uploadedPhotoUrls.length,
        })
        .select()
        .single();

      insertedReport = res2.data;
      reportErr = res2.error;
    }

    if (reportErr || !insertedReport) {
      console.error('Error inserting report to Supabase:', reportErr?.message || JSON.stringify(reportErr));
      return useCivicStore.getState().addReport(reportData);
    }

    if (uploadedPhotoUrls.length > 0) {
      const photoPayload = uploadedPhotoUrls.map((url, i) => ({
        report_id: insertedReport.id,
        photo_url: url,
        order: i,
      }));
      await supabase.from('photos').insert(photoPayload);
    }

    const finalReport: Report = {
      id: insertedReport.id,
      user_id: authorUuid,
      category: insertedReport.category,
      description: insertedReport.description,
      latitude: Number(insertedReport.latitude),
      longitude: Number(insertedReport.longitude),
      address: insertedReport.address,
      priority_level: insertedReport.priority_level,
      is_anonymous: insertedReport.is_anonymous,
      status: insertedReport.status,
      photos_count: uploadedPhotoUrls.length,
      view_count: 1,
      created_at: insertedReport.created_at,
      updated_at: insertedReport.updated_at,
      photos: uploadedPhotoUrls,
      user_full_name: reportData.is_anonymous ? 'Anonymous Citizen' : 'Citizen',
    };

    useCivicStore.getState().addReport(finalReport);
    return finalReport;
  } catch (err) {
    console.error('Error submitting report:', err);
    return useCivicStore.getState().addReport(reportData);
  }
}

/**
 * Feature B: Upvote / Confirm Report Still Exists with Per-User Supabase DB Persistence
 */
export async function toggleReportUpvote(reportId: string): Promise<void> {
  const store = useCivicStore.getState();
  const user = store.user;
  if (!user) return;

  const targetReportUuid = toValidUuid(reportId) || reportId;
  const userUuid = toValidUuid(user.id || user.email);
  if (!userUuid) return;

  const currentReport = store.reports.find((r) => r.id === reportId);
  const currentlyConfirmed = Boolean(currentReport?.has_user_confirmed);

  // Update local store immediately for instant UI feedback
  store.toggleConfirmReport(reportId);

  try {
    if (currentlyConfirmed) {
      // User is unvoting
      const { error: delErr } = await supabase
        .from('report_confirmations')
        .delete()
        .eq('report_id', targetReportUuid)
        .eq('user_id', userUuid);

      if (delErr) console.error('Error deleting confirmation:', delErr.message);
    } else {
      // User is voting
      const { error: insErr } = await supabase.from('report_confirmations').insert({
        report_id: targetReportUuid,
        user_id: userUuid,
        confirms_still_exists: true,
      });

      if (insErr) console.error('Error inserting confirmation:', insErr.message);
    }

    // Get exact new count from Supabase
    const { count } = await supabase
      .from('report_confirmations')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', targetReportUuid);

    const newCount = typeof count === 'number' ? count : (currentReport?.confirmations_count || 0);

    // Persist exact upvote count on reports table
    await supabase
      .from('reports')
      .update({ confirmations_count: newCount })
      .eq('id', targetReportUuid);
  } catch (err) {
    console.error('Error toggling report upvote in Supabase:', err);
  }
}

export async function deleteReportItem(reportId: string): Promise<boolean> {
  useCivicStore.getState().deleteReport(reportId);
  const targetUuid = toValidUuid(reportId) || reportId;

  try {
    const { error } = await supabase.from('reports').delete().eq('id', targetUuid);
    if (error) {
      console.error('Supabase DB delete report error:', error.message);
    }
  } catch (err) {
    console.error('Error deleting report from Supabase:', err);
  }
  return true;
}

export async function updateReportStatusItem(reportId: string, status: ReportStatus, comment?: string): Promise<void> {
  useCivicStore.getState().updateReportStatus(reportId, status, comment);
  const targetUuid = toValidUuid(reportId) || reportId;

  try {
    await supabase.from('reports').update({ status }).eq('id', targetUuid);
    if (comment) {
      await supabase.from('report_updates').insert({
        report_id: targetUuid,
        status,
        message: comment,
      });
    }
  } catch (err) {
    console.error('Error updating report status:', err);
  }
}

export function subscribeToRealtimeReports() {
  fetchAllReports();

  const channel = supabase
    .channel('public:citizen-live-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'reports' },
      (payload) => {
        console.log('⚡ Citizen App received Realtime DB update:', payload);
        fetchAllReports();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'report_confirmations' },
      () => {
        console.log('⚡ Citizen App received Upvote Realtime update');
        fetchAllReports();
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'report_updates' },
      () => {
        fetchAllReports();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function fetchReportMessages(reportId: string): Promise<ReportMessage[]> {
  try {
    const targetUuid = toValidUuid(reportId) || reportId;
    const { data, error } = await supabase
      .from('report_messages')
      .select('*')
      .eq('report_id', targetUuid)
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

export async function sendCitizenReportMessage(params: {
  reportId: string;
  senderId?: string;
  senderName?: string;
  message: string;
}): Promise<ReportMessage | null> {
  try {
    const targetUuid = toValidUuid(params.reportId) || params.reportId;
    const storeUser = useCivicStore.getState().user;
    const senderId = params.senderId || (storeUser ? toValidUuid(storeUser.id || storeUser.email) || 'citizen-user' : 'citizen-user');
    const senderName = params.senderName || storeUser?.full_name || 'Citizen';

    if (!params.message.trim()) return null;

    const { data, error } = await supabase
      .from('report_messages')
      .insert({
        report_id: targetUuid,
        sender_id: senderId,
        sender_type: 'citizen',
        sender_name: senderName,
        message: params.message.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending citizen report message:', error.message);
      return null;
    }

    return data;
  } catch (err: any) {
    console.error('Error in sendCitizenReportMessage:', err?.message || err);
    return null;
  }
}
