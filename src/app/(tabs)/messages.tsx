import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCivicStore } from '../../lib/store';
import { Report, TRANSLATIONS } from '../../types';
import { getCategoryBadge, getMarkerColor } from '../../components/map/interactive-map';
import { ReportDetailModal } from '../../components/reports/report-detail-modal';
import { fetchAllReports, toValidUuid, isReportOwnedByUser } from '../../lib/reports-service';

export default function MessagesScreen() {
  const router = useRouter();
  const { reports, user, isGuest, settings } = useCivicStore();
  const isDark = settings?.darkMode || false;
  const lang = settings?.language || 'EN';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Filter reports strictly created by the logged-in user
  const userReports = useMemo(() => {
    if (!user) return [];
    return reports.filter((r) => isReportOwnedByUser(r.user_id, user));
  }, [reports, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllReports();
    setRefreshing(false);
  };

  const handleOpenChat = (report: Report) => {
    router.push(`/chat/${report.id}`);
  };

  // Guest Access Control
  if (isGuest || !user) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.guestLockBox}>
          <View style={styles.guestLockIconCircle}>
            <Ionicons name="chatbubbles-outline" size={56} color="#2563eb" />
          </View>
          <Text style={[styles.guestLockTitle, isDark && styles.textDark]}>
            {lang === 'EL' ? 'Απαιτείται Σύνδεση 🔒' : 'Sign In Required 🔒'}
          </Text>
          <Text style={styles.guestLockSub}>
            {lang === 'EL'
              ? 'Συνδεθείτε για να συνομιλήσετε απευθείας με τον Δήμο Παλαιού Φαλήρου για τις αναφορές σας.'
              : 'Sign in or create an account to text directly 1-on-1 with municipal officials regarding your reports.'}
          </Text>

          <TouchableOpacity
            style={styles.guestLockPrimaryBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.guestLockPrimaryBtnText}>{t.signIn}</Text>
            <Ionicons name="log-in-outline" size={18} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestLockSecondaryBtn}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.guestLockSecondaryBtnText}>{t.createAccount}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>{t.messagesTitle}</Text>
        <Text style={styles.headerSub}>{t.messagesSub}</Text>
      </View>

      {/* Messages List */}
      <FlatList
        data={userReports}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2563eb" />
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="chatbox-ellipses-outline" size={64} color={isDark ? '#64748b' : '#94a3b8'} />
            <Text style={[styles.emptyTitle, isDark && styles.textDark]}>{t.noChatsTitle}</Text>
            <Text style={styles.emptySub}>{t.noChatsSub}</Text>

            <TouchableOpacity
              style={styles.createReportBtn}
              onPress={() => router.push('/(tabs)/report')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
              <Text style={styles.createReportBtnText}>{t.createReport}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const categoryInfo = getCategoryBadge(item.category, lang);
          const statusColor = getMarkerColor(item.priority_level, item.status, item.is_anonymous);

          return (
            <TouchableOpacity
              style={[styles.card, isDark && styles.cardDark]}
              onPress={() => handleOpenChat(item)}
              activeOpacity={0.8}
            >
              {/* Category Icon & Details */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: categoryInfo.color + '20' }]}>
                  <Ionicons name={categoryInfo.iconName as any} size={22} color={categoryInfo.color} />
                </View>

                <View style={styles.cardHeaderInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, isDark && styles.textDark]} numberOfLines={1}>
                      {categoryInfo.label}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {item.status.toUpperCase().replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardAddress} numberOfLines={1}>
                    📍 {item.address}
                  </Text>
                </View>
              </View>

              {/* Chat Status Row */}
              <View style={[styles.chatPreviewBox, isDark && styles.chatPreviewBoxDark]}>
                <Ionicons name="chatbubbles-outline" size={18} color="#2563eb" />
                <Text style={[styles.chatPreviewText, isDark && styles.subTextDark]} numberOfLines={1}>
                  {lang === 'EL'
                    ? 'Πατήστε για να ανοίξετε την απευθείας συνομιλία με τον Δήμο'
                    : 'Tap to open 1-on-1 chat thread with municipality'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={isDark ? '#64748b' : '#94a3b8'} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Report & Chat Modal */}
      <ReportDetailModal
        report={selectedReport}
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
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
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  textDark: {
    color: '#ffffff',
  },
  subTextDark: {
    color: '#cbd5e1',
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  cardAddress: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chatPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  chatPreviewBoxDark: {
    backgroundColor: '#0f172a',
  },
  chatPreviewText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  createReportBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createReportBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  guestLockBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  guestLockIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guestLockTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  guestLockSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  guestLockPrimaryBtn: {
    backgroundColor: '#2563eb',
    width: '100%',
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guestLockPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  guestLockSecondaryBtn: {
    backgroundColor: '#f1f5f9',
    width: '100%',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLockSecondaryBtnText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
  },
});
