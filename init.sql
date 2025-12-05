CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS plans (
  tier TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_inr INTEGER NOT NULL,
  dashboard_limit INTEGER,
  storage_limit_mb INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plans (tier, name, price_inr, dashboard_limit, storage_limit_mb, description)
VALUES
  ('free', 'Free', 0, 1, 250, 'Single dashboard, essential storage, manual edits'),
  ('growth', 'Growth 149', 149, 5, 1024, 'Five dashboards with AI assistance'),
  ('scale', 'Scale 250', 250, NULL, 5120, 'Unlimited dashboards and premium AI')
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  headline TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  template TEXT NOT NULL DEFAULT 'hire-me',
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  theme_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  component_snippets JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO templates (slug, name, description, preview_url, theme_config, component_snippets)
VALUES
  (
    'hire-me',
    'Hire Me Spotlight',
    'CTA-first profile for job seekers',
    'https://cdn.openpersona.dev/templates/hire-me.png',
    '{"fonts":{"heading":"Space Grotesk","body":"Inter","mono":"JetBrains Mono"},"colors":{"primary":"#0F172A","accent":"#06B6D4","background":"#F8FAFC"},"spacing":{"section":"96px","block":"48px"}}'::jsonb,
    '{"hero":{"language":"tsx","code":"<HeroSpotlight headline=\"Make offers happen\" />"},"cta":{"language":"css","code":".cta-button{background:#0F172A;color:#F8FAFC;border-radius:999px;padding:16px 32px;}"}}'::jsonb
  ),
  (
    'portfolio',
    'Creative Portfolio',
    'Visual-first template for designers',
    'https://cdn.openpersona.dev/templates/portfolio.png',
    '{"fonts":{"heading":"Clash Display","body":"Suisse"},"colors":{"primary":"#111827","accent":"#F97316","muted":"#9CA3AF"},"radii":{"card":"32px"}}'::jsonb,
    '{"gallery":{"language":"css","code":".gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:32px;}"}}'::jsonb
  ),
  (
    'case-study',
    'Case Study Deck',
    'Storytelling layout for consultants',
    'https://cdn.openpersona.dev/templates/case-study.png',
    '{"fonts":{"heading":"Aeonik","body":"IBM Plex Sans"},"colors":{"primary":"#0B132B","accent":"#3A86FF"},"shadows":{"card":"0 20px 80px rgba(15,23,42,0.2)"}}'::jsonb,
    '{"timeline":{"language":"tsx","code":"<TimelineCaseStudy steps={steps} />"}}'::jsonb
  ),
  (
    'agency',
    'Agency Grid',
    'Team-friendly showcase for agencies',
    'https://cdn.openpersona.dev/templates/agency.png',
    '{"fonts":{"heading":"Whyte Inktrap","body":"General Sans"},"colors":{"primary":"#020617","accent":"#EC4899","support":"#22D3EE"}}'::jsonb,
    '{"carousel":{"language":"js","code":"export const TestimonialsCarousel = () => {/* agency block */}"}}'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS dashboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

ALTER TABLE dashboards
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS theme_config JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS component_snippets JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS dashboard_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  content_type TEXT,
  size BIGINT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, object_key)
);

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  mime_type TEXT,
  size BIGINT,
  analysis JSONB,
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  input_payload JSONB NOT NULL,
  output_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  summary TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  dashboard_slug TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT,
  summary TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  summary TEXT,
  credential_id TEXT,
  issued_at DATE,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL REFERENCES plans(tier),
  price_inr INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboards_user ON dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user ON experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user ON certifications(user_id);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS links JSONB NOT NULL DEFAULT '[]'::jsonb;
