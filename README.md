# 🏛️ PolisCheck — Smart Municipal Civic Reporting Platform

> **PolisCheck** is a full-stack, real-time municipal civic issue reporting platform tailored for the **Municipality of Palaio Faliro (Δήμος Παλαιού Φαλήρου)**. It empowers citizens to easily report urban infrastructure issues (potholes, street lighting, flooding, waste) while providing municipal administrators with a modern GIS map dashboard for real-time tracking, status management, and proof of repair verification.

---

## ✨ Features Overview

### 📱 Citizen Mobile Application (React Native / Expo)
- **📸 Smart Issue Reporting**: Easily capture and upload photos of municipal issues with automatic geolocation tagging.
- **📍 Interactive Municipal Map**: View neighborhood issues directly on an interactive map of Palaio Faliro.
- **💬 Direct Municipal Chat & Standalone Chat Page**: Communicate 1-on-1 in real-time with municipal officers via a dedicated full-screen Chat Page (`/chat/[id]`) with live badges and auto-scrolling.
- **📬 Dedicated Messages Tab**: Access all active report conversation threads directly from a dedicated bottom navigation tab.
- **🔒 Creator-Only Chat Privacy**: Strict access control ensuring report chats are private to the report creator and municipal officials.
- **⏱️ Live Status Progression**: Track issue progress through a transparent 4-stage lifecycle (`Submitted` ➔ `Acknowledged` ➔ `In Progress` ➔ `Resolved`).
- **✨ "Before & After" Repair Proof**: View side-by-side photo comparisons showing citizen report photos alongside official municipal fix verification photos once resolved.
- **🔒 Secure Authentication & Verification Sync**: Sign up with Firebase Authentication (Email/Password or Anonymous Guest mode) with background verification status polling and GDPR profile management.
- **🌐 Bilingual Support**: Full English and Greek (Ελληνικά) translation toggle.

### 🏢 Municipal Admin Dashboard (Next.js 15)
- **🗺️ Interactive GIS Map View**: Live map powered by CartoDB & OpenStreetMap displaying color-coded issue pins (High Priority, In Progress, Resolved) with instant popups.
- **💬 Live Direct Citizen Messaging**: Text 1-on-1 with report creators directly from report detail pages with automatic audit logging and real-time WebSocket sync.
- **📊 Real-time Issue Management**: Update report statuses, attach official municipal notes, and upload "After Repair" proof photos.
- **📈 Analytics & Key Metrics**: Live statistics on total reports, resolution efficiency, and category breakdown.
- **📁 UTF-8 CSV Export**: Export comprehensive municipal data to CSV with full UTF-8 BOM encoding for seamless compatibility with Microsoft Excel and Google Sheets.
- **🛡️ Audit Logging & RLS Security**: Full trail of administrative actions powered by Supabase PostgreSQL Row Level Security (RLS) and Realtime Publication broadcasting.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Mobile App (Citizens)** | React Native, Expo (SDK 52/57), Expo Router, TypeScript, Zustand, Lucide / Expo Vector Icons |
| **Admin Panel (Municipality)** | Next.js 15 (App Router), React 19, TypeScript, CartoDB / Leaflet Maps, Lucide Icons |
| **Backend & Database** | Supabase PostgreSQL, Supabase Realtime WebSockets, Supabase Storage (Report Photos) |
| **Authentication** | Firebase Authentication (Email/Password, Anonymous) |

---

## 📁 Repository Structure

```
CivicReport/
├── src/                          # Citizen Mobile Application (Expo / React Native)
│   ├── app/                      # Expo Router navigation screens & tabs
│   ├── components/               # UI components (maps, report detail modal, badges)
│   ├── lib/                      # Services (supabase, firebase, reports-service, store)
│   └── types/                    # Shared TypeScript interfaces & Greek/English translations
├── civic-report-admin/           # Municipal Admin Portal (Next.js 15)
│   ├── app/                      # Next.js App Router ((dashboard), reports, map, analytics)
│   ├── components/               # Admin components (ReportsTable, LiveAdminMap, StatusBadge)
│   ├── services/                 # Admin data services (reportService)
│   └── types/                    # Admin TypeScript definitions
├── supabase/                     # Supabase Database Schemas & Reset Scripts
│   ├── schema.sql                # Complete PostgreSQL schema (tables, RLS policies, storage)
│   └── reset-database.sql        # Database reset & sample seed data
├── assets/                       # Mobile application icons, splash screens, and images
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) app on iOS / Android (optional for mobile testing)

---

### 1. Environment Setup

Create a `.env` file in the project root:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://<your-supabase-project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=<your-firebase-api-key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-firebase-auth-domain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your-firebase-project-id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-firebase-storage-bucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-firebase-sender-id>
EXPO_PUBLIC_FIREBASE_APP_ID=<your-firebase-app-id>
```

---

### 2. Database Initialization (Supabase)

1. Open your **[Supabase Dashboard](https://supabase.com/dashboard)** ➔ Navigate to **SQL Editor**.
2. Run the SQL script located in `supabase/schema.sql`.
3. This provisions all required PostgreSQL tables (`users`, `reports`, `photos`, `report_updates`, `audit_logs`), Row-Level Security (RLS) policies, and the public `report-photos` storage bucket.

---

### 3. Running the Citizen Mobile App (Expo)

```bash
# 1. Install dependencies
npm install

# 2. Start Expo Development Server
npx expo start

# 3. Optional: Run with Expo Tunnel
npx expo start --tunnel
```

---

### 4. Running the Municipal Admin Dashboard (Next.js)

```bash
# 1. Navigate to the admin folder
cd civic-report-admin

# 2. Install dependencies
npm install

# 3. Start Next.js development server
npm run dev
```

Open **`http://localhost:3001`** in your browser to access the Municipal Admin Portal.

---

## 🔒 Security & Privacy

- **Data Privacy (GDPR)**: Users can request complete account deletion via the mobile app profile page, which purges user records from Firebase Auth, Supabase DB, and local cache.
- **Row-Level Security (RLS)**: Supabase PostgreSQL tables are secured with custom RLS policies for read, write, update, and delete actions.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
