-- Update handle_new_user to correctly prioritize metadata role and department
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    nin,
    department,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'nin', ''),
    -- Prioritize Administration for admins, or empty for others if not provided
    COALESCE(
      NEW.raw_user_meta_data->>'department', 
      CASE WHEN (NEW.raw_user_meta_data->>'role') = 'admin' THEN 'Administration' ELSE 'General' END
    ),
    -- Ensure 'role' from metadata is used, defaulting to 'staff' only if missing
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
