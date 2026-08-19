import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useCivicStore } from '../../lib/store';
import { ATHENS_MUNICIPALITIES, TRANSLATIONS } from '../../types';
import { deleteCurrentUserAccount } from '../../lib/auth-service';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isGuest, logout, updateProfile, settings, updateSettings, reports, deleteUserAccount } = useCivicStore();
  const t = TRANSLATIONS[settings.language || 'EN'];
  const lang = settings.language || 'EN';

  // Edit profile modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || '');
  const [editMunicipality, setEditMunicipality] = useState(user?.municipality || ATHENS_MUNICIPALITIES[0]);
  const [editOccupation, setEditOccupation] = useState(user?.occupation || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  // Statistics calculation
  const userReports = reports.filter((r) => r.user_id === user?.id);
  const totalReportsCount = userReports.length;
  const activeCount = userReports.filter((r) => r.status !== 'resolved').length;
  const resolvedCount = userReports.filter((r) => r.status === 'resolved').length;

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Full name cannot be empty.');
      return;
    }
    updateProfile({
      full_name: editName,
      municipality: editMunicipality,
      occupation: editOccupation,
      phone: editPhone,
    });
    setEditModalVisible(false);
    Alert.alert('Success', 'Your profile details have been saved.');
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of CivicReport?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account from Firebase Auth and remove your profile. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            await deleteCurrentUserAccount();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (isGuest || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.guestBox}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="person-circle-outline" size={64} color="#94a3b8" />
          </View>
          <Text style={styles.guestTitle}>{t.loginRequired}</Text>
          <Text style={styles.guestSub}>
            Sign in or create an account to view your citizen profile, submit reports, and manage app settings.
          </Text>

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInBtnText}>{t.signIn}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.createBtnText}>{t.createAccount}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, settings.darkMode && styles.containerDark]}>
      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Profile Banner */}
        <View style={[styles.profileHeader, settings.darkMode && styles.profileHeaderDark]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {user.full_name ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'CR'}
            </Text>
          </View>
          <Text style={[styles.userName, settings.darkMode && styles.textDark]}>{user.full_name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>

          {/* Email Verification Status */}
          {user.email_verified ? (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.verifiedBadgeText}>Verified Citizen ✓</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.unverifiedBadge}
              onPress={() => router.push(`/(auth)/verify-email?email=${encodeURIComponent(user.email)}`)}
            >
              <Ionicons name="warning-outline" size={14} color="#d97706" />
              <Text style={styles.unverifiedBadgeText}>Unverified Email - Verify Now</Text>
              <Ionicons name="chevron-forward" size={12} color="#d97706" />
            </TouchableOpacity>
          )}

          <View style={styles.districtBadge}>
            <Ionicons name="business-outline" size={14} color="#2563eb" />
            <Text style={styles.districtBadgeText}>{user.municipality}</Text>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => {
              setEditName(user.full_name);
              setEditMunicipality(user.municipality);
              setEditOccupation(user.occupation || '');
              setEditPhone(user.phone || '');
              setEditModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={16} color="#ffffff" />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* User Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, settings.darkMode && styles.statCardDark]}>
            <Text style={[styles.statNumber, settings.darkMode && styles.textDark]}>{totalReportsCount}</Text>
            <Text style={styles.statLabel}>{lang === 'EL' ? 'Αναφορές' : 'Submitted'}</Text>
          </View>
          <View style={[styles.statCard, settings.darkMode && styles.statCardDark]}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>{lang === 'EL' ? 'Σε Εξέλιξη' : 'Active'}</Text>
          </View>
          <View style={[styles.statCard, settings.darkMode && styles.statCardDark]}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{resolvedCount}</Text>
            <Text style={styles.statLabel}>{lang === 'EL' ? 'Επιλύθηκαν' : 'Resolved'}</Text>
          </View>
        </View>

        {/* Citizen Info Card */}
        <View style={[styles.sectionCard, settings.darkMode && styles.sectionCardDark]}>
          <Text style={styles.sectionTitle}>Citizen Details</Text>

          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={18} color="#64748b" />
            <Text style={styles.infoLabel}>Occupation:</Text>
            <Text style={[styles.infoVal, settings.darkMode && styles.textDark]}>{user.occupation || 'Resident'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#64748b" />
            <Text style={styles.infoLabel}>Age Group:</Text>
            <Text style={[styles.infoVal, settings.darkMode && styles.textDark]}>{user.age ? `${user.age} years` : '18+'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={18} color="#64748b" />
            <Text style={styles.infoLabel}>Phone Number:</Text>
            <Text style={[styles.infoVal, settings.darkMode && styles.textDark]}>{user.phone || 'Not provided'}</Text>
          </View>
        </View>

        {/* Real Settings & Preferences */}
        <View style={[styles.sectionCard, settings.darkMode && styles.sectionCardDark]}>
          <Text style={styles.sectionTitle}>{t.settings}</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Ionicons name="notifications-outline" size={20} color="#2563eb" />
              <Text style={[styles.switchLabel, settings.darkMode && styles.textDark]}>{t.notifications}</Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={(val) => updateSettings({ pushNotifications: val })}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Ionicons name="mail-outline" size={20} color="#2563eb" />
              <Text style={[styles.switchLabel, settings.darkMode && styles.textDark]}>{t.emailAlerts}</Text>
            </View>
            <Switch
              value={settings.emailAlerts}
              onValueChange={(val) => updateSettings({ emailAlerts: val })}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Ionicons name="moon-outline" size={20} color="#2563eb" />
              <Text style={[styles.switchLabel, settings.darkMode && styles.textDark]}>{t.darkMode}</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(val) => updateSettings({ darkMode: val })}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchLeft}>
              <Ionicons name="language-outline" size={20} color="#2563eb" />
              <Text style={[styles.switchLabel, settings.darkMode && styles.textDark]}>{t.language}</Text>
            </View>
            <TouchableOpacity
              style={styles.langBadge}
              onPress={() => updateSettings({ language: settings.language === 'EN' ? 'EL' : 'EN' })}
            >
              <Text style={styles.langBadgeText}>
                {settings.language === 'EN' ? 'English (EN)' : 'Ελληνικά (EL)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsBox}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" />
            <Text style={styles.logoutBtnText}>{t.logOut}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteAccBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteAccBtnText}>{t.deleteAccount}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.editCard}>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={editName}
                  onChangeText={setEditName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Occupation</Text>
                <TextInput
                  style={styles.input}
                  value={editOccupation}
                  onChangeText={setEditOccupation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={editPhone}
                  onChangeText={setEditPhone}
                />
              </View>
            </ScrollView>

            <View style={styles.editFooter}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollBody: {
    flex: 1,
  },
  textDark: {
    color: '#ffffff',
  },
  guestBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  guestIconCircle: {
    marginBottom: 12,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  guestSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
    marginBottom: 24,
  },
  signInBtn: {
    backgroundColor: '#2563eb',
    width: '100%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: '#f1f5f9',
    width: '100%',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  profileHeader: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profileHeaderDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
    marginTop: 8,
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 4,
    marginTop: 8,
  },
  unverifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d97706',
  },
  districtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginTop: 8,
  },
  districtBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginTop: 14,
  },
  editProfileBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  sectionCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginLeft: 'auto',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  langBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  langBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  actionsBox: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '700',
  },
  deleteAccBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteAccBtnText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  editCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  editTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  editBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0f172a',
  },
  editFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  saveBtn: {
    backgroundColor: '#2563eb',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
