import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useRealtime(onUpdate?: () => void) {
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const channel = supabase
      .channel('next-admin-realtime-sub')
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
