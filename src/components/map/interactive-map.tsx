import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Report, REPORT_CATEGORIES, TRANSLATIONS } from '../../types';
import { useCivicStore } from '../../lib/store';

interface InteractiveMapProps {
  reports: Report[];
  onSelectReport: (report: Report) => void;
  selectedReportId?: string;
  onOpenFilters: () => void;
}

const { width, height } = Dimensions.get('window');

const PALAIO_FALIRO_REGION = {
  latitude: 37.9254,
  longitude: 23.6961,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export function getMarkerColor(priority: string, status: string, isAnonymous: boolean) {
  if (isAnonymous) return '#6b7280';
  if (status === 'resolved') return '#10b981';
  if (priority === 'high') return '#ef4444';
  if (priority === 'medium') return '#f59e0b';
  return '#3b82f6';
}

export function getCategoryBadge(category: string, lang: 'EN' | 'EL' = 'EN') {
  const item = REPORT_CATEGORIES.find((c) => c.id === category);
  if (!item) return { label: category, iconName: 'alert-circle', color: '#3b82f6' };
  return {
    label: lang === 'EL' ? item.labelEl : item.label,
    iconName: item.iconName,
    color: item.color,
  };
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  reports,
  onSelectReport,
  selectedReportId,
  onOpenFilters,
}) => {
  const mapRef = useRef<MapView | null>(null);
  const { settings } = useCivicStore();
  const isDark = settings?.darkMode || false;
  const lang = settings?.language || 'EN';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  const [locating, setLocating] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(
    reports.find((r) => r.id === selectedReportId) || null
  );

  const handleRecenterToLiveGPS = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          lang === 'EL' ? 'Δικαιώματα Τοποθεσίας' : 'Permission Denied',
          lang === 'EL' ? 'Απαιτείται πρόσβαση στην τοποθεσία.' : 'Location permission is required.'
        );
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      mapRef.current?.animateToRegion(
        {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    } catch (err: any) {
      console.log('GPS recenter error', err);
      Alert.alert(
        lang === 'EL' ? 'Σφάλμα GPS' : 'GPS Error',
        lang === 'EL' ? 'Δεν ήταν δυνατή η λήψη της ζωντανής τοποθεσίας.' : 'Could not fetch live GPS position.'
      );
    }
    setLocating(false);
  };

  return (
    <View style={styles.container}>
      {/* Native Map Canvas */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={PALAIO_FALIRO_REGION}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {reports.map((report) => {
          const color = getMarkerColor(report.priority_level, report.status, report.is_anonymous);
          const isSelected = activeReport?.id === report.id;
          const catInfo = getCategoryBadge(report.category, lang);

          return (
            <Marker
              key={report.id}
              coordinate={{
                latitude: Number(report.latitude) || 37.9254,
                longitude: Number(report.longitude) || 23.6961,
              }}
              onPress={() => setActiveReport(report)}
            >
              <View style={[styles.markerPin, { backgroundColor: color }, isSelected && styles.markerSelected]}>
                <Ionicons name={catInfo.iconName as any} size={18} color="#ffffff" />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Header Overlay - Palaio Faliro Title */}
      <View style={styles.topHeaderOverlay}>
        <View style={[styles.municipalityTitleCard, isDark && styles.municipalityTitleCardDark]}>
          <Ionicons name="location" size={18} color={isDark ? '#60a5fa' : '#2563eb'} />
          <Text style={[styles.municipalityTitleText, isDark && styles.textDark]}>
            {lang === 'EL' ? 'Δήμος Παλαιού Φαλήρου' : 'Municipality of Palaio Faliro'}
          </Text>
        </View>

        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={[styles.filterButton, isDark && styles.filterButtonDark]}
            onPress={onOpenFilters}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={18} color={isDark ? '#f8fafc' : '#0f172a'} />
            <Text style={[styles.filterButtonText, isDark && styles.textDark]}>
              {t.filterSearch} ({reports.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gpsFloatingBtn, isDark && styles.gpsFloatingBtnDark]}
            onPress={handleRecenterToLiveGPS}
            disabled={locating}
            activeOpacity={0.8}
          >
            {locating ? (
              <ActivityIndicator size="small" color={isDark ? '#60a5fa' : '#2563eb'} />
            ) : (
              <Ionicons name="locate" size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Empty State Overlay */}
      {reports.length === 0 && !activeReport && (
        <View style={[styles.emptyMapBanner, isDark && styles.emptyMapBannerDark]}>
          <Ionicons name="map-outline" size={24} color={isDark ? '#60a5fa' : '#2563eb'} />
          <View style={styles.emptyMapTextCol}>
            <Text style={[styles.emptyMapTitle, isDark && styles.textDark]}>
              {lang === 'EL' ? 'Χάρτης Παλαιού Φαλήρου' : 'Palaio Faliro Live Map'}
            </Text>
            <Text style={[styles.emptyMapSub, isDark && styles.subTextDark]}>
              {lang === 'EL'
                ? 'Δεν υπάρχουν αναφορές ακόμα. Πιέστε το ➕ για να προσθέσετε!'
                : 'No reports submitted yet in Palaio Faliro. Tap the ➕ button to submit a report!'}
            </Text>
          </View>
        </View>
      )}

      {/* Floating Bottom Report Preview Card */}
      {activeReport && (
        <View style={styles.previewCardContainer}>
          <TouchableOpacity
            style={[styles.previewCard, isDark && styles.previewCardDark]}
            onPress={() => onSelectReport(activeReport)}
            activeOpacity={0.9}
          >
            {activeReport.photos && activeReport.photos.length > 0 ? (
              <Image source={{ uri: activeReport.photos[0] }} style={styles.previewImage} />
            ) : (
              <View style={[styles.previewNoImage, isDark && styles.previewNoImageDark]}>
                <Ionicons name="image-outline" size={32} color={isDark ? '#64748b' : '#94a3b8'} />
              </View>
            )}

            <View style={styles.previewContent}>
              <View style={styles.previewHeaderRow}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getMarkerColor(
                        activeReport.priority_level,
                        activeReport.status,
                        activeReport.is_anonymous
                      ) + '20',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: getMarkerColor(
                          activeReport.priority_level,
                          activeReport.status,
                          activeReport.is_anonymous
                        ),
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: getMarkerColor(
                          activeReport.priority_level,
                          activeReport.status,
                          activeReport.is_anonymous
                        ),
                      },
                    ]}
                  >
                    {activeReport.status.toUpperCase().replace('_', ' ')}
                  </Text>
                </View>
                <Text style={[styles.priorityText, isDark && styles.subTextDark]}>
                  {activeReport.priority_level.toUpperCase()} {lang === 'EL' ? 'ΠΡΟΤΕΡΑΙΟΤΗΤΑ' : 'PRIORITY'}
                </Text>
              </View>

              <Text style={[styles.previewTitle, isDark && styles.textDark]} numberOfLines={1}>
                {getCategoryBadge(activeReport.category, lang).label}
              </Text>

              <Text style={[styles.previewDescription, isDark && styles.subTextDark]} numberOfLines={2}>
                {activeReport.description}
              </Text>

              <View style={styles.previewAddressRow}>
                <Ionicons name="location-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.previewAddressText, isDark && styles.subTextDark]} numberOfLines={1}>
                  {activeReport.address}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => onSelectReport(activeReport)}
              >
                <Text style={styles.viewDetailsButtonText}>{t.viewDetails}</Text>
                <Ionicons name="arrow-forward" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.closeCardButton, isDark && styles.closeCardButtonDark]}
              onPress={() => setActiveReport(null)}
            >
              <Ionicons name="close" size={16} color={isDark ? '#f8fafc' : '#64748b'} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  topHeaderOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 36,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 8,
  },
  municipalityTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    gap: 6,
  },
  municipalityTitleCardDark: {
    backgroundColor: '#1e293b',
  },
  municipalityTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  textDark: {
    color: '#ffffff',
  },
  subTextDark: {
    color: '#cbd5e1',
  },
  topButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    gap: 8,
  },
  filterButtonDark: {
    backgroundColor: '#1e293b',
  },
  filterButtonText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  gpsFloatingBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  gpsFloatingBtnDark: {
    backgroundColor: '#1e293b',
  },
  markerPin: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    transform: [{ scale: 1.25 }],
    borderColor: '#0f172a',
  },
  emptyMapBanner: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    gap: 12,
  },
  emptyMapBannerDark: {
    backgroundColor: '#1e293b',
  },
  emptyMapTextCol: {
    flex: 1,
  },
  emptyMapTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyMapSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  previewCardContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    padding: 12,
    position: 'relative',
  },
  previewCardDark: {
    backgroundColor: '#1e293b',
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
  },
  previewNoImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewNoImageDark: {
    backgroundColor: '#0f172a',
  },
  previewContent: {
    marginTop: 10,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 8,
  },
  previewAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  previewAddressText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  viewDetailsButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  viewDetailsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeCardButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeCardButtonDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
  },
});
