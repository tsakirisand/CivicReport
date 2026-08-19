import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Report } from '../types';
import { fetchAllReports } from '../lib/reports-service';

export interface UseRealtimeReportsResult {
  reports: Report[];
  setReports: React.Dispatch<React.SetStateAction<Report[]>>;
  isLive: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useRealtimeReports(): UseRealtimeReportsResult {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadInitialData = async () => {
    const data = await fetchAllReports();
    setReports(data);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    loadInitialData();

    // Setup Supabase WebSocket Realtime Subscription
    const channel = supabase
      .channel('public:reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          console.log('⚡ Realtime reports change:', payload);
          setLastUpdated(new Date());

          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new;
            const formatted: Report = {
              id: newRecord.id,
              user_id: newRecord.user_id,
              category: newRecord.category,
              description: newRecord.description,
              latitude: Number(newRecord.latitude),
              longitude: Number(newRecord.longitude),
              address: newRecord.address,
              priority_level: newRecord.priority_level || 'medium',
              is_anonymous: newRecord.is_anonymous || false,
              status: newRecord.status || 'submitted',
              assigned_to: newRecord.assigned_to,
              photos_count: newRecord.photos_count || 0,
              view_count: newRecord.view_count || 1,
              created_at: newRecord.created_at,
              updated_at: newRecord.updated_at,
              photos: [],
              user_full_name: newRecord.is_anonymous ? 'Anonymous Citizen' : 'Citizen',
            };
            setReports((prev) => [formatted, ...prev.filter((r) => r.id !== formatted.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            setReports((prev) =>
              prev.map((r) =>
                r.id === updated.id
                  ? {
                      ...r,
                      status: updated.status,
                      priority_level: updated.priority_level,
                      assigned_to: updated.assigned_to,
                      updated_at: updated.updated_at,
                    }
                  : r
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setReports((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'report_updates' },
        (payload) => {
          console.log('⚡ Realtime report update/comment added:', payload);
          setLastUpdated(new Date());
          loadInitialData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLive(true);
        } else {
          setIsLive(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    reports,
    setReports,
    isLive,
    lastUpdated,
    refresh: loadInitialData,
  };
}
