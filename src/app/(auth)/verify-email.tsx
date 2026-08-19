import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyEmailOtp, resendVerificationEmail, checkFirebaseEmailVerificationStatus } from '../../lib/auth-service';
import { useCivicStore } from '../../lib/store';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const { user, verifyUserEmail } = useCivicStore();

  const userEmail = params.email || user?.email || 'citizen@palaiofaliro.gr';

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerified, setIsVerified] = useState(Boolean(user?.email_verified));
  const [resendTimer, setResendTimer] = useState(60);

  // Timer countdown for resending email code
  useEffect(() => {
    let interval: any = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  // Check verification status automatically on mount (e.g. when returning from email link in browser)
  useEffect(() => {
    const checkOnMount = async () => {
      const status = await checkFirebaseEmailVerificationStatus();
      if (status.isVerified) {
        setIsVerified(true);
      }
    };
    checkOnMount();
  }, []);

  // Auto-verify if oobCode is passed from Firebase deep link
  useEffect(() => {
    if (params.code) {
      autoVerifyWithToken(params.code);
    }
  }, [params.code]);

  const autoVerifyWithToken = async (incomingCode: string) => {
    setLoading(true);
    const res = await verifyEmailOtp({ email: userEmail, token: incomingCode });
    setLoading(false);

    if (res.success) {
      setIsVerified(true);
      verifyUserEmail(userEmail);
    } else {
      setErrorMessage(res.message || 'Verification link expired or invalid.');
    }
  };

  const handleCheckStatus = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);
    const status = await checkFirebaseEmailVerificationStatus();
    setLoading(false);

    if (status.isVerified) {
      setIsVerified(true);
    } else {
      setErrorMessage('Verification link not clicked yet. Please open your email and tap the verification link, then tap Check Verification Status.');
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || resending) return;
    setErrorMessage('');
    setSuccessMessage('');
    setResending(true);

    const res = await resendVerificationEmail(userEmail);
    setResending(false);

    if (res.success) {
      setSuccessMessage(`A new verification email was sent to ${userEmail}. Please check your inbox and Junk/Spam folder!`);
      setResendTimer(60);
    } else {
      setErrorMessage(res.message || 'Could not resend verification link. Please try again in a moment.');
    }
  };

  const handleOpenEmailClient = async () => {
    try {
      await Linking.openURL('mailto:');
    } catch (err) {
      setErrorMessage('Could not open email application directly.');
    }
  };

  const handleDemoAutoVerify = async () => {
    setLoading(true);
    setTimeout(() => {
      verifyUserEmail(userEmail);
      setIsVerified(true);
      setLoading(false);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          {!isVerified ? (
            <>
              <View style={styles.headerBox}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail-unread-outline" size={36} color="#2563eb" />
                </View>
                <Text style={styles.title}>Verify Your Email ✉️</Text>
                <Text style={styles.subtitle}>
                  We've sent a verification link to{' '}
                  <Text style={styles.emailHighlight}>{userEmail}</Text>. Open your email inbox and tap the link to activate your account.
                </Text>
              </View>

              {/* Junk / Spam Notice Banner */}
              <View style={styles.spamNoticeBanner}>
                <Ionicons name="warning" size={20} color="#d97706" />
                <View style={styles.spamNoticeTextCol}>
                  <Text style={styles.spamNoticeTitle}>Check Your Junk / Spam Folder!</Text>
                  <Text style={styles.spamNoticeDesc}>
                    If you don't see the email in your main Inbox within 1-2 minutes, please check your <Text style={styles.boldText}>Junk</Text>, <Text style={styles.boldText}>Spam</Text>, or <Text style={styles.boldText}>Promotions</Text> folder.
                  </Text>
                </View>
              </View>

              {/* Error/Success Banners */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {successMessage ? (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                  <Text style={styles.successBannerText}>{successMessage}</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.actionsCard}>
                {/* Primary Button: Open Email App */}
                <TouchableOpacity
                  style={styles.openMailPrimaryBtn}
                  onPress={handleOpenEmailClient}
                  activeOpacity={0.8}
                >
                  <Ionicons name="mail-open-outline" size={22} color="#ffffff" />
                  <Text style={styles.openMailPrimaryBtnText}>Open Email App</Text>
                </TouchableOpacity>

                {/* Check Status Button */}
                <TouchableOpacity
                  style={styles.checkStatusBtn}
                  onPress={handleCheckStatus}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#2563eb" />
                  ) : (
                    <>
                      <Ionicons name="refresh-circle-outline" size={20} color="#2563eb" />
                      <Text style={styles.checkStatusBtnText}>I've Tapped Link — Check Status</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Resend Section */}
              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleResendCode}
                  disabled={resendTimer > 0 || resending}
                >
                  {resending ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Text style={[styles.resendBtnText, resendTimer > 0 && styles.resendBtnDisabled]}>
                      {resendTimer > 0
                        ? `Resend Email in ${resendTimer}s`
                        : 'Didn\'t receive email? Resend Verification Email'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Quick Demo Verification Helper */}
                <View style={styles.demoBox}>
                  <Text style={styles.demoBoxText}>Testing / Demo Mode:</Text>
                  <TouchableOpacity style={styles.demoChipBtn} onPress={handleDemoAutoVerify}>
                    <Ionicons name="flash-outline" size={14} color="#2563eb" />
                    <Text style={styles.demoChipBtnText}>Instant Demo Verify</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            /* Celebration / Verified Success State */
            <View style={styles.verifiedBox}>
              <View style={styles.verifiedIconCircle}>
                <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              </View>
              <Text style={styles.verifiedTitle}>Email Verified! 🎉</Text>
              <Text style={styles.verifiedSubtitle}>
                Your email address <Text style={styles.emailHighlight}>{userEmail}</Text> has been successfully verified via Firebase Auth. You now have full citizen access on CivicReport!
              </Text>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.continueBtnText}>Continue to App</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    marginTop: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBox: {
    marginTop: 20,
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#0f172a',
  },
  spamNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
    gap: 12,
  },
  spamNoticeTextCol: {
    flex: 1,
  },
  spamNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b45309',
    marginBottom: 4,
  },
  spamNoticeDesc: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  successBannerText: {
    color: '#047857',
    fontSize: 13,
    flex: 1,
  },
  actionsCard: {
    gap: 12,
  },
  openMailPrimaryBtn: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  openMailPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  checkStatusBtnText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActions: {
    marginTop: 28,
    alignItems: 'center',
    gap: 16,
  },
  resendBtn: {
    paddingVertical: 6,
  },
  resendBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  resendBtnDisabled: {
    color: '#94a3b8',
  },
  demoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  demoBoxText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  demoChipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  demoChipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  verifiedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  verifiedIconCircle: {
    marginBottom: 16,
  },
  verifiedTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  verifiedSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  continueBtn: {
    backgroundColor: '#10b981',
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
