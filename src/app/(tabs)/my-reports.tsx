import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCivicStore } from '../../lib/store';
import { Report, TRANSLATIONS } from '../../types';
import { getCategoryBadge, getMarkerColor } from '../../components/map/interactive-map';
import { ReportDetailModal } from '../../components/reports/report-detail-modal';
import { fetchAllReports } from '../../lib/reports-service';

export default function MyReportsScreen() {
  const router = useRouter();
  const { reports, user, isGuest, settings } = useCivicStore();
  const isDark = settings?.darkMode || false;
  const lang = settings?.language || 'EN';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'resolved'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllReports();
    setRefreshing(false);
  };

  // Guest Access Control: Guests can ONLY view the Map tab
  if (isGuest || !user) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.guestLockBox}>
          <View style={styles.guestLockIconCircle}>
            <Ionicons name="map-outline" size={56} color="#2563eb" />
          </View>
          <Text style={[styles.guestLockTitle, isDark && styles.textDark]}>Guest Mode — Map Only 🗺️</Text>
          <Text style={styles.guestLockSub}>
            Guest users can view reported municipal issues on the Interactive Map. To view your submitted report history, please sign in or create an account.
          </Text>

          <TouchableOpacity
            style={styles.guestLockPrimaryBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.guestLockPrimaryBtnText}>Sign In</Text>
            <Ionicons name="log-in-outline" size={18} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestLockSecondaryBtn}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.guestLockSecondaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestLockMapLink}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.guestLockMapLinkText}>Return to Interactive Map ➔</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Filter Reports for "My Reports" view (strictly current user's submitted reports)
  const myReports = useMemo(() => {
    if (!user) return [];
    return reports.filter((r) => {
      if (r.user_id !== user.id) return false;

      if (statusTab === 'active' && r.status === 'resolved') return false;
      if (statusTab === 'resolved' && r.status !== 'resolved') return false;

      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchAddr = r.address.toLowerCase().includes(q);
        const matchCat = r.category.toLowerCase().includes(q);
        if (!matchDesc && !matchAddr && !matchCat) return false;
      }

      return true;
    });
  }, [reports, user, statusTab, searchQuery]);

  const getRelativeDate = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 1) return lang === 'EL' ? 'Μόλις τώρα' : 'Just now';
    if (diffHours < 24) return lang === 'EL' ? `Πριν ${diffHours} ώρες` : `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return lang === 'EL' ? 'Χθες' : 'Yesterday';
    return lang === 'EL' ? `Πριν ${diffDays} ημέρες` : `${diffDays} days ago`;
  };

  const renderReportCard = ({ item }: { item: Report }) => {
    const catInfo = getCategoryBadge(item.category, lang);
    const statusColor = getMarkerColor(item.priority_level, item.status, item.is_anonymous);

    return (
      <TouchableOpacity
        style={[styles.card, isDark && styles.cardDark]}
        onPress={() => setSelectedReport(item)}
        activeOpacity={0.8}
      >
        {item.photos && item.photos[0] ? (
          <Image source={{ uri: item.photos[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.noImagePlaceholder, isDark && styles.noImagePlaceholderDark]}>
            <Ionicons name="image-outline" size={32} color={isDark ? '#64748b' : '#cbd5e1'} />
          </View>
        )}

        <View style={styles.cardBody}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.catBadge, { backgroundColor: catInfo.color + '20' }]}>
              <Ionicons name={catInfo.iconName as any} size={14} color={catInfo.color} />
              <Text style={[styles.catBadgeText, { color: catInfo.color }]}>
                {catInfo.label}
              </Text>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {item.status.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDesc, isDark && styles.textDark]} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.cardFooterRow}>
            <View style={styles.addressBox}>
              <Ionicons name="location-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.addressText, isDark && styles.subTextDark]} numberOfLines={1}>
                {item.address}
              </Text>
            </View>

            <Text style={[styles.dateText, isDark && styles.subTextDark]}>{getRelativeDate(item.created_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Top Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>
          {t.myReportsTitle}
        </Text>
        <Text style={[styles.headerSubtitle, isDark && styles.subTextDark]}>
          {t.myReportsSub}
        </Text>

        {/* Search Bar */}
        <View style={[styles.searchBox, isDark && styles.searchBoxDark]}>
          <Ionicons name="search-outline" size={18} color={isDark ? '#60a5fa' : '#64748b'} />
          <TextInput
            style={[styles.searchInput, isDark && styles.textDark]}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Tab Switcher */}
        <View style={[styles.tabRow, isDark && styles.tabRowDark]}>
          {(
            [
              { id: 'all', label: t.allReports },
              { id: 'active', label: t.activeReports },
              { id: 'resolved', label: t.resolvedReports },
            ] as const
          ).map((tab) => {
            const active = statusTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabBtn,
                  active && styles.tabBtnActive,
                  isDark && active && styles.tabBtnActiveDark,
                ]}
                onPress={() => setStatusTab(tab.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    isDark && styles.tabBtnTextDark,
                    active && styles.tabBtnTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Reports FlatList */}
      <FlatList
        data={myReports}
        keyExtractor={(item) => item.id}
        renderItem={renderReportCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={isDark ? '#60a5fa' : '#2563eb'} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBadge, isDark && styles.emptyIconBadgeDark]}>
              <Ionicons name="clipboard-outline" size={40} color={isDark ? '#60a5fa' : '#2563eb'} />
            </View>

            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
              {!user ? t.loginRequired : searchQuery ? (lang === 'EL' ? 'Δεν βρέθηκαν αναφορές' : 'No Matching Reports') : t.noReportsTitle}
            </Text>

            <Text style={[styles.emptySub, isDark && styles.subTextDark]}>
              {!user
                ? t.loginPrompt
                : searchQuery
                ? (lang === 'EL' ? 'Δεν υπάρχουν αναφορές που να ταιριάζουν με την αναζήτηση.' : 'No reports match your current search query.')
                : t.noReportsSub}
            </Text>

            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => {
                if (!user) {
                  router.push('/(auth)/login');
                } else {
                  router.push('/(tabs)/report');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name={!user ? 'log-in-outline' : 'add-circle-outline'} size={20} color="#ffffff" />
              <Text style={styles.emptyActionBtnText}>
                {!user ? t.signIn : (lang === 'EL' ? 'Νέα Αναφορά Παλαιού Φαλήρου' : 'Create New Report')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ReportDetailModal
        report={selectedReport}
        visible={selectedReport !== null}
        onClose={() => setSelectedReport(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 14,
  },
  textDark: {
    color: '#ffffff',
  },
  subTextDark: {
    color: '#94a3b8',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchBoxDark: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabRowDark: {
    backgroundColor: '#0f172a',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#2563eb',
  },
  tabBtnActiveDark: {
    backgroundColor: '#2563eb',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },
  tabBtnTextDark: {
    color: '#cbd5e1',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  noImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImagePlaceholderDark: {
    backgroundColor: '#0f172a',
  },
  cardBody: {
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  catBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconBadgeDark: {
    backgroundColor: 'rgba(96, 165, 250, 0.15)',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 24,
  },
  emptyActionBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  guestLockBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  guestLockIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestLockTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestLockSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  guestLockPrimaryBtn: {
    backgroundColor: '#2563eb',
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  guestLockPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  guestLockSecondaryBtn: {
    backgroundColor: '#f1f5f9',
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestLockSecondaryBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  guestLockMapLink: {
    paddingVertical: 8,
  },
  guestLockMapLinkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },
});
