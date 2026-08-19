import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCivicStore } from '../lib/store';
import { loginAnonymously } from '../lib/auth-service';

const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGuest = async () => {
    await loginAnonymously();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Graphic Design */}
      <View style={styles.headerGraphic}>
        <View style={styles.logoBadge}>
          <Ionicons name="location" size={38} color="#ffffff" />
        </View>
        <Text style={styles.brandTitle}>CivicReport</Text>
        <Text style={styles.brandSubtitle}>Municipality of Palaio Faliro</Text>
        <Text style={styles.brandTagline}>
          Empowering citizens of Palaio Faliro for a cleaner, safer, and better municipality.
        </Text>
      </View>

      {/* Feature Highlights Grid */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureCard}>
          <View style={[styles.featureIconBox, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="camera-outline" size={22} color="#2563eb" />
          </View>
          <View style={styles.featureTextCol}>
            <Text style={styles.featureTitle}>Report Issues Quickly</Text>
            <Text style={styles.featureDesc}>
              Snap photos, tag location & send directly to Palaio Faliro municipality.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="map-outline" size={22} color="#d97706" />
          </View>
          <View style={styles.featureTextCol}>
            <Text style={styles.featureTitle}>Live Interactive Map</Text>
            <Text style={styles.featureDesc}>
              Track real-time status of road damage, lighting & city hazards.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={[styles.featureIconBox, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="notifications-outline" size={22} color="#059669" />
          </View>
          <View style={styles.featureTextCol}>
            <Text style={styles.featureTitle}>Status Tracking & Alerts</Text>
            <Text style={styles.featureDesc}>
              Get updates when municipal crews acknowledge and fix issues.
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.signUpBtn}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.8}
        >
          <Text style={styles.signUpBtnText}>Create Free Account</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginBtnText}>Sign In to Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestLink}
          onPress={handleGuest}
          activeOpacity={0.6}
        >
          <Text style={styles.guestLinkText}>Skip & View Interactive Map as Guest ➔</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'space-between',
  },
  headerGraphic: {
    alignItems: 'center',
    paddingTop: 36,
    paddingHorizontal: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 2,
  },
  brandTagline: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  featuresContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  bottomActions: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  signUpBtn: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginBtn: {
    backgroundColor: '#f1f5f9',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  guestLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  guestLinkText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
});
