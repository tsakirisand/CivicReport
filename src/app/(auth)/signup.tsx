import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ATHENS_MUNICIPALITIES } from '../../types';
import { signUpUser } from '../../lib/auth-service';
import { useCivicStore } from '../../lib/store';

export default function SignUpScreen() {
  const router = useRouter();
  const { setUser } = useCivicStore();

  // 4 Onboarding Tabs/Steps
  // Step 1: Email / Passcode or Google
  // Step 2: Age
  // Step 3: Area (Palaio Faliro)
  // Step 4: Occupation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [age, setAge] = useState('28');
  const [area, setArea] = useState<string>(ATHENS_MUNICIPALITIES[0]);
  const [occupation, setOccupation] = useState('Resident');
  const [termsAccepted, setTermsAccepted] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1 Validation -> Next to Step 2 (Age)
  const handleNextFromStep1 = () => {
    setErrorMessage('');
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    setStep(2);
  };

  // Step 2 Validation -> Next to Step 3 (Area)
  const handleNextFromStep2 = () => {
    setErrorMessage('');
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 18) {
      setErrorMessage('You must be at least 18 years old.');
      return;
    }
    setStep(3);
  };

  // Step 3 Validation -> Next to Step 4 (Occupation)
  const handleNextFromStep3 = () => {
    setErrorMessage('');
    if (!area) {
      setErrorMessage('Please select your area in Palaio Faliro.');
      return;
    }
    setStep(4);
  };

  // Step 4 Final Submission
  const handleFinalSubmit = async () => {
    setErrorMessage('');
    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms of Service to complete registration.');
      return;
    }

    setLoading(true);
    const res = await signUpUser({
      email,
      password,
      full_name: fullName,
      age: parseInt(age, 10) || 28,
      municipality: area,
      occupation: occupation.trim() || 'Resident',
    });
    setLoading(false);

    if (res.success) {
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(email)}`);
    } else {
      setErrorMessage(res.message || 'Could not create account. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: `usr-google-${Date.now()}`,
        email: email || 'citizen.google@faliro.gr',
        full_name: fullName || 'Google Citizen',
        municipality: area || 'Palaio Faliro Central (Παλαιό Φάληρο Κέντρο)',
        age: parseInt(age, 10) || 28,
        occupation: occupation || 'Google Citizen',
        created_at: new Date().toISOString(),
      });
      setLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.headerBox}>
            <Text style={styles.title}>Create Account 🏛️</Text>
            <Text style={styles.subtitle}>Municipality of Palaio Faliro Citizen Registration</Text>
          </View>



          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* STEP 1: EMAIL / PASSCODE OR GOOGLE */}
          {step === 1 && (
            <View style={styles.formCard}>
              <Text style={styles.stepHeading}>Step 1: Account Credentials</Text>
              <Text style={styles.stepDesc}>Register with your Email & Password or Google account.</Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Maria Alexiou"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
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

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password (min 8 chars) *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter passcode"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
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

              {/* Next Button */}
              <TouchableOpacity style={styles.nextBtn} onPress={handleNextFromStep1}>
                <Text style={styles.nextBtnText}>Next: Enter Age</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: AGE */}
          {step === 2 && (
            <View style={styles.formCard}>
              <Text style={styles.stepHeading}>Step 2: Enter Age</Text>
              <Text style={styles.stepDesc}>You must be 18 or older to register as a citizen.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Age *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="28"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    value={age}
                    onChangeText={setAge}
                  />
                </View>
              </View>

              {/* Quick Age Choice Chips */}
              <Text style={styles.label}>Or Select Age Bracket:</Text>
              <View style={styles.chipsGrid}>
                {['18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map((bracket) => (
                  <TouchableOpacity
                    key={bracket}
                    style={[
                      styles.chipBtn,
                      age === bracket.split('-')[0] && styles.chipBtnActive,
                    ]}
                    onPress={() => setAge(bracket.split('-')[0])}
                  >
                    <Text
                      style={[
                        styles.chipBtnText,
                        age === bracket.split('-')[0] && styles.chipBtnTextActive,
                      ]}
                    >
                      {bracket} yrs
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Step 2 Buttons */}
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(1)}>
                  <Text style={styles.backStepBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextStepBtnFlex} onPress={handleNextFromStep2}>
                  <Text style={styles.nextBtnText}>Next: Select Area</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3: AREA */}
          {step === 3 && (
            <View style={styles.formCard}>
              <Text style={styles.stepHeading}>Step 3: Select Palaio Faliro Area</Text>
              <Text style={styles.stepDesc}>Choose your primary neighborhood in Palaio Faliro.</Text>

              <View style={styles.areaList}>
                {ATHENS_MUNICIPALITIES.map((item) => {
                  const isSelected = area === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.areaCardBtn, isSelected && styles.areaCardBtnActive]}
                      onPress={() => setArea(item)}
                    >
                      <Ionicons
                        name="location-sharp"
                        size={20}
                        color={isSelected ? '#2563eb' : '#64748b'}
                      />
                      <Text style={[styles.areaCardText, isSelected && styles.areaCardTextActive]}>
                        {item}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#2563eb" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Step 3 Buttons */}
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(2)}>
                  <Text style={styles.backStepBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextStepBtnFlex} onPress={handleNextFromStep3}>
                  <Text style={styles.nextBtnText}>Next: Occupation</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 4: OCCUPATION */}
          {step === 4 && (
            <View style={styles.formCard}>
              <Text style={styles.stepHeading}>Step 4: Select Occupation</Text>
              <Text style={styles.stepDesc}>Tell us about your background in the municipality.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Occupation / Role</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="briefcase-outline" size={20} color="#64748b" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Engineer, Student, Businessman"
                    placeholderTextColor="#94a3b8"
                    value={occupation}
                    onChangeText={setOccupation}
                  />
                </View>
              </View>

              {/* Quick Occupation Chips */}
              <Text style={styles.label}>Or Select Common Role:</Text>
              <View style={styles.chipsGrid}>
                {[
                  'Resident',
                  'Student',
                  'Engineer / IT',
                  'Public Servant',
                  'Entrepreneur',
                  'Retired',
                ].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.chipBtn,
                      occupation === role && styles.chipBtnActive,
                    ]}
                    onPress={() => setOccupation(role)}
                  >
                    <Text
                      style={[
                        styles.chipBtnText,
                        occupation === role && styles.chipBtnTextActive,
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                  {termsAccepted && <Ionicons name="checkmark" size={12} color="#ffffff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  I agree to the Terms of Service & Privacy Policy of Palaio Faliro CivicReport.
                </Text>
              </TouchableOpacity>

              {/* Final Submit Button */}
              <View style={styles.navRow}>
                <TouchableOpacity style={styles.backStepBtn} onPress={() => setStep(3)}>
                  <Text style={styles.backStepBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nextStepBtnFlex, { backgroundColor: '#10b981' }]}
                  onPress={handleFinalSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.nextBtnText}>Complete Sign Up 🎉</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Footer Link */}
          <View style={styles.footerLinkRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginLinkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
    marginTop: 18,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  stepTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  stepTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  stepTabBtnActive: {
    backgroundColor: '#2563eb',
  },
  stepTabBtnDone: {
    backgroundColor: '#dbeafe',
  },
  stepTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  stepTabTextActive: {
    color: '#ffffff',
  },
  stepTabTextDone: {
    color: '#1d4ed8',
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
  formCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 14,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  stepDesc: {
    fontSize: 13,
    color: '#64748b',
    marginTop: -8,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
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
    height: 50,
    backgroundColor: '#ffffff',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  dividerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '700',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  nextBtn: {
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipBtnText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  chipBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  areaList: {
    gap: 8,
  },
  areaCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  areaCardBtnActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  areaCardText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  areaCardTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  backStepBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backStepBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  nextStepBtnFlex: {
    flex: 1,
    backgroundColor: '#2563eb',
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  footerLinkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748b',
    fontSize: 14,
  },
  loginLinkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },
});
