-- =====================================================================
-- TAGADETECT CLASSROOM: SUPABASE STORAGE & DATABASE SETUP SCRIPT
-- Project ID: dygxkexmodiatnuyrigb
-- Dashboard URL: https://supabase.com/dashboard/project/dygxkexmodiatnuyrigb/sql
-- =====================================================================

-- 1. CREATE STORAGE BUCKET: classroom-files (for both materials and submissions)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('classroom-files', 'classroom-files', true, 52428800, null) -- 50MB limit
on conflict (id) do update set public = true;

-- STORAGE POLICIES:
-- Drop existing policies if any to prevent conflicts
drop policy if exists "Public Access to Classroom Files" on storage.objects;
drop policy if exists "Authenticated Users can upload Classroom Files" on storage.objects;
drop policy if exists "Users can update or delete Classroom Files" on storage.objects;

-- Allow public / students / professors to view or download files
create policy "Public Access to Classroom Files"
on storage.objects for select
using (bucket_id = 'classroom-files');

-- Allow authenticated users (students & professors) to upload files
create policy "Authenticated Users can upload Classroom Files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'classroom-files');

-- Allow users to update or delete their files in the bucket
create policy "Users can update or delete Classroom Files"
on storage.objects for update
to authenticated
using (bucket_id = 'classroom-files');

create policy "Users can delete Classroom Files"
on storage.objects for delete
to authenticated
using (bucket_id = 'classroom-files');


-- 2. UPDATE SUBMISSIONS TABLE TO STORE ATTACHED FILES
alter table public.submissions
  add column if not exists file_url text,
  add column if not exists file_name text,
  add column if not exists file_size text;


-- 3. UPDATE MATERIALS TABLE TO STORE ALL FIELDS AND UPLOADED FILES
alter table public.materials
  add column if not exists file_url text,
  add column if not exists file_name text,
  add column if not exists file_size text default '1.0 MB',
  add column if not exists category text default 'Lecture Slides',
  add column if not exists type text default 'PDF Document',
  add column if not exists posted_by uuid references auth.users(id);

-- Ensure RLS allows enrolled students and professors of the class to read materials
alter table public.materials enable row level security;

drop policy if exists "Class members can read materials" on public.materials;
create policy "Class members can read materials"
  on public.materials for select
  using (
    exists (
      select 1 from public.enrollments e
      where e.class_id = materials.class_id
        and e.student_id = auth.uid()
    )
    or
    exists (
      select 1 from public.classes c
      where c.id = materials.class_id
        and c.professor_id = auth.uid()
    )
    or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Professor can insert materials" on public.materials;
create policy "Professor can insert materials"
  on public.materials for insert
  with check (
    exists (
      select 1 from public.classes c
      where c.id = class_id
        and c.professor_id = auth.uid()
    )
    or
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
