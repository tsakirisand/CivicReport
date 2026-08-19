'use client';
import React, { useEffect, useRef } from 'react';
import { Report } from '../types';

interface LiveAdminMapProps {
  reports: Report[];
}

export default function LiveAdminMap({ reports }: LiveAdminMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Load Leaflet CSS dynamically if not present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (leafletInstance.current) {
        leafletInstance.current.remove();
      }

      // Center map on Palaio Faliro, Athens
      const map = L.map(mapRef.current, {
        center: [37.9254, 23.6961],
        zoom: 14,
        zoomControl: true,
      });
      leafletInstance.current = map;

      // Dark theme map tiles matching dashboard aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Force size recalculation to prevent blank gray tiles
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 300);

      // Plot live report markers
      reports.forEach((r) => {
        const pinColor = r.status === 'resolved' ? '#10b981' : r.priority_level === 'high' ? '#ef4444' : '#3b82f6';
        
        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="background-color: ${pinColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; cursor: pointer;">📍</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([r.latitude, r.longitude], { icon: customIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 220px; color: #0f172a;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <strong style="font-size: 14px; color: #2563eb;">${r.category.replace('_', ' ').toUpperCase()}</strong>
              <span style="font-size: 10px; font-weight: bold; background: ${pinColor}; color: white; padding: 2px 6px; border-radius: 10px;">${r.status.toUpperCase()}</span>
            </div>
            <p style="margin: 6px 0; font-size: 13px; color: #334155; line-height: 1.4;">${r.description}</p>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">📍 ${r.address}</div>
          </div>
        `);
      });
    };

    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [reports]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: 540,
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#0f172a',
          zIndex: 1,
        }}
      />
    </div>
  );
}
