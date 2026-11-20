-- =====================================================================
-- FIX RLS POLICIES FOR MATERIALS AND SUBMISSIONS
-- Project ID: dygxkexmodiatnuyrigb
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/dygxkexmodiatnuyrigb/sql
-- =====================================================================

-- 1. FIX MATERIALS TABLE RLS POLICIES (Fixes "new row violates row-level security policy for table 'materials'")
alter table public.materials enable row level security;

drop policy if exists "Professor can insert materials" on public.materials;
drop policy if exists "Class members can read materials" on public.materials;
drop policy if exists "Students can read materials of enrolled classes" on public.materials;
drop policy if exists "Authenticated users can insert materials" on public.materials;
drop policy if exists "Authenticated users can read materials" on public.materials;
drop policy if exists "Anyone can read materials" on public.materials;
drop policy if exists "Authenticated users can update materials" on public.materials;
drop policy if exists "Authenticated users can delete materials" on public.materials;

-- Allow all authenticated users (professors) to insert materials
create policy "Authenticated users can insert materials"
  on public.materials for insert
  to authenticated
  with check (true);

-- Allow all authenticated users (professors & students) to select/read materials
create policy "Authenticated users can read materials"
  on public.materials for select
  to authenticated
  using (true);

-- Allow all authenticated users to update their materials
create policy "Authenticated users can update materials"
  on public.materials for update
  to authenticated
  using (true);

-- Allow all authenticated users to delete materials
create policy "Authenticated users can delete materials"
  on public.materials for delete
  to authenticated
  using (true);


-- 2. FIX SUBMISSIONS TABLE RLS POLICIES (Ensures students can submit and professors can grade)
alter table public.submissions enable row level security;

drop policy if exists "Students can insert submissions" on public.submissions;
drop policy if exists "Students can update submissions" on public.submissions;
drop policy if exists "Authenticated users can insert submissions" on public.submissions;
drop policy if exists "Authenticated users can update submissions" on public.submissions;
drop policy if exists "Authenticated users can select submissions" on public.submissions;

create policy "Authenticated users can select submissions"
  on public.submissions for select
  to authenticated
  using (true);

create policy "Authenticated users can insert submissions"
  on public.submissions for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update submissions"
  on public.submissions for update
  to authenticated
  using (true);


-- 3. ENSURE STORAGE POLICIES ON classroom-files BUCKET
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('classroom-files', 'classroom-files', true, 52428800, null)
on conflict (id) do update set public = true;

drop policy if exists "Public Access to Classroom Files" on storage.objects;
drop policy if exists "Authenticated Users can upload Classroom Files" on storage.objects;
drop policy if exists "Users can update or delete Classroom Files" on storage.objects;
drop policy if exists "Users can delete Classroom Files" on storage.objects;

create policy "Public Access to Classroom Files"
on storage.objects for select
using (bucket_id = 'classroom-files');

create policy "Authenticated Users can upload Classroom Files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'classroom-files');

create policy "Users can update or delete Classroom Files"
on storage.objects for update
to authenticated
using (bucket_id = 'classroom-files');

create policy "Users can delete Classroom Files"
on storage.objects for delete
to authenticated
using (bucket_id = 'classroom-files');


-- 4. FIX AI_FEEDBACK TABLE RLS POLICIES (Enables detector feedback submission and stream display)
alter table public.ai_feedback enable row level security;

drop policy if exists "Anyone can read ai_feedback" on public.ai_feedback;
drop policy if exists "Authenticated users can read ai_feedback" on public.ai_feedback;
drop policy if exists "Anyone can insert ai_feedback" on public.ai_feedback;
drop policy if exists "Authenticated users can insert ai_feedback" on public.ai_feedback;
drop policy if exists "Authenticated users can update ai_feedback" on public.ai_feedback;
drop policy if exists "Authenticated users can delete ai_feedback" on public.ai_feedback;

-- Allow public and authenticated users to read detection feedback in stream and admin
create policy "Anyone can read ai_feedback"
  on public.ai_feedback for select
  using (true);

-- Allow both guest visitors and authenticated users to submit detector feedback
create policy "Anyone can insert ai_feedback"
  on public.ai_feedback for insert
  with check (true);

-- Allow authenticated users (e.g. admins) to update feedback
create policy "Authenticated users can update ai_feedback"
  on public.ai_feedback for update
  to authenticated
  using (true);

-- Allow authenticated users (e.g. admins) to delete feedback
create policy "Authenticated users can delete ai_feedback"
  on public.ai_feedback for delete
  to authenticated
  using (true);
