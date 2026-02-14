-- Fix 1: Recreate public_profiles view without sensitive data
DROP VIEW IF EXISTS public_profiles CASCADE;

CREATE VIEW public_profiles AS 
SELECT 
  id, 
  full_name, 
  avatar_url, 
  bio,
  created_at
FROM profiles;

COMMENT ON VIEW public_profiles IS 'Public view of profiles without sensitive data (email, whatsapp)';

-- Fix 5: Restrict live_activity to authenticated users only
DROP POLICY IF EXISTS "Anyone can view live activity" ON live_activity;

CREATE POLICY "Authenticated users can view live activity" 
ON live_activity FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: Add audit logging trigger for pending_purchases
CREATE TABLE IF NOT EXISTS pending_purchases_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type text NOT NULL,
  pending_purchase_id uuid,
  user_id uuid,
  accessed_at timestamp with time zone DEFAULT now(),
  accessed_by uuid
);

-- Enable RLS on audit table
ALTER TABLE pending_purchases_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" 
ON pending_purchases_audit FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_pending_purchases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pending_purchases_audit (
    action_type,
    pending_purchase_id,
    user_id,
    accessed_by
  ) VALUES (
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach audit trigger
DROP TRIGGER IF EXISTS audit_pending_purchases_trigger ON pending_purchases;
CREATE TRIGGER audit_pending_purchases_trigger
AFTER INSERT OR UPDATE OR DELETE ON pending_purchases
FOR EACH ROW EXECUTE FUNCTION audit_pending_purchases();

-- Add data retention policy function
CREATE OR REPLACE FUNCTION cleanup_old_pending_purchases()
RETURNS void AS $$
BEGIN
  -- Delete claimed purchases older than 90 days
  DELETE FROM pending_purchases 
  WHERE claimed = true 
  AND created_at < NOW() - INTERVAL '90 days';
  
  -- Delete unclaimed purchases older than 180 days
  DELETE FROM pending_purchases 
  WHERE claimed = false 
  AND created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;