-- Phase 4 Migration: Token-Based Seat Access Model
-- Replaces global level unlock system with per-user token-based access
-- One token = one seat for one user for one level

-- 1. Token Purchases table
-- Tracks admin purchase events (when admins buy tokens for a level)
CREATE TABLE IF NOT EXISTS public.token_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  level_id UUID NOT NULL REFERENCES public.assessment_levels(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  stripe_session_id TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Access Tokens table
-- One row per individual redeemable token
-- Each token can be redeemed by one user exactly once
CREATE TABLE IF NOT EXISTS public.access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.token_purchases(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.assessment_levels(id) ON DELETE CASCADE,
  token_code TEXT NOT NULL UNIQUE, -- Random alphanumeric for distribution
  status TEXT NOT NULL DEFAULT 'unused', -- 'unused', 'used', 'expired'
  redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Level Access table
-- Tracks which users have access to which levels (via token redemption)
CREATE TABLE IF NOT EXISTS public.user_level_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.assessment_levels(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.access_tokens(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, level_id) -- One access record per user per level
);

-- Enable RLS
ALTER TABLE public.token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_level_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for token_purchases (admins only)
CREATE POLICY "Admins can view all token purchases" ON public.token_purchases
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can create token purchases" ON public.token_purchases
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admins can update token purchases" ON public.token_purchases
  FOR UPDATE USING ((auth.jwt() ->> 'role') = 'admin');

-- RLS Policies for access_tokens (admins can view all, users can see their redeemed tokens)
CREATE POLICY "Admins can view all access tokens" ON public.access_tokens
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Users can view their own redeemed tokens" ON public.access_tokens
  FOR SELECT USING (redeemed_by_user_id = auth.uid());

-- RLS Policies for user_level_access (users can view their own, admins can view all)
CREATE POLICY "Users can view their own level access" ON public.user_level_access
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user level access" ON public.user_level_access
  FOR SELECT USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Users can insert their own level access" ON public.user_level_access
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_token_purchases_admin_user_id ON public.token_purchases(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_level_id ON public.token_purchases(level_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_token_code ON public.access_tokens(token_code);
CREATE INDEX IF NOT EXISTS idx_access_tokens_status ON public.access_tokens(status);
CREATE INDEX IF NOT EXISTS idx_access_tokens_redeemed_by_user_id ON public.access_tokens(redeemed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_user_level_access_user_id ON public.user_level_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_level_access_level_id ON public.user_level_access(level_id);
CREATE INDEX IF NOT EXISTS idx_user_level_access_user_level ON public.user_level_access(user_id, level_id);

-- NOTE: The old level_unlocks table is now DEPRECATED
-- It remains for backward compatibility but is no longer used by the application
-- All access checks should use user_level_access table instead

DO $$ BEGIN
  RAISE NOTICE 'Migration 016 complete: Token-based seat access model implemented. Old level_unlocks table deprecated.';
END $$;
