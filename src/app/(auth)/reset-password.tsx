import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
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
import { resetUserPassword, confirmPasswordReset } from '../../lib/auth-service';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string; token?: string }>();

  // Flow Step: 1 = Request Email, 2 = Set New Password (opened via link), 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [email, setEmail] = useState(params.email || '');
  const [code, setCode] = useState(params.code || params.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(60);

  // Deep Link auto-advancement to Step 2 if code/token is provided from email link
  useEffect(() => {
    if (params.code || params.token) {
      setCode(params.code || params.token || '');
      if (params.email) {
        setEmail(params.email);
      }
      setStep(2);
    }
  }, [params.code, params.token, params.email]);

  // Resend Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  // Step 1: Request Reset Link via Firebase
  const handleRequestReset = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    const res = await resetUserPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setSuccessMessage(`Password reset link sent to ${email.trim()}. Open your email inbox (and check Junk/Spam) and tap the link!`);
      setResendTimer(60);
    } else {
      setErrorMessage(res.message || 'Could not send reset link. Please check your email address.');
    }
  };

  // Step 2: Confirm Link Token & Save New Password
  const handleSaveNewPassword = async () => {
    setErrorMessage('');
    if (!code.trim()) {
      setErrorMessage('Reset link token not found. Please tap the reset link sent to your email.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);
    const res = await confirmPasswordReset({
      email: email.trim(),
      token: code.trim(),
      newPassword,
    });
    setLoading(false);

    if (res.success) {
      setStep(3);
    } else {
      setErrorMessage(res.message || 'Failed to update password. Please check your reset link or request a new one.');
    }
  };

  const handleOpenEmailClient = async () => {
    try {
      await Linking.openURL('mailto:');
    } catch (err) {
      setErrorMessage('Could not open email application directly.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => (step === 2 ? setStep(1) : router.back())}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          {/* STEP 1: REQUEST RESET LINK */}
          {step === 1 && (
            <>
              <View style={styles.headerBox}>
                <View style={styles.iconCircle}>
                  <Ionicons name="key-outline" size={34} color="#2563eb" />
                </View>
                <Text style={styles.title}>Reset Password 🔐</Text>
                <Text style={styles.subtitle}>
                  Enter your registered email address below and we'll send a password reset link to your inbox.
                </Text>
              </View>

              {/* Junk / Spam Notice */}
              <View style={styles.spamNoticeBanner}>
                <Ionicons name="warning" size={20} color="#d97706" />
                <View style={styles.spamNoticeTextCol}>
                  <Text style={styles.spamNoticeTitle}>Check Your Junk / Spam Folder!</Text>
                  <Text style={styles.spamNoticeDesc}>
                    If the reset email doesn't appear in your main Inbox within 1-2 minutes, please check your <Text style={styles.boldText}>Junk</Text> or <Text style={styles.boldText}>Spam</Text> folder.
                  </Text>
                </View>
              </View>

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

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#64748b" />
                    <TextInput
                      style={styles.input}
                      placeholder="name@example.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleRequestReset}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Send Reset Link</Text>
                      <Ionicons name="paper-plane-outline" size={18} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>

                {successMessage ? (
                  <TouchableOpacity
                    style={styles.openMailBtn}
                    onPress={handleOpenEmailClient}
                  >
                    <Ionicons name="mail-open-outline" size={18} color="#2563eb" />
                    <Text style={styles.openMailBtnText}>Open Email App</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </>
          )}

          {/* STEP 2: OPENED VIA EMAIL LINK — SET NEW PASSWORD */}
          {step === 2 && (
            <>
              <View style={styles.headerBox}>
                <View style={styles.iconCircle}>
                  <Ionicons name="shield-checkmark-outline" size={34} color="#2563eb" />
                </View>
                <Text style={styles.title}>Set New Password 🔐</Text>
                <Text style={styles.subtitle}>
                  Reset link verified! Please enter your new password below for account <Text style={styles.emailHighlight}>{email || 'your account'}</Text>.
                </Text>
              </View>

              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password (min 6 chars) *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter new password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm New Password *</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                    <TextInput
                      style={styles.input}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSaveNewPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>Update Password</Text>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {step === 3 && (
            <View style={styles.successBox}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              </View>
              <Text style={styles.successTitle}>Password Reset! 🎉</Text>
              <Text style={styles.successSubtitle}>
                Your password has been successfully updated on Firebase Authentication. You can now sign in with your new password!
              </Text>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.loginBtnText}>Return to Sign In</Text>
                <Ionicons name="log-in-outline" size={20} color="#ffffff" />
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
    marginBottom: 20,
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
    marginBottom: 20,
    gap: 8,
  },
  successBannerText: {
    color: '#047857',
    fontSize: 13,
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  openMailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    height: 48,
    borderRadius: 12,
    gap: 8,
    marginTop: 4,
  },
  openMailBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  successBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  successIconCircle: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  loginBtn: {
    backgroundColor: '#2563eb',
    width: '100%',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
