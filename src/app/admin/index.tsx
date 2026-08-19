import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRealtimeReports } from '../../hooks/useRealtimeReports';
import { signInAdmin, fetchAdminStaff, updateReportStatusAndAssign } from '../../lib/admin-service';
import { Report, ReportStatus, PriorityLevel, REPORT_CATEGORIES, AdminUser } from '../../types';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { reports, isLive, lastUpdated, refresh } = useRealtimeReports();

  // Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [email, setEmail] = useState('admin@palaiofaliro.gr');
  const [password, setPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Staff State
  const [staffList, setStaffList] = useState<AdminUser[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Detail Modal State
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus>('submitted');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');
  const [assignedStaffId, setAssignedStaffId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const staff = await fetchAdminStaff();
    setStaffList(staff);
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setAuthError(null);

    const res = await signInAdmin(email, password);
    setLoginLoading(false);

    if (res.error && !res.adminProfile) {
      setAuthError(res.error);
    } else {
      setIsAdminLoggedIn(true);
      setAdminUser(res.adminProfile);
    }
  };

  const handleOpenReportModal = (report: Report) => {
    setSelectedReport(report);
    setNewStatus(report.status);
    setNewPriority(report.priority_level);
    setAssignedStaffId(report.assigned_to || null);
    setCommentText('');
    setModalVisible(true);
  };

  const handleSaveStatusUpdate = async () => {
    if (!selectedReport) return;
    setUpdating(true);

    const staffObj = staffList.find((s) => s.id === assignedStaffId);
    const success = await updateReportStatusAndAssign({
      reportId: selectedReport.id,
      status: newStatus,
      priority: newPriority,
      assignedTo: assignedStaffId,
      commentMessage: commentText,
      adminId: adminUser?.id,
      adminName: adminUser?.full_name || 'Municipal Officer',
    });

    setUpdating(false);

    if (success) {
      setModalVisible(false);
      refresh();
      if (Platform.OS === 'web') {
        alert('Report status & details updated successfully!');
      } else {
        Alert.alert('Success', 'Report status & details updated successfully!');
      }
    } else {
      alert('Failed to update report. Please try again.');
    }
  };

  // Filtered reports calculation
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || r.priority_level === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Analytics Stats
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'submitted').length;
  const inProgressCount = reports.filter((r) => r.status === 'in_progress' || r.status === 'acknowledged').length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const completionRate = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Render Admin Login if not authenticated
  if (!isAdminLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginCard}>
          <View style={styles.loginHeader}>
            <Ionicons name="shield-checkmark" size={48} color="#2563eb" />
            <Text style={styles.loginTitle}>Municipality Admin Portal</Text>
            <Text style={styles.loginSub}>Δήμος Παλαιού Φαλήρου - Διαχείριση Αναφορών</Text>
          </View>

          {authError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Admin Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="admin@palaiofaliro.gr"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loginLoading}>
            {loginLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Log In to Dashboard</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoLoginBtn}
            onPress={() => {
              setEmail('admin@palaiofaliro.gr');
              setPassword('admin123');
              handleLogin();
            }}
          >
            <Text style={styles.demoLoginText}>⚡ Quick Demo Login as Head Engineer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backToCitizenBtn} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="arrow-back-outline" size={18} color="#64748b" />
            <Text style={styles.backToCitizenText}>Return to Citizen Mobile App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render Admin Main Dashboard
  return (
    <View style={styles.container}>
      {/* Top Admin Header */}
      <View style={styles.navbar}>
        <View style={styles.navBrand}>
          <Ionicons name="business" size={28} color="#2563eb" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.navTitle}>Municipality of Palaio Faliro</Text>
            <Text style={styles.navSub}>Admin Command Center • {adminUser?.department}</Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <View style={[styles.liveBadge, { backgroundColor: isLive ? '#dcfce7' : '#fef3c7' }]}>
            <View style={[styles.liveDot, { backgroundColor: isLive ? '#16a34a' : '#d97706' }]} />
            <Text style={[styles.liveText, { color: isLive ? '#15803d' : '#b45309' }]}>
              {isLive ? 'Supabase Realtime Live' : 'Connecting Realtime...'}
            </Text>
          </View>

          <View style={styles.userBadge}>
            <Ionicons name="person-circle-outline" size={24} color="#1e293b" />
            <Text style={styles.userName}>{adminUser?.full_name}</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={() => setIsAdminLoggedIn(false)}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.contentScroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="document-text" size={24} color="#2563eb" />
            </View>
            <View>
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time" size={24} color="#d97706" />
            </View>
            <View>
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Submitted (Pending)</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#e0e7ff' }]}>
              <Ionicons name="construct" size={24} color="#4f46e5" />
            </View>
            <View>
              <Text style={styles.statNumber}>{inProgressCount}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="checkmark-done-circle" size={24} color="#16a34a" />
            </View>
            <View>
              <Text style={styles.statNumber}>{resolvedCount}</Text>
              <Text style={styles.statLabel}>Resolved ({completionRate}%)</Text>
            </View>
          </View>
        </View>

        {/* Filter & Search Bar */}
        <View style={styles.filterSection}>
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search-outline" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reports by keyword, address, or ID..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterGroup}>
            {/* Status Filter Buttons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {['all', 'submitted', 'acknowledged', 'in_progress', 'resolved', 'cannot_fix'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                    {st === 'all' ? 'All Statuses' : st.replace('_', ' ').toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Priority Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['all', 'high', 'medium', 'low'].map((pr) => (
                <TouchableOpacity
                  key={pr}
                  style={[
                    styles.filterChip,
                    { borderColor: pr === 'high' ? '#f87171' : pr === 'medium' ? '#fbbf24' : '#60a5fa' },
                    priorityFilter === pr && styles.filterChipActive,
                  ]}
                  onPress={() => setPriorityFilter(pr)}
                >
                  <Text style={[styles.filterChipText, priorityFilter === pr && styles.filterChipTextActive]}>
                    Priority: {pr.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Reports Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.thCell, { flex: 1.2 }]}>Category / ID</Text>
          <Text style={[styles.thCell, { flex: 2 }]}>Description & Address</Text>
          <Text style={[styles.thCell, { flex: 1 }]}>Priority</Text>
          <Text style={[styles.thCell, { flex: 1.2 }]}>Status</Text>
          <Text style={[styles.thCell, { flex: 1.2 }]}>Assigned Staff</Text>
          <Text style={[styles.thCell, { flex: 1, textAlign: 'right' }]}>Action</Text>
        </View>

        {/* Reports List Rows */}
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Municipal Reports Found</Text>
            <Text style={styles.emptySub}>No reports match your current filter or search criteria.</Text>
          </View>
        ) : (
          filteredReports.map((item) => {
            const catObj = REPORT_CATEGORIES.find((c) => c.id === item.category);
            const assignedStaff = staffList.find((s) => s.id === item.assigned_to);

            return (
              <View key={item.id} style={styles.tableRow}>
                <View style={[styles.tdCell, { flex: 1.2 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.catBadgeIcon, { backgroundColor: (catObj?.color || '#3b82f6') + '22' }]}>
                      <Ionicons name={(catObj?.iconName as any) || 'help-outline'} size={18} color={catObj?.color || '#2563eb'} />
                    </View>
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.catName}>{catObj?.labelEl || item.category}</Text>
                      <Text style={styles.reportIdText}>#{item.id.substring(0, 8)}</Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.tdCell, { flex: 2 }]}>
                  <Text style={styles.descText} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={styles.addressText} numberOfLines={1}>
                    📍 {item.address}
                  </Text>
                </View>

                <View style={[styles.tdCell, { flex: 1 }]}>
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor:
                          item.priority_level === 'high' ? '#fee2e2' : item.priority_level === 'medium' ? '#fef3c7' : '#e0f2fe',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        {
                          color:
                            item.priority_level === 'high' ? '#dc2626' : item.priority_level === 'medium' ? '#d97706' : '#0284c7',
                        },
                      ]}
                    >
                      {item.priority_level.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tdCell, { flex: 1.2 }]}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status === 'resolved'
                            ? '#dcfce7'
                            : item.status === 'in_progress'
                            ? '#e0e7ff'
                            : item.status === 'acknowledged'
                            ? '#fef3c7'
                            : '#f1f5f9',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            item.status === 'resolved'
                              ? '#16a34a'
                              : item.status === 'in_progress'
                              ? '#4338ca'
                              : item.status === 'acknowledged'
                              ? '#b45309'
                              : '#475569',
                        },
                      ]}
                    >
                      {item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tdCell, { flex: 1.2 }]}>
                  <Text style={styles.staffAssignedText} numberOfLines={1}>
                    👤 {assignedStaff ? assignedStaff.full_name : 'Unassigned'}
                  </Text>
                </View>

                <View style={[styles.tdCell, { flex: 1, alignItems: 'flex-end' }]}>
                  <TouchableOpacity style={styles.inspectBtn} onPress={() => handleOpenReportModal(item)}>
                    <Text style={styles.inspectBtnText}>Update</Text>
                    <Ionicons name="chevron-forward-outline" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Report Status & Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="clipboard-outline" size={24} color="#2563eb" />
                <Text style={styles.modalTitle}>Update Municipal Report Status</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedReport && (
              <ScrollView style={styles.modalBody}>
                {/* Photo Gallery Carousel Preview */}
                {selectedReport.photos && selectedReport.photos.length > 0 && (
                  <ScrollView horizontal style={styles.photoCarousel}>
                    {selectedReport.photos.map((pUrl, idx) => (
                      <Image key={idx} source={{ uri: pUrl }} style={styles.modalPhoto} />
                    ))}
                  </ScrollView>
                )}

                <View style={styles.modalDetailGroup}>
                  <Text style={styles.modalLabel}>Description & Address</Text>
                  <Text style={styles.modalDesc}>{selectedReport.description}</Text>
                  <Text style={styles.modalAddress}>📍 {selectedReport.address}</Text>
                  <Text style={styles.modalMeta}>
                    Submitted by: {selectedReport.is_anonymous ? 'Anonymous Citizen' : 'Registered Citizen'} • Date:{' '}
                    {new Date(selectedReport.created_at).toLocaleString('el-GR')}
                  </Text>
                </View>

                {/* Change Status Dropdown / Button Grid */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>1. Update Status</Text>
                  <View style={styles.statusGrid}>
                    {[
                      { id: 'submitted', label: 'Submitted', color: '#64748b' },
                      { id: 'acknowledged', label: 'Acknowledged', color: '#d97706' },
                      { id: 'in_progress', label: 'In Progress', color: '#4f46e5' },
                      { id: 'resolved', label: 'Resolved', color: '#16a34a' },
                      { id: 'cannot_fix', label: 'Cannot Fix', color: '#dc2626' },
                    ].map((st) => (
                      <TouchableOpacity
                        key={st.id}
                        style={[
                          styles.statusOption,
                          newStatus === st.id && { backgroundColor: st.color, borderColor: st.color },
                        ]}
                        onPress={() => setNewStatus(st.id as ReportStatus)}
                      >
                        <Text style={[styles.statusOptionText, newStatus === st.id && { color: '#ffffff' }]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Change Priority */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>2. Priority Level</Text>
                  <View style={styles.priorityGrid}>
                    {['low', 'medium', 'high'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.priorityOption, newPriority === p && styles.priorityOptionActive]}
                        onPress={() => setNewPriority(p as PriorityLevel)}
                      >
                        <Text style={[styles.priorityOptionText, newPriority === p && styles.priorityOptionTextActive]}>
                          {p.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Staff Assignment Dropdown */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>3. Assign Municipal Staff</Text>
                  <ScrollView horizontal style={{ marginVertical: 6 }}>
                    <TouchableOpacity
                      style={[styles.staffChip, !assignedStaffId && styles.staffChipActive]}
                      onPress={() => setAssignedStaffId(null)}
                    >
                      <Text style={[styles.staffChipText, !assignedStaffId && styles.staffChipTextActive]}>
                        Unassigned
                      </Text>
                    </TouchableOpacity>

                    {staffList.map((staff) => (
                      <TouchableOpacity
                        key={staff.id}
                        style={[styles.staffChip, assignedStaffId === staff.id && styles.staffChipActive]}
                        onPress={() => setAssignedStaffId(staff.id)}
                      >
                        <Text style={[styles.staffChipText, assignedStaffId === staff.id && styles.staffChipTextActive]}>
                          👤 {staff.full_name} ({staff.department})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Municipal Comment / Update Note */}
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>4. Add Official Note / Comment to Citizen</Text>
                  <TextInput
                    style={styles.commentInput}
                    multiline
                    numberOfLines={3}
                    placeholder="e.g. Municipal crew assigned. Maintenance scheduled for Tuesday..."
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                </View>

                {/* Submit Action */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStatusUpdate} disabled={updating}>
                  {updating ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                      <Text style={styles.saveBtnText}>Save & Notify Citizen</Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Login Styles
  loginContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 28,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  loginSub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#450a0a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    marginLeft: 8,
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 14,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    height: 48,
    borderRadius: 8,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 8,
  },
  demoLoginBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  demoLoginText: {
    color: '#60a5fa',
    fontWeight: '600',
    fontSize: 13,
  },
  backToCitizenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  backToCitizenText: {
    color: '#94a3b8',
    marginLeft: 6,
    fontSize: 13,
  },

  // Navbar Styles
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  navSub: {
    fontSize: 12,
    color: '#64748b',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 6,
  },
  logoutBtn: {
    padding: 6,
  },

  // Content Styles
  contentScroll: {
    padding: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIconBg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },

  // Filters
  filterSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0f172a',
  },
  filterGroup: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Table
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  thCell: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tdCell: {
    justifyContent: 'center',
  },
  catBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  reportIdText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  descText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  staffAssignedText: {
    fontSize: 12,
    color: '#475569',
  },
  inspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inspectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginLeft: 8,
  },
  modalBody: {
    marginTop: 16,
  },
  photoCarousel: {
    marginBottom: 16,
  },
  modalPhoto: {
    width: 140,
    height: 100,
    borderRadius: 8,
    marginRight: 10,
  },
  modalDetailGroup: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  modalAddress: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 4,
  },
  modalMeta: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  priorityOptionActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  priorityOptionText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  priorityOptionTextActive: {
    color: '#ffffff',
  },
  staffChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  staffChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  staffChipText: {
    fontSize: 12,
    color: '#475569',
  },
  staffChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  commentInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
});
