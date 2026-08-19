import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Report, ReportStatus, TRANSLATIONS } from '../../types';
import { getCategoryBadge, getMarkerColor } from '../map/interactive-map';
import { useCivicStore } from '../../lib/store';
import { toggleReportUpvote, deleteReportItem, toValidUuid } from '../../lib/reports-service';

interface ReportDetailModalProps {
  report: Report | null;
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  visible,
  onClose,
}) => {
  const { user, deleteReport, settings, reports } = useCivicStore();
  const isDark = settings?.darkMode || false;
  const lang = settings?.language || 'EN';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Read live report object from store
  const activeReport = reports.find((r) => r.id === report?.id) || report;

  if (!activeReport) return null;

  const TIMELINE_STAGES: { id: ReportStatus; label: string }[] = [
    { id: 'submitted', label: lang === 'EL' ? 'Υποβλήθηκε' : 'Submitted' },
    { id: 'acknowledged', label: lang === 'EL' ? 'Παραλήφθηκε' : 'Acknowledged' },
    { id: 'in_progress', label: lang === 'EL' ? 'Σε Εξέλιξη' : 'In Progress' },
    { id: 'resolved', label: lang === 'EL' ? 'Επιλύθηκε' : 'Resolved' },
  ];

  const currentUserUuid = user ? toValidUuid(user.id || user.email) : null;
  const isOwner = Boolean(
    currentUserUuid &&
    activeReport.user_id &&
    (String(activeReport.user_id) === String(currentUserUuid) ||
     String(toValidUuid(activeReport.user_id)) === String(currentUserUuid))
  );

  const categoryInfo = getCategoryBadge(activeReport.category, lang);
  const statusColor = getMarkerColor(activeReport.priority_level, activeReport.status, activeReport.is_anonymous);

  const handleShare = async () => {
    try {
      await Share.share({
        title: `CivicReport: ${categoryInfo.label}`,
        message: `Check out this municipal issue on CivicReport: ${categoryInfo.label} at ${activeReport.address}. Status: ${activeReport.status}`,
      });
    } catch (error) {
      console.log('Share error', error);
    }
  };

  const handleDelete = () => {
    if (!isOwner) {
      Alert.alert(
        lang === 'EL' ? 'Δεν Επιτρέπεται' : 'Permission Denied',
        lang === 'EL' ? 'Μόνο ο αρχικός συντάκτης της αναφοράς μπορεί να τη διαγράψει.' : 'Only the original creator of this report can delete it.'
      );
      return;
    }
    Alert.alert(
      lang === 'EL' ? 'Διαγραφή Αναφοράς' : 'Delete Report',
      lang === 'EL' ? 'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την αναφορά;' : 'Are you sure you want to delete this submitted report?',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: lang === 'EL' ? 'Διαγραφή' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteReportItem(activeReport.id);
            onClose();
          },
        },
      ]
    );
  };

  const getStatusStepIndex = (status: ReportStatus) => {
    switch (status) {
      case 'submitted':
        return 0;
      case 'acknowledged':
        return 1;
      case 'in_progress':
        return 2;
      case 'resolved':
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStatusStepIndex(activeReport.status);



  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, isDark && styles.containerDark]}>
        {/* Top Control Bar */}
        <View style={[styles.topBar, isDark && styles.topBarDark]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={isDark ? '#f8fafc' : '#0f172a'} />
          </TouchableOpacity>

          <Text style={[styles.topBarTitle, isDark && styles.textDark]} numberOfLines={1}>
            #{activeReport.id.substring(0, 8).toUpperCase()}
          </Text>

          <View style={styles.topRightActions}>
            <TouchableOpacity onPress={handleShare} style={styles.actionIconBtn}>
              <Ionicons name="share-social-outline" size={22} color={isDark ? '#60a5fa' : '#2563eb'} />
            </TouchableOpacity>

            {isOwner && (
              <TouchableOpacity onPress={handleDelete} style={styles.actionIconBtn}>
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Photo Carousel Header */}
          {activeReport.photos && activeReport.photos.length > 0 ? (
            <View style={styles.carouselContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const slide = Math.ceil(e.nativeEvent.contentOffset.x / width);
                  if (slide !== activePhotoIdx) setActivePhotoIdx(slide);
                }}
                scrollEventThrottle={16}
              >
                {activeReport.photos.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={styles.carouselImg} resizeMode="cover" />
                ))}
              </ScrollView>

              {activeReport.photos.length > 1 && (
                <View style={styles.paginationBox}>
                  {activeReport.photos.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.paginationDot,
                        activePhotoIdx === idx && styles.paginationDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.noImageBanner, isDark && styles.noImageBannerDark]}>
              <Ionicons name="image-outline" size={48} color={isDark ? '#64748b' : '#cbd5e1'} />
            </View>
          )}

          {/* Details Body Container */}
          <View style={styles.contentBody}>
            {/* Status & Priority Badge Row */}
            <View style={styles.badgesRow}>
              <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
                <Ionicons name={categoryInfo.iconName as any} size={16} color={categoryInfo.color} />
                <Text style={[styles.categoryBadgeText, { color: categoryInfo.color }]}>
                  {categoryInfo.label}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                  {activeReport.status.toUpperCase().replace('_', ' ')}
                </Text>
              </View>

              <Text style={styles.priorityLabel}>
                {activeReport.priority_level.toUpperCase()} {lang === 'EL' ? 'ΠΡΟΤΕΡΑΙΟΤΗΤΑ' : 'PRIORITY'}
              </Text>
            </View>

            {/* Feature A: Before & After Proof Photo Side-by-Side Comparison */}
            {activeReport.status === 'resolved' && (
              <View style={[styles.proofBox, isDark && styles.proofBoxDark]}>
                <View style={styles.proofHeader}>
                  <Ionicons name="sparkles" size={20} color="#10b981" />
                  <Text style={styles.proofTitle}>
                    {lang === 'EL' ? 'Επίσημη Απόδειξη Επισκευής Δήμου (Πριν & Μετά)' : 'Official Municipal Repair Proof (Before & After)'}
                  </Text>
                </View>

                <View style={styles.proofGrid}>
                  <View style={styles.proofCol}>
                    <Text style={styles.proofLabel}>BEFORE (CITIZEN PHOTO)</Text>
                    {activeReport.photos && activeReport.photos.length > 0 ? (
                      <Image source={{ uri: activeReport.photos[0] }} style={styles.proofImg} />
                    ) : (
                      <View style={styles.noProofBox}><Text style={{ color: '#94a3b8' }}>No Photo</Text></View>
                    )}
                  </View>

                  <View style={styles.proofCol}>
                    <Text style={styles.proofLabel}>AFTER (MUNICIPAL FIX)</Text>
                    {activeReport.resolved_photo_url ? (
                      <Image source={{ uri: activeReport.resolved_photo_url }} style={[styles.proofImg, { borderColor: '#10b981', borderWidth: 2 }]} />
                    ) : (
                      <View style={styles.noProofBox}><Text style={{ color: '#10b981', fontSize: 11, textAlign: 'center' }}>Resolved & Fixed ✅</Text></View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Title & Description Card */}
            <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
              <Text style={[styles.descriptionTitle, isDark && styles.textDark]}>
                {categoryInfo.label}
              </Text>
              <Text style={[styles.descriptionText, isDark && styles.subTextDark]}>
                {activeReport.description}
              </Text>
            </View>

            {/* Address & Location Card */}
            <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
              <Text style={styles.sectionCardTitle}>{t.issueLocation}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={20} color="#2563eb" />
                <Text style={[styles.locationText, isDark && styles.subTextDark]}>{activeReport.address}</Text>
              </View>
              <Text style={styles.coordsSubtext}>
                GPS Coordinates: Lat {activeReport.latitude.toFixed(4)}°, Lng {activeReport.longitude.toFixed(4)}°
              </Text>
            </View>


            {/* Status Timeline Progression */}
            <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
              <Text style={styles.sectionCardTitle}>{lang === 'EL' ? 'Πορεία Εξέλιξης' : 'Status Progression'}</Text>
              <View style={styles.timelineRow}>
                {TIMELINE_STAGES.map((stage, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <View key={stage.id} style={styles.timelineStep}>
                      <View
                        style={[
                          styles.timelineBubble,
                          isDone && { backgroundColor: '#2563eb' },
                          isCurrent && { borderWidth: 3, borderColor: '#60a5fa' },
                        ]}
                      >
                        {isDone ? (
                          <Ionicons name="checkmark" size={14} color="#ffffff" />
                        ) : (
                          <Text style={styles.timelineStepNum}>{idx + 1}</Text>
                        )}
                      </View>

                      {idx < TIMELINE_STAGES.length - 1 && (
                        <View style={[styles.timelineLine, idx < currentStepIdx && { backgroundColor: '#2563eb' }]} />
                      )}

                      <Text style={[styles.timelineLabel, isDark && styles.subTextDark, isCurrent && { fontWeight: '700', color: '#2563eb' }]}>
                        {stage.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Municipality Comments Section */}
            {activeReport.updates && activeReport.updates.length > 0 && (
              <View style={[styles.sectionCard, isDark && styles.sectionCardDark]}>
                <Text style={styles.sectionCardTitle}>{lang === 'EL' ? 'Σχόλια Δήμου' : 'Municipality Comments'}</Text>
                {activeReport.updates.map((upd) => (
                  <View key={upd.id} style={[styles.commentBox, isDark && styles.commentBoxDark]}>
                    <View style={styles.commentHeader}>
                      <Ionicons name="shield-checkmark" size={16} color="#2563eb" />
                      <Text style={styles.commentAuthor}>Palaio Faliro Municipal Officer</Text>
                      <Text style={styles.commentTime}>
                        {new Date(upd.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={[styles.commentBody, isDark && styles.subTextDark]}>{upd.message}</Text>
                  </View>
                ))}
              </View>
            )}

          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topBarDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  closeBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
  },
  scrollBody: {
    flex: 1,
  },
  carouselContainer: {
    width,
    height: 240,
    position: 'relative',
    backgroundColor: '#000000',
  },
  carouselImg: {
    width,
    height: 240,
  },
  noImageBanner: {
    width,
    height: 160,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageBannerDark: {
    backgroundColor: '#1e293b',
  },
  paginationBox: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 16,
  },
  contentBody: {
    padding: 16,
    gap: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  priorityLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginLeft: 'auto',
  },
  proofBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    gap: 12,
  },
  proofBoxDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  proofHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proofTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
    flex: 1,
  },
  proofGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  proofCol: {
    flex: 1,
    gap: 4,
  },
  proofLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  proofImg: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  noProofBox: {
    height: 120,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  sectionCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  sectionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  textDark: {
    color: '#ffffff',
  },
  subTextDark: {
    color: '#cbd5e1',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  coordsSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  timelineBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineStepNum: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  timelineLine: {
    position: 'absolute',
    top: 13,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#cbd5e1',
    zIndex: 1,
  },
  timelineLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
  },
  commentBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  commentBoxDark: {
    backgroundColor: '#0f172a',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
    flex: 1,
  },
  commentTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  commentBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  confirmButtonActive: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
