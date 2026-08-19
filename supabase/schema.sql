-- CivicReport Supabase PostgreSQL Schema (Single DB for Citizens & Municipality Admin)
-- Run this SQL in your Supabase SQL Editor

-- 1. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE report_category AS ENUM (
      'broken_light',
      'pothole',
      'graffiti',
      'trash',
      'tree',
      'facility',
      'flooding',
      'noise',
      'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_level AS ENUM (
      'low',
      'medium',
      'high'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
      'submitted',
      'acknowledged',
      'in_progress',
      'resolved',
      'cannot_fix'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
      'citizen',
      'admin',
      'municipality'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. USERS TABLE (Citizens & Municipal Admins)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  age INT CHECK (age >= 18),
  municipality TEXT NOT NULL DEFAULT 'Παλαιό Φάληρο',
  occupation TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'citizen',
  is_anonymous_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REPORTS TABLE (Core Civic Reports)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  category report_category NOT NULL,
  description TEXT NOT NULL CHECK (char_length(description) <= 500),
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  address TEXT NOT NULL,
  priority_level priority_level DEFAULT 'medium',
  is_anonymous BOOLEAN DEFAULT false,
  status report_status DEFAULT 'submitted',
  resolved_photo_url TEXT,
  confirmations_count INT DEFAULT 0,
  photos_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PHOTOS TABLE (Report Photos Storage Links)
CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  "order" INT DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REPORT UPDATES (Official Municipality Status History & Comments)
CREATE TABLE IF NOT EXISTS public.report_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  status report_status NOT NULL,
  message TEXT NOT NULL,
  resolved_photo_url TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REPORT CONFIRMATIONS ("Still Exists" Citizen Votes)
CREATE TABLE IF NOT EXISTS public.report_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  confirms_still_exists BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- 7. AUDIT LOGS TABLE (Track all municipal admin status updates)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT,
  action TEXT NOT NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  changes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INDEXES FOR HIGH-PERFORMANCE QUERYING
CREATE INDEX IF NOT EXISTS idx_reports_category ON public.reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_geo ON public.reports(latitude, longitude);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running script
DROP POLICY IF EXISTS "Public read reports" ON public.reports;
DROP POLICY IF EXISTS "Public read photos" ON public.photos;
DROP POLICY IF EXISTS "Public read report updates" ON public.report_updates;
DROP POLICY IF EXISTS "Public read confirmations" ON public.report_confirmations;
DROP POLICY IF EXISTS "Public read users basic" ON public.users;
DROP POLICY IF EXISTS "Public read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public insert reports" ON public.reports;
DROP POLICY IF EXISTS "Public update reports status" ON public.reports;
DROP POLICY IF EXISTS "Public delete reports" ON public.reports;
DROP POLICY IF EXISTS "Public insert photos" ON public.photos;
DROP POLICY IF EXISTS "Public insert report updates" ON public.report_updates;
DROP POLICY IF EXISTS "Public insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public insert report confirmations" ON public.report_confirmations;
DROP POLICY IF EXISTS "Public delete report confirmations" ON public.report_confirmations;

-- Read policies: Public read for reports, photos, updates, confirmations
CREATE POLICY "Public read reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Public read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "Public read report updates" ON public.report_updates FOR SELECT USING (true);
CREATE POLICY "Public read confirmations" ON public.report_confirmations FOR SELECT USING (true);
CREATE POLICY "Public read users basic" ON public.users FOR SELECT USING (true);
CREATE POLICY "Public read audit logs" ON public.audit_logs FOR SELECT USING (true);

-- Insert/Update/Delete policies
CREATE POLICY "Public insert reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update reports status" ON public.reports FOR UPDATE USING (true);
CREATE POLICY "Public delete reports" ON public.reports FOR DELETE USING (true);
CREATE POLICY "Public insert photos" ON public.photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert report updates" ON public.report_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert report confirmations" ON public.report_confirmations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete report confirmations" ON public.report_confirmations FOR DELETE USING (true);

-- 10. STORAGE BUCKET FOR REPORT PHOTOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-photos', 'report-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Report Photos" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Report Photos" ON storage.objects;

CREATE POLICY "Public Read Report Photos" ON storage.objects FOR SELECT USING (bucket_id = 'report-photos');
CREATE POLICY "Public Upload Report Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-photos');
