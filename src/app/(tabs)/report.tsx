import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import {
  REPORT_CATEGORIES,
  ReportCategory,
  PriorityLevel,
  ATHENS_MUNICIPALITIES,
  TRANSLATIONS,
} from '../../types';
import { submitNewReport } from '../../lib/reports-service';
import { useCivicStore } from '../../lib/store';

export default function CreateReportScreen() {
  const router = useRouter();
  const { user, isGuest, setSelectedReport, settings } = useCivicStore();
  const isDark = settings?.darkMode || false;
  const lang = settings?.language || 'EN';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [category, setCategory] = useState<ReportCategory>('broken_light');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Location State (Palaio Faliro Default)
  const [latitude, setLatitude] = useState(37.9254);
  const [longitude, setLongitude] = useState(23.6961);
  const [address, setAddress] = useState('Poseidonos Ave 24, Flisvos, Palaio Faliro');
  const [locating, setLocating] = useState(false);

  // Photos State
  const [photos, setPhotos] = useState<string[]>([]);

  // Submit & Success State
  const [submitting, setSubmitting] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);

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
            Guest users can view reported municipal issues on the Interactive Map. To submit a new civic report, please sign in or create an account.
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

  const isLocationInPalaioFaliro = (lat: number, lng: number, addrStr: string) => {
    // Latitude/Longitude Bounding Box for Palaio Faliro Municipality
    const isWithinGeoBox = lat >= 37.9000 && lat <= 37.9500 && lng >= 23.6600 && lng <= 23.7250;

    // Keyword matching for Palaio Faliro neighborhoods
    const lower = addrStr.toLowerCase();
    const hasKeyword =
      lower.includes('palaio faliro') ||
      lower.includes('παλαιό φάληρο') ||
      lower.includes('φάληρο') ||
      lower.includes('faliro') ||
      lower.includes('flisvos') ||
      lower.includes('φλοίσβος') ||
      lower.includes('batis') ||
      lower.includes('μπάτης') ||
      lower.includes('eden') ||
      lower.includes('εδέμ') ||
      lower.includes('amfithea') ||
      lower.includes('αμφιθέα') ||
      lower.includes('panagitsa') ||
      lower.includes('παναγίτσα') ||
      lower.includes('copais') ||
      lower.includes('κοπαΐς');

    return isWithinGeoBox || hasKeyword;
  };

  // Handlers
  const handleAutoDetectLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          lang === 'EL' ? 'Δικαιώματα Τοποθεσίας' : 'Permission Denied',
          lang === 'EL' ? 'Απαιτείται πρόσβαση στην τοποθεσία.' : 'Location permission is required.'
        );
        setLocating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const fetchedLat = loc.coords.latitude;
      const fetchedLng = loc.coords.longitude;

      const geocode = await Location.reverseGeocodeAsync({
        latitude: fetchedLat,
        longitude: fetchedLng,
      });

      let detectedAddr = '';
      if (geocode && geocode[0]) {
        const place = geocode[0];
        const street = place.street || place.name || place.district || 'Palaio Faliro';
        const num = place.streetNumber ? ` ${place.streetNumber}` : '';
        const city = place.subregion || place.city || 'Palaio Faliro';
        detectedAddr = `${street}${num}, ${city}`;
      } else {
        detectedAddr = `Palaio Faliro (${fetchedLat.toFixed(4)}, ${fetchedLng.toFixed(4)})`;
      }

      // Geofencing Check
      if (!isLocationInPalaioFaliro(fetchedLat, fetchedLng, detectedAddr)) {
        Alert.alert(
          lang === 'EL' ? 'Τοποθεσία Εκτός Παλαιού Φαλήρου' : 'Location Outside Palaio Faliro',
          lang === 'EL'
            ? 'Η ζωντανή τοποθεσία σας βρίσκεται εκτός Παλαιού Φαλήρου. Η εφαρμογή λειτουργεί αποκλειστικά στον Δήμο Παλαιού Φαλήρου.'
            : 'Your live GPS location is outside Palaio Faliro. PolisCheck is strictly restricted to the Municipality of Palaio Faliro.'
        );
        // Default to Palaio Faliro center
        setLatitude(37.9254);
        setLongitude(23.6961);
        setAddress('Palaio Faliro Center');
      } else {
        setLatitude(fetchedLat);
        setLongitude(fetchedLng);
        setAddress(detectedAddr);
      }
    } catch (err: any) {
      console.log('Location error', err);
      Alert.alert(
        lang === 'EL' ? 'Σφάλμα GPS' : 'GPS Error',
        lang === 'EL' ? 'Δεν ήταν δυνατή η λήψη της ζωντανής τοποθεσίας.' : 'Could not fetch live GPS coordinates.'
      );
    }
    setLocating(false);
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        lang === 'EL' ? 'Δικαιώματα Κάμερας' : 'Permission Required',
        lang === 'EL' ? 'Απαιτείται πρόσβαση στην κάμερα.' : 'Camera permission is required.'
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const photoUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setPhotos([...photos, photoUrl]);
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        lang === 'EL' ? 'Δικαιώματα Συλλογής' : 'Permission Required',
        lang === 'EL' ? 'Απαιτείται πρόσβαση στη συλλογή.' : 'Photo library permission is required.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const photoUrl = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
      setPhotos([...photos, photoUrl]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleNextFromStep1 = () => {
    if (!description.trim()) {
      Alert.alert(
        lang === 'EL' ? 'Απαιτείται Περιγραφή' : 'Description Required',
        lang === 'EL' ? 'Παρακαλούμε δώστε μια σύντομη περιγραφή του προβλήματος.' : 'Please provide a brief description of the issue.'
      );
      return;
    }
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!address.trim()) {
      Alert.alert(
        lang === 'EL' ? 'Απαιτείται Διεύθυνση' : 'Address Required',
        lang === 'EL' ? 'Παρακαλούμε ορίστε την τοποθεσία.' : 'Please specify the street location.'
      );
      return;
    }
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    if (photos.length === 0) {
      Alert.alert(
        lang === 'EL' ? 'Απαιτείται Φωτογραφία' : 'Photo Required',
        lang === 'EL' ? 'Απαιτείται τουλάχιστον 1 φωτογραφία.' : 'At least 1 photo is required.'
      );
      return;
    }
    setStep(4);
  };

  const handleSubmitReport = async () => {
    if (!user) {
      Alert.alert(t.loginRequired, t.loginPrompt, [
        { text: t.cancel, style: 'cancel' },
        { text: t.signIn, onPress: () => router.push('/(auth)/login') },
        { text: t.signUp, onPress: () => router.push('/(auth)/signup') },
      ]);
      return;
    }

    if (!isLocationInPalaioFaliro(latitude, longitude, address)) {
      Alert.alert(
        lang === 'EL' ? 'Περιορισμός Τοποθεσίας Παλαιού Φαλήρου' : 'Palaio Faliro Location Restricted',
        lang === 'EL'
          ? 'Δεν είναι δυνατή η δημιουργία αναφοράς εκτός Παλαιού Φαλήρου.'
          : 'You cannot create a report outside Palaio Faliro.'
      );
      setStep(2);
      return;
    }

    setSubmitting(true);
    const newReport = await submitNewReport({
      category,
      description,
      latitude,
      longitude,
      address,
      priority_level: priority,
      is_anonymous: isAnonymous,
      photos,
    });
    setSubmitting(false);

    setSubmittedReportId(newReport.id);
    setSelectedReport(newReport);
    setStep(5);
  };

  const handleResetForm = () => {
    setCategory('broken_light');
    setDescription('');
    setPriority('medium');
    setIsAnonymous(false);
    setPhotos([]);
    setStep(1);
  };

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <Text style={[styles.headerTitle, isDark && styles.textDark]}>
          {step === 5 ? t.reportCreatedTitle : t.createReport}
        </Text>
        {step < 5 && (
          <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.cancelLinkText}>{t.cancel}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stepper Progress Bar */}
      {step < 5 && (
        <View style={[styles.stepperContainer, isDark && styles.stepperContainerDark]}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepBubble,
                  isDark && styles.stepBubbleDark,
                  s <= step && styles.stepBubbleActive,
                  s === step && styles.stepBubbleCurrent,
                ]}
              >
                <Text style={[styles.stepNumber, s <= step && styles.stepNumberActive]}>
                  {s}
                </Text>
              </View>
              {s < 4 && (
                <View
                  style={[
                    styles.stepLine,
                    isDark && styles.stepLineDark,
                    s < step && styles.stepLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      )}

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* STEP 1: PROBLEM DETAILS */}
        {step === 1 && (
          <View style={styles.stepForm}>
            <Text style={[styles.stepHeading, isDark && styles.textDark]}>{t.step1Title}</Text>
            <Text style={[styles.stepSubheading, isDark && styles.subTextDark]}>
              {lang === 'EL' ? 'Επιλέξτε κατηγορία και περιγράψτε το δημοτικό πρόβλημα.' : 'Select category and describe the municipal issue.'}
            </Text>

            {/* Category Selector */}
            <Text style={[styles.label, isDark && styles.textDark]}>{t.selectCategory} *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
              {REPORT_CATEGORIES.map((cat) => {
                const selected = category === cat.id;
                const catLabel = lang === 'EL' ? cat.labelEl : cat.label;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catCard,
                      isDark && styles.catCardDark,
                      selected && { borderColor: cat.color, backgroundColor: cat.color + '25' },
                    ]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.catIconBox, { backgroundColor: cat.color }]}>
                      <Ionicons name={cat.iconName as any} size={20} color="#ffffff" />
                    </View>
                    <Text style={[styles.catLabel, isDark && styles.subTextDark, selected && { color: cat.color, fontWeight: '700' }]}>
                      {catLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Description */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, isDark && styles.textDark]}>
                  {lang === 'EL' ? 'Λεπτομερής Περιγραφή *' : 'Detailed Description *'}
                </Text>
                <Text style={[styles.charCount, isDark && styles.subTextDark]}>{description.length}/500</Text>
              </View>
              <TextInput
                style={[styles.textArea, isDark && styles.textAreaDark]}
                placeholder={
                  lang === 'EL'
                    ? 'Περιγράψτε το πρόβλημα με σαφήνεια (π.χ. χαλασμένος λαμπτήρας, επικίνδυνα καλώδια...)'
                    : 'Describe the issue clearly (e.g. broken light, dangerous pothole...)'
                }
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                multiline
                numberOfLines={4}
                maxLength={500}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Priority Selector */}
            <Text style={[styles.label, isDark && styles.textDark]}>{t.priority}</Text>
            <View style={styles.priorityRow}>
              {(['low', 'medium', 'high'] as PriorityLevel[]).map((p) => {
                const active = priority === p;
                const priorityText = p === 'high' ? t.priorityHigh : p === 'medium' ? t.priorityMedium : t.priorityLow;

                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityOption,
                      isDark && styles.priorityOptionDark,
                      active && p === 'high' && { backgroundColor: '#ef4444', borderColor: '#ef4444' },
                      active && p === 'medium' && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
                      active && p === 'low' && { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityOptionText, isDark && styles.subTextDark, active && { color: '#ffffff', fontWeight: '800' }]}>
                      {priorityText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Anonymity Toggle */}
            <TouchableOpacity
              style={[styles.anonToggleRow, isDark && styles.cardDark]}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                {isAnonymous && <Ionicons name="checkmark" size={12} color="#ffffff" />}
              </View>
              <View style={styles.anonTextCol}>
                <Text style={[styles.anonTitle, isDark && styles.textDark]}>{t.anonymous}</Text>
                <Text style={[styles.anonDesc, isDark && styles.subTextDark]}>{t.anonymousDesc}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.nextBtn} onPress={handleNextFromStep1}>
              <Text style={styles.nextBtnText}>{t.continue}</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: LOCATION */}
        {step === 2 && (
          <View style={styles.stepForm}>
            <Text style={[styles.stepHeading, isDark && styles.textDark]}>{t.step2Title}</Text>
            <Text style={[styles.stepSubheading, isDark && styles.subTextDark]}>
              {lang === 'EL' ? 'Οι αναφορές ανατίθενται αποκλειστικά στον Δήμο Παλαιού Φαλήρου.' : 'Reports are strictly assigned to the Municipality of Palaio Faliro.'}
            </Text>

            {/* Auto GPS Tracker Button */}
            <TouchableOpacity
              style={[styles.autoLocateBtn, isDark && styles.autoLocateBtnDark]}
              onPress={handleAutoDetectLocation}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator color={isDark ? '#60a5fa' : '#2563eb'} />
              ) : (
                <>
                  <Ionicons name="navigate-circle-outline" size={22} color={isDark ? '#60a5fa' : '#2563eb'} />
                  <Text style={[styles.autoLocateText, isDark && styles.textDark]}>
                    {lang === 'EL' ? 'Αυτόματος Εντοπισμός Τοποθεσίας GPS' : 'Auto-Detect Current GPS Location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={[styles.restrictionBanner, isDark && styles.restrictionBannerDark]}>
              <Ionicons name="shield-checkmark" size={18} color={isDark ? '#60a5fa' : '#2563eb'} />
              <Text style={[styles.restrictionText, isDark && styles.restrictionTextDark]}>
                📍 {lang === 'EL' ? 'Περιορισμένο στον Δήμο Παλαιού Φαλήρου' : 'Restricted to Municipality of Palaio Faliro'}
              </Text>
            </View>

            {/* Palaio Faliro Location Search & Auto-Complete */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && styles.textDark]}>
                🔍 {lang === 'EL' ? 'Αναζήτηση Διεύθυνσης / Οδού Παλαιού Φαλήρου *' : 'Search Palaio Faliro Street Location *'}
              </Text>
              <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                <Ionicons name="search-outline" size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
                <TextInput
                  style={[styles.input, isDark && styles.textDark]}
                  placeholder={lang === 'EL' ? 'Πληκτρολογήστε οδό e.g. Ποσειδώνος, Αφροδίτης, Τρίτωνος...' : 'Type street e.g. Poseidonos, Afroditis, Tritonos...'}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  value={address}
                  onChangeText={(val) => {
                    setAddress(val);
                  }}
                />
                {address.length > 0 && (
                  <TouchableOpacity onPress={() => setAddress('')}>
                    <Ionicons name="close-circle" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Quick Street Search Suggestions Dropdown */}
              <View style={styles.searchSuggestionsBox}>
                <Text style={[styles.suggestionHeader, isDark && styles.subTextDark]}>
                  {lang === 'EL' ? 'Δημοφιλείς Οδοί Παλαιού Φαλήρου:' : 'Popular Palaio Faliro Streets:'}
                </Text>
                <View style={styles.suggestionChipsRow}>
                  {[
                    { name: 'Poseidonos Ave 30 (Φλοίσβος)', lat: 37.9282, lng: 23.6898 },
                    { name: 'Tritonos 35 (Οδός Τρίτωνος)', lat: 37.9268, lng: 23.6948 },
                    { name: 'Afroditis 18 (Αμφιθέα)', lat: 37.9332, lng: 23.7008 },
                    { name: 'Achilleos 50 (Παναγίτσα)', lat: 37.9248, lng: 23.6985 },
                    { name: 'Amfitheas Ave 85 (Αμφιθέα)', lat: 37.9325, lng: 23.7042 },
                    { name: 'Agias Varvaras 24', lat: 37.9362, lng: 23.7052 },
                    { name: 'Sirinon 15 (Π. Φάληρο)', lat: 37.9298, lng: 23.6975 },
                  ].map((street) => (
                    <TouchableOpacity
                      key={street.name}
                      style={[styles.searchSuggestionChip, isDark && styles.searchSuggestionChipDark]}
                      onPress={() => {
                        setAddress(`${street.name}, Palaio Faliro`);
                        setLatitude(street.lat);
                        setLongitude(street.lng);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="location-outline" size={13} color={isDark ? '#60a5fa' : '#2563eb'} />
                      <Text style={[styles.searchSuggestionText, isDark && styles.subTextDark]}>
                        {street.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Mini Interactive Location Picker Map */}
            <Text style={[styles.label, isDark && styles.textDark]}>
              📍 {lang === 'EL' ? 'Προεπισκόπηση & Επιλογή Σημείου στον Χάρτη' : 'Map Pin Location Preview (Tap or Drag Pin)'}
            </Text>
            <View style={styles.miniMapWrapper}>
              <MapView
                style={styles.miniMap}
                provider={PROVIDER_DEFAULT}
                region={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.008,
                  longitudeDelta: 0.008,
                }}
                onPress={(e) => {
                  const newLat = e.nativeEvent.coordinate.latitude;
                  const newLng = e.nativeEvent.coordinate.longitude;
                  if (isLocationInPalaioFaliro(newLat, newLng, address)) {
                    setLatitude(newLat);
                    setLongitude(newLng);
                  } else {
                    Alert.alert(
                      lang === 'EL' ? 'Τοποθεσία Εκτός Παλαιού Φαλήρου' : 'Location Outside Palaio Faliro',
                      lang === 'EL' ? 'Παρακαλούμε επιλέξτε σημείο εντός Παλαιού Φαλήρου.' : 'Please pick a spot inside Palaio Faliro.'
                    );
                  }
                }}
              >
                <Marker
                  coordinate={{ latitude, longitude }}
                  draggable
                  onDragEnd={(e) => {
                    const newLat = e.nativeEvent.coordinate.latitude;
                    const newLng = e.nativeEvent.coordinate.longitude;
                    if (isLocationInPalaioFaliro(newLat, newLng, address)) {
                      setLatitude(newLat);
                      setLongitude(newLng);
                    }
                  }}
                />
              </MapView>
            </View>

            {/* Coordinates */}
            <View style={[styles.coordsBox, isDark && styles.coordsBoxDark]}>
              <Ionicons name="compass-outline" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={[styles.coordsText, isDark && styles.subTextDark]}>
                Palaio Faliro GPS: Lat {latitude.toFixed(4)}°, Lng {longitude.toFixed(4)}°
              </Text>
            </View>

            {/* Buttons Row */}
            <View style={styles.stepBtnRow}>
              <TouchableOpacity style={[styles.prevBtn, isDark && styles.prevBtnDark]} onPress={() => setStep(1)}>
                <Text style={[styles.prevBtnText, isDark && styles.textDark]}>{t.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtnFlex} onPress={handleNextFromStep2}>
                <Text style={styles.nextBtnText}>{t.continue}</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: PHOTOS */}
        {step === 3 && (
          <View style={styles.stepForm}>
            <Text style={[styles.stepHeading, isDark && styles.textDark]}>{t.step3Title}</Text>
            <Text style={[styles.stepSubheading, isDark && styles.subTextDark]}>
              {lang === 'EL' ? 'Προσθέστε τουλάχιστον 1 φωτογραφία για τη διευκόλυνση των συνεργείων.' : 'Provide at least 1 photo to help municipal crews identify the problem.'}
            </Text>

            {/* Large Prominent Photo Action Buttons */}
            <View style={styles.photoActionsRow}>
              <TouchableOpacity
                style={[styles.photoActionBtn, isDark && styles.photoActionBtnDark]}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={24} color={isDark ? '#60a5fa' : '#2563eb'} />
                <Text style={[styles.photoActionText, isDark && styles.textDark]}>{t.takePhoto}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.photoActionBtn, isDark && styles.photoActionBtnDark]}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <Ionicons name="images" size={24} color={isDark ? '#60a5fa' : '#2563eb'} />
                <Text style={[styles.photoActionText, isDark && styles.textDark]}>{t.chooseGallery}</Text>
              </TouchableOpacity>
            </View>

            {/* Photo Grid Preview */}
            <Text style={[styles.label, isDark && styles.textDark]}>{t.uploadPhotos} ({photos.length}/5)</Text>
            <View style={styles.photoGrid}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoItemWrapper}>
                  <Image source={{ uri }} style={styles.photoGridImg} />
                  <TouchableOpacity
                    style={styles.removePhotoBadge}
                    onPress={() => handleRemovePhoto(idx)}
                  >
                    <Ionicons name="close" size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length === 0 && (
                <View style={[styles.emptyPhotoBox, isDark && styles.emptyPhotoBoxDark]}>
                  <Ionicons name="alert-circle-outline" size={28} color="#dc2626" />
                  <Text style={styles.emptyPhotoText}>
                    {lang === 'EL' ? 'Απαιτείται τουλάχιστον 1 φωτογραφία' : 'At least 1 photo is required'}
                  </Text>
                </View>
              )}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.stepBtnRow}>
              <TouchableOpacity style={[styles.prevBtn, isDark && styles.prevBtnDark]} onPress={() => setStep(2)}>
                <Text style={[styles.prevBtnText, isDark && styles.textDark]}>{t.back}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtnFlex} onPress={handleNextFromStep3}>
                <Text style={styles.nextBtnText}>{t.reviewSubmit}</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {step === 4 && (
          <View style={styles.stepForm}>
            <Text style={[styles.stepHeading, isDark && styles.textDark]}>{t.step4Title}</Text>
            <Text style={[styles.stepSubheading, isDark && styles.subTextDark]}>
              {lang === 'EL' ? 'Παρακαλούμε επιβεβαιώστε τα στοιχεία της αναφοράς σας.' : 'Please verify all information before submitting.'}
            </Text>

            <View style={[styles.reviewCard, isDark && styles.reviewCardDark]}>
              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, isDark && styles.subTextDark]}>{lang === 'EL' ? 'Κατηγορία' : 'Category'}</Text>
                <Text style={[styles.reviewValue, isDark && styles.textDark]}>
                  {REPORT_CATEGORIES.find((c) => c.id === category)?.[lang === 'EL' ? 'labelEl' : 'label']}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, isDark && styles.subTextDark]}>{t.priority}</Text>
                <Text style={[styles.reviewValue, isDark && styles.textDark]}>
                  {priority === 'high' ? t.priorityHigh : priority === 'medium' ? t.priorityMedium : t.priorityLow}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, isDark && styles.subTextDark]}>{t.anonymous}</Text>
                <Text style={[styles.reviewValue, isDark && styles.textDark]}>
                  {isAnonymous ? (lang === 'EL' ? 'Ναι (Ανώνυμα)' : 'Anonymous') : (lang === 'EL' ? 'Όχι (Δημόσιο Όνομα)' : 'Public Name')}
                </Text>
              </View>

              <View style={styles.reviewRow}>
                <Text style={[styles.reviewLabel, isDark && styles.subTextDark]}>{t.issueLocation}</Text>
                <Text style={[styles.reviewValue, isDark && styles.textDark]}>{address}</Text>
              </View>

              <View style={styles.reviewCol}>
                <Text style={[styles.reviewLabel, isDark && styles.subTextDark]}>
                  {lang === 'EL' ? 'Περιγραφή' : 'Description'}
                </Text>
                <Text style={[styles.reviewDescText, isDark && styles.textDark]}>{description}</Text>
              </View>

              <Text style={[styles.reviewLabel, isDark && styles.subTextDark]}>
                {lang === 'EL' ? 'Φωτογραφίες που Επισυνάφθηκαν' : 'Photos Attached'} ({photos.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {photos.map((u, i) => (
                  <Image key={i} source={{ uri: u }} style={styles.reviewThumb} />
                ))}
              </ScrollView>
            </View>

            {/* Submit Actions */}
            <View style={styles.stepBtnRow}>
              <TouchableOpacity style={[styles.prevBtn, isDark && styles.prevBtnDark]} onPress={() => setStep(3)}>
                <Text style={[styles.prevBtnText, isDark && styles.textDark]}>{lang === 'EL' ? 'Επεξεργασία' : 'Edit'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitFinalBtn}
                onPress={handleSubmitReport}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.submitFinalBtnText}>{t.submitReport}</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: SUCCESS CONFIRMATION SCREEN */}
        {step === 5 && (
          <View style={styles.successContainer}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>

            <Text style={[styles.successTitle, isDark && styles.textDark]}>{t.reportCreatedTitle}</Text>
            <Text style={styles.successReportId}>#{submittedReportId?.toUpperCase()}</Text>
            <Text style={[styles.successDesc, isDark && styles.subTextDark]}>
              {t.reportCreatedSub}
            </Text>

            <View style={styles.successActionsGroup}>
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={() => router.replace('/(tabs)')}
              >
                <Ionicons name="map-outline" size={20} color="#ffffff" />
                <Text style={styles.actionBtnPrimaryText}>
                  {lang === 'EL' ? 'Προβολή Αναφοράς στον Χάρτη' : 'View Report on Map'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnSecondary, isDark && styles.actionBtnSecondaryDark]}
                onPress={() => router.replace('/(tabs)/my-reports')}
              >
                <Ionicons name="clipboard-outline" size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
                <Text style={[styles.actionBtnSecondaryText, isDark && { color: '#60a5fa' }]}>
                  {lang === 'EL' ? 'Μετάβαση στις Αναφορές μου' : 'Go to My Reports'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtnOutline, isDark && styles.actionBtnOutlineDark]}
                onPress={handleResetForm}
              >
                <Ionicons name="add-circle-outline" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.actionBtnOutlineText, isDark && styles.subTextDark]}>
                  {lang === 'EL' ? 'Δημιουργία Άλλης Αναφοράς' : 'Create Another Report'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  textDark: {
    color: '#ffffff',
  },
  subTextDark: {
    color: '#94a3b8',
  },
  cancelLinkText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  stepperContainerDark: {
    backgroundColor: '#1e293b',
    borderBottomColor: '#334155',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBubbleDark: {
    backgroundColor: '#334155',
  },
  stepBubbleActive: {
    backgroundColor: '#93c5fd',
  },
  stepBubbleCurrent: {
    backgroundColor: '#2563eb',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
  },
  stepLineDark: {
    backgroundColor: '#334155',
  },
  stepLineActive: {
    backgroundColor: '#2563eb',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepForm: {
    gap: 16,
  },
  stepHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  stepSubheading: {
    fontSize: 14,
    color: '#64748b',
    marginTop: -8,
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  catScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  catCard: {
    width: 120,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    gap: 8,
  },
  catCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catLabel: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  inputWrapperDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    height: 110,
    backgroundColor: '#f8fafc',
    fontSize: 14,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  textAreaDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    color: '#ffffff',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  priorityOptionDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  priorityOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  anonToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
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
  anonTextCol: {
    flex: 1,
  },
  anonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  anonDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  nextBtn: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  nextBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  restrictionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  restrictionBannerDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  restrictionText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  restrictionTextDark: {
    color: '#60a5fa',
  },
  searchSuggestionsBox: {
    marginTop: 8,
  },
  suggestionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  suggestionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  searchSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  searchSuggestionChipDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  searchSuggestionText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  autoLocateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    height: 52,
    borderRadius: 14,
    gap: 8,
    marginVertical: 4,
  },
  autoLocateBtnDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  autoLocateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  coordsBoxDark: {
    backgroundColor: '#1e293b',
  },
  miniMapWrapper: {
    height: 160,
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginVertical: 4,
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  coordsText: {
    fontSize: 12,
    color: '#64748b',
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  prevBtn: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevBtnDark: {
    backgroundColor: '#334155',
  },
  prevBtnText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  nextBtnFlex: {
    flex: 1,
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoActionsRow: {
    flexDirection: 'column',
    gap: 10,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  photoActionBtnDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  photoActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItemWrapper: {
    position: 'relative',
  },
  photoGridImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removePhotoBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPhotoBox: {
    width: '100%',
    height: 100,
    borderWidth: 2,
    borderColor: '#fecaca',
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    gap: 6,
  },
  emptyPhotoBoxDark: {
    backgroundColor: '#1e293b',
    borderColor: '#ef4444',
  },
  emptyPhotoText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  reviewCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  reviewCol: {
    gap: 4,
  },
  reviewDescText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  reviewThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  submitFinalBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitFinalBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIconCircle: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  successReportId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginTop: 4,
  },
  successDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 28,
  },
  successActionsGroup: {
    width: '100%',
    gap: 12,
  },
  actionBtnPrimary: {
    backgroundColor: '#2563eb',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    backgroundColor: '#eff6ff',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnSecondaryDark: {
    backgroundColor: '#1e293b',
  },
  actionBtnSecondaryText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtnOutline: {
    backgroundColor: '#f1f5f9',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnOutlineDark: {
    backgroundColor: '#1e293b',
  },
  actionBtnOutlineText: {
    color: '#475569',
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
