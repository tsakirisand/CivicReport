import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCivicStore } from '../../lib/store';
import { ReportMessage, TRANSLATIONS } from '../../types';
import { getCategoryBadge, getMarkerColor } from '../../components/map/interactive-map';
import {
  fetchReportMessages,
  sendCitizenReportMessage,
  toValidUuid,
  isReportOwnedByUser,
  fetchAllReports,
} from '../../lib/reports-service';
import { supabase } from '../../lib/supabase';

export default function FullChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { reports, user, settings } = useCivicStore();
  const isDark = settings?.darkMode || false;
  const lang = settings?.language || 'EN';

  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Find target report
  const report = useMemo(() => {
    if (!id) return null;
    return (
      reports.find((r) => r.id === id || String(toValidUuid(r.id)) === String(toValidUuid(id))) || null
    );
  }, [reports, id]);

  const targetUuid = useMemo(() => {
    return report ? (toValidUuid(report.id) || report.id) : (toValidUuid(id) || id);
  }, [report, id]);

  // Ownership verification
  const isOwner = useMemo(() => {
    if (!report || !user) return false;
    return isReportOwnedByUser(report.user_id, user);
  }, [report, user]);

  // Load and subscribe to real-time chat messages
  useEffect(() => {
    if (!targetUuid) return;

    const loadMessages = () => {
      fetchReportMessages(targetUuid).then((msgs) => {
        setMessages((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(msgs)) return prev;
          return msgs;
        });
      });
    };

    loadMessages();

    // 2.5s polling interval so chat messages appear live without requiring manual refresh
    const pollInterval = setInterval(loadMessages, 2500);

    const channel = supabase
      .channel(`mobile-full-chat-${targetUuid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_messages',
        },
        (payload) => {
          const newMsg = payload.new as ReportMessage;
          if (newMsg && String(newMsg.report_id) === String(targetUuid)) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else {
            loadMessages();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [targetUuid]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || sendingChat) return;
    const text = chatInput.trim();
    setChatInput('');
    setSendingChat(true);

    const sent = await sendCitizenReportMessage({
      reportId: targetUuid,
      senderId: user ? (user.id || user.email) : undefined,
      senderName: user?.full_name || 'Citizen',
      message: text,
    });

    setSendingChat(false);
    if (sent) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
    }
  };

  const categoryInfo = report ? getCategoryBadge(report.category, lang) : null;
  const statusColor = report ? getMarkerColor(report.priority_level, report.status, report.is_anonymous) : '#2563eb';

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Top Navigation Bar */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#0f172a'} />
        </TouchableOpacity>

        <View style={styles.avatarBox}>
          <Ionicons name="business" size={20} color="#ffffff" />
        </View>

        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, isDark && styles.textDark]} numberOfLines={1}>
            {lang === 'EL' ? 'Δήμος Παλαιού Φαλήρου' : 'Palaio Faliro Municipality'}
          </Text>
          <View style={styles.onlineStatusRow}>
            <View style={styles.greenDot} />
            <Text style={styles.onlineText}>
              {lang === 'EL' ? 'Δημοτική Υπηρεσία • LIVE' : 'Municipal Desk • LIVE'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfo(!showInfo)}>
          <Ionicons name="information-circle-outline" size={26} color={isDark ? '#94a3b8' : '#64748b'} />
        </TouchableOpacity>
      </View>

      {/* Report Quick Summary Drawer */}
      {showInfo && report && (
        <View style={[styles.infoDrawer, isDark && styles.infoDrawerDark]}>
          <View style={styles.infoDrawerRow}>
            {categoryInfo && (
              <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
                <Ionicons name={categoryInfo.iconName as any} size={14} color={categoryInfo.color} />
                <Text style={[styles.categoryBadgeText, { color: categoryInfo.color }]}>
                  {categoryInfo.label}
                </Text>
              </View>
            )}

            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {report.status.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={[styles.infoAddress, isDark && styles.subTextDark]} numberOfLines={1}>
            📍 {report.address}
          </Text>
          <Text style={[styles.infoDescription, isDark && styles.subTextDark]} numberOfLines={2}>
            {report.description}
          </Text>
        </View>
      )}

      {/* Messages List Body */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatListContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={44} color="#2563eb" />
              </View>

              <Text style={[styles.emptyTitle, isDark && styles.textDark]}>
                {lang === 'EL' ? 'Απευθείας Επικοινωνία' : 'Direct Official Communication'}
              </Text>

              <Text style={styles.emptySub}>
                {lang === 'EL'
                  ? 'Γράψτε το μήνυμά σας παρακάτω. Οι αρμόδιοι υπάλληλοι του Δήμου Παλαιού Φαλήρου θα ενημερωθούν άμεσα.'
                  : 'Type your message below. Palaio Faliro municipal officers will be notified instantly to assist with your report.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isAdmin = item.sender_type === 'admin';
            return (
              <View
                style={[
                  styles.msgRow,
                  isAdmin ? styles.msgRowLeft : styles.msgRowRight,
                ]}
              >
                {isAdmin && (
                  <View style={styles.adminAvatar}>
                    <Ionicons name="shield-checkmark" size={14} color="#ffffff" />
                  </View>
                )}

                <View style={{ maxWidth: '80%' }}>
                  <Text style={[styles.senderNameText, isAdmin ? styles.senderAdmin : styles.senderCitizen]}>
                    {isAdmin
                      ? lang === 'EL' ? 'Δήμος Παλαιού Φαλήρου' : 'Palaio Faliro Municipality'
                      : item.sender_name || (lang === 'EL' ? 'Πολίτης' : 'Citizen')}
                  </Text>

                  <View
                    style={[
                      styles.bubble,
                      isAdmin
                        ? (isDark ? styles.bubbleAdminDark : styles.bubbleAdmin)
                        : styles.bubbleCitizen,
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgText,
                        isAdmin
                          ? (isDark ? styles.msgTextAdminDark : styles.msgTextAdmin)
                          : styles.msgTextCitizen,
                      ]}
                    >
                      {item.message}
                    </Text>
                  </View>

                  <Text style={[styles.timeText, isAdmin ? styles.timeAdmin : styles.timeCitizen]}>
                    {new Date(item.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Message Input Footer */}
        <View style={[styles.inputBar, isDark && styles.inputBarDark]}>
          <TextInput
            style={[styles.textInput, isDark && styles.textInputDark]}
            placeholder={
              lang === 'EL'
                ? 'Γράψτε μήνυμα στον Δήμο...'
                : 'Type a message to Palaio Faliro Municipality...'
            }
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={chatInput}
            onChangeText={setChatInput}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!chatInput.trim() || sendingChat) && styles.sendBtnDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!chatInput.trim() || sendingChat}
          >
            {sendingChat ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  backBtn: {
    padding: 4,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  onlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  onlineText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  infoBtn: {
    padding: 4,
  },
  infoDrawer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 6,
  },
  infoDrawerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  infoDrawerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  infoAddress: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  infoDescription: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  textDark: {
    color: '#ffffff',
  },
  subTextDark: {
    color: '#cbd5e1',
  },
  chatListContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
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
  msgRow: {
    flexDirection: 'row',
    marginBottom: 4,
    gap: 8,
  },
  msgRowLeft: {
    justifyContent: 'flex-start',
  },
  msgRowRight: {
    justifyContent: 'flex-end',
  },
  adminAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  senderNameText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  senderAdmin: {
    color: '#2563eb',
  },
  senderCitizen: {
    color: '#64748b',
    textAlign: 'right',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleAdmin: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopLeftRadius: 4,
  },
  bubbleAdminDark: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderTopLeftRadius: 4,
  },
  bubbleCitizen: {
    backgroundColor: '#2563eb',
    borderTopRightRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextAdmin: {
    color: '#0f172a',
  },
  msgTextAdminDark: {
    color: '#ffffff',
  },
  msgTextCitizen: {
    color: '#ffffff',
  },
  timeText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  timeAdmin: {
    textAlign: 'left',
  },
  timeCitizen: {
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 10,
  },
  inputBarDark: {
    backgroundColor: '#1e293b',
    borderTopColor: '#334155',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: '#0f172a',
  },
  textInputDark: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#93c5fd',
  },
});
