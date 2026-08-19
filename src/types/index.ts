export type ReportCategory =
  | 'broken_light'
  | 'pothole'
  | 'graffiti'
  | 'trash'
  | 'tree'
  | 'facility'
  | 'flooding'
  | 'noise'
  | 'other';

export type PriorityLevel = 'low' | 'medium' | 'high';

export type ReportStatus =
  | 'submitted'
  | 'acknowledged'
  | 'in_progress'
  | 'resolved'
  | 'cannot_fix';

export type UserRole = 'citizen' | 'admin' | 'municipality';

export interface AdminUser {
  id: string;
  user_id: string;
  municipality: string;
  department: string;
  position: string;
  permissions: string[];
  full_name?: string;
  email?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id?: string;
  action: string;
  report_id: string;
  changes?: Record<string, any>;
  created_at: string;
  admin_name?: string;
}

export interface UserSettings {
  pushNotifications: boolean;
  emailAlerts: boolean;
  darkMode: boolean;
  language: 'EN' | 'EL';
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  age?: number;
  municipality: string;
  occupation?: string;
  phone?: string;
  avatar_url?: string;
  role?: UserRole;
  is_anonymous_default?: boolean;
  email_verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ReportPhoto {
  id: string;
  report_id: string;
  photo_url: string;
  order: number;
  uploaded_at: string;
}

export interface ReportUpdate {
  id: string;
  report_id: string;
  status: ReportStatus;
  message: string;
  resolved_photo_url?: string | null;
  updated_by?: string;
  admin_name?: string;
  updated_at: string;
}

export interface Report {
  id: string;
  user_id?: string | null;
  category: ReportCategory;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  priority_level: PriorityLevel;
  is_anonymous: boolean;
  status: ReportStatus;
  resolved_photo_url?: string | null;
  assigned_to?: string | null;
  assigned_admin_name?: string;
  photos_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  photos: string[];
  user_full_name?: string;
  updates?: ReportUpdate[];
  confirmations_count?: number;
  has_user_confirmed?: boolean;
}

export const ATHENS_MUNICIPALITIES = [
  'Palaio Faliro Central (Παλαιό Φάληρο Κέντρο)',
  'Flisvos / Marina Flisvou (Φλοίσβος)',
  'Batis (Μπάτης)',
  'Eden (Εδέμ)',
  'Amfithea (Αμφιθέα)',
  'Panagitsa (Παναγίτσα)',
  'Copais (Κοπαΐς)',
  'Agia Varvara (Αγία Βαρβάρα - Παλαιό Φάληρο)',
] as const;

export const REPORT_CATEGORIES: {
  id: ReportCategory;
  label: string;
  labelEl: string;
  iconName: string;
  color: string;
}[] = [
  { id: 'broken_light', label: 'Broken Street Light', labelEl: 'Χαλασμένος Φωτισμός', iconName: 'bulb-outline', color: '#f59e0b' },
  { id: 'pothole', label: 'Pothole / Road Damage', labelEl: 'Λακκούβα / Ζημιά Δρόμου', iconName: 'warning-outline', color: '#ef4444' },
  { id: 'graffiti', label: 'Graffiti / Vandalism', labelEl: 'Γκράφιτι / Βανδαλισμός', iconName: 'brush-outline', color: '#8b5cf6' },
  { id: 'trash', label: 'Trash / Overflowing Bin', labelEl: 'Σκουπίδια / Ξεχειλισμένος Κάδος', iconName: 'trash-outline', color: '#10b981' },
  { id: 'tree', label: 'Tree / Vegetation Hazard', labelEl: 'Επικίνδυνο Δέντρο / Κλαδιά', iconName: 'leaf-outline', color: '#059669' },
  { id: 'facility', label: 'Public Facility Damage', labelEl: 'Ζημιά σε Δημόσια Υποδομή', iconName: 'construct-outline', color: '#3b82f6' },
  { id: 'flooding', label: 'Flooding / Drainage', labelEl: 'Πλημμύρα / Φρεάτιο', iconName: 'water-outline', color: '#06b6d4' },
  { id: 'noise', label: 'Noise Disturbance', labelEl: 'Ηχορύπανση / Θόρυβος', iconName: 'volume-high-outline', color: '#ec4899' },
  { id: 'other', label: 'Other Municipal Issue', labelEl: 'Άλλο Δημοτικό Πρόβλημα', iconName: 'help-circle-outline', color: '#6b7280' },
];

export const TRANSLATIONS = {
  EN: {
    homeMap: 'Home Map',
    createReport: 'Create Report',
    myReports: 'My Reports',
    profile: 'Profile',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    createAccount: 'Create Account',
    guestMode: 'Continue as Guest',
    filterSearch: 'Filter & Search',
    viewDetails: 'View Details',
    problemDetails: 'Problem Details',
    issueLocation: 'Issue Location',
    uploadPhotos: 'Upload Photos',
    reviewSubmit: 'Review & Submit',
    submitReport: 'Submit Report',
    reportSubmitted: 'Report Submitted!',
    confirmIssue: 'Confirm This Issue Still Exists',
    confirmedIssue: 'Confirmed - Issue Still Exists',
    settings: 'Settings & Preferences',
    notifications: 'Push Status Alerts',
    emailAlerts: 'Email Summary Updates',
    darkMode: 'Dark Theme',
    language: 'Language',
    logOut: 'Log Out',
    deleteAccount: 'Delete Account',
    loginRequired: 'Log In Required',
    loginPrompt: 'Please log in to submit a report or vote on issues.',
    step1Title: 'Step 1: Problem Details',
    step2Title: 'Step 2: Palaio Faliro Location',
    step3Title: 'Step 3: Upload Photos',
    step4Title: 'Step 4: Review & Submit',
    reportCreatedTitle: 'Report Created 🎉',
    reportCreatedSub: 'Your report has been successfully submitted to the Municipality of Palaio Faliro.',
    cancel: 'Cancel',
    back: 'Back',
    continue: 'Continue',
    priority: 'Priority Level',
    priorityLow: 'LOW',
    priorityMedium: 'MEDIUM',
    priorityHigh: 'HIGH',
    anonymous: 'Report Anonymously',
    anonymousDesc: 'Your name will not be displayed publicly on the map.',
    selectCategory: 'Select Category',
    descriptionPlaceholder: 'Describe the civic problem in detail...',
    takePhoto: 'Take Photo with Camera',
    chooseGallery: 'Choose from Photo Library',
    myReportsTitle: 'My Reports (Palaio Faliro)',
    myReportsSub: 'Track the status and progress of your submitted municipal reports in Palaio Faliro.',
    allReports: 'All Reports',
    activeReports: 'In Progress / Active',
    resolvedReports: 'Resolved',
    searchPlaceholder: 'Search reports by keyword or address...',
    noReportsTitle: 'No Reports Submitted Yet',
    noReportsSub: 'You have not created any civic reports yet. Tap the + button in the navigation bar to submit your first report!',
    reportsSubmitted: 'Reports Submitted',
    issuesResolved: 'Issues Resolved',
    confirmVotes: 'Confirm Votes',
    citizenDetails: 'Citizen Details',
    occupation: 'Occupation',
    ageGroup: 'Age Group',
    phone: 'Phone Number',
    editProfile: 'Edit Profile',
  },
  EL: {
    homeMap: 'Χάρτης',
    createReport: 'Νέα Αναφορά',
    myReports: 'Οι Αναφορές μου',
    profile: 'Προφίλ',
    signIn: 'Σύνδεση',
    signUp: 'Εγγραφή',
    createAccount: 'Δημιουργία Λογαριασμού',
    guestMode: 'Συνέχεια ως Επισκέπτης',
    filterSearch: 'Φίλτρα & Αναζήτηση',
    viewDetails: 'Προβολή Λεπτομερειών',
    problemDetails: 'Στοιχεία Προβλήματος',
    issueLocation: 'Τοποθεσία',
    uploadPhotos: 'Φωτογραφίες',
    reviewSubmit: 'Επιβεβαίωση & Υποβολή',
    submitReport: 'Υποβολή Αναφοράς',
    reportSubmitted: 'Η Αναφορά Υποβλήθηκε!',
    confirmIssue: 'Επιβεβαίωση ότι το Πρόβλημα Υφίσταται',
    confirmedIssue: 'Επιβεβαιώθηκε - Υφίσταται',
    settings: 'Ρυθμίσεις & Προτιμήσεις',
    notifications: 'Ειδοποιήσεις Push',
    emailAlerts: 'Ενημερώσεις Email',
    darkMode: 'Σκούρο Θέμα',
    language: 'Γλώσσα',
    logOut: 'Αποσύνδεση',
    deleteAccount: 'Διαγραφή Λογαριασμού',
    loginRequired: 'Απαιτείται Σύνδεση',
    loginPrompt: 'Παρακαλούμε συνδεθείτε για να υποβάλετε αναφορά ή να ψηφίσετε.',
    step1Title: 'Βήμα 1: Στοιχεία Προβλήματος',
    step2Title: 'Βήμα 2: Τοποθεσία Παλαιού Φαλήρου',
    step3Title: 'Βήμα 3: Φωτογραφίες',
    step4Title: 'Βήμα 4: Επιβεβαίωση & Υποβολή',
    reportCreatedTitle: 'Η Αναφορά Δημιουργήθηκε 🎉',
    reportCreatedSub: 'Η αναφορά σας υποβλήθηκε με επιτυχία στον Δήμο Παλαιού Φαλήρου.',
    cancel: 'Ακύρωση',
    back: 'Πίσω',
    continue: 'Συνέχεια',
    priority: 'Επίπεδο Προτεραιότητας',
    priorityLow: 'ΧΑΜΗΛΗ',
    priorityMedium: 'ΜΕΣΑΙΑ',
    priorityHigh: 'ΥΨΗΛΗ',
    anonymous: 'Αναφορά Ανώνυμα',
    anonymousDesc: 'Το όνομά σας δεν θα εμφανίζεται δημόσια στον χάρτη.',
    selectCategory: 'Επιλογή Κατηγορίας',
    descriptionPlaceholder: 'Περιγράψτε το πρόβλημα με λεπτομέρεια...',
    takePhoto: 'Λήψη Φωτογραφίας με Κάμερα',
    chooseGallery: 'Επιλογή από Συλλογή',
    myReportsTitle: 'Οι Αναφορές μου (Παλαιό Φάληρο)',
    myReportsSub: 'Παρακολουθήστε την πορεία και κατάσταση των αναφορών σας στον Δήμο Παλαιού Φαλήρου.',
    allReports: 'Όλες οι Αναφορές',
    activeReports: 'Σε Εξέλιξη / Ενεργές',
    resolvedReports: 'Επιλύθηκαν',
    searchPlaceholder: 'Αναζήτηση αναφορών με λέξη-κλειδί ή διεύθυνση...',
    noReportsTitle: 'Δεν έχουν υποβληθεί αναφορές ακόμα',
    noReportsSub: 'Δεν έχετε δημιουργήσει αναφορές ακόμα. Πιέστε το κουμπί + στην κάτω μπάρα για να υποβάλετε την πρώτη σας αναφορά!',
    reportsSubmitted: 'Αναφορές που Υποβλήθηκαν',
    issuesResolved: 'Προβλήματα που Επιλύθηκαν',
    confirmVotes: 'Ψήφοι Επιβεβαίωσης',
    citizenDetails: 'Στοιχεία Πολίτη',
    occupation: 'Επάγγελμα',
    ageGroup: 'Ηλικιακή Ομάδα',
    phone: 'Αριθμός Τηλεφώνου',
    editProfile: 'Επεξεργασία Προφίλ',
  },
};
