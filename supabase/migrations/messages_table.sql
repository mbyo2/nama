-- Create messages table for admin-to-member communications
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  admin_name TEXT NOT NULL,
  member_name TEXT NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_member_id ON public.messages(member_id);
CREATE INDEX IF NOT EXISTS idx_messages_admin_id ON public.messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view messages sent to them
CREATE POLICY "Members view own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (auth.uid() = member_id);

-- Policy: Admins can view all messages
CREATE POLICY "Admins view all messages"
  ON public.messages FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Policy: Admins can insert messages
CREATE POLICY "Admins insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Policy: Members can update read_at (mark as read)
CREATE POLICY "Members update read status"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);
