import { useState, useEffect } from 'react';
import { Report } from '../types';
import { fetchReports } from '../services/reportService';
import { supabase } from '../lib/supabase';

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await fetchReports();
    setReports(data);
    setLoading(false);
  };

  useEffect(() => {
    load();

    // Subscribe to realtime report updates so new reports appear immediately
    const channel = supabase
      .channel('admin-reports-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        console.log('⚡ Admin Dashboard received Realtime report update');
        fetchReports().then(setReports);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { reports, setReports, loading, refresh: load };
}

export function useRealtime(onUpdate?: () => void) {
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const channel = supabase
      .channel('next-admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        if (onUpdate) onUpdate();
      })
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);

  return { isLive };
}
