-- Make the existing ebooks bucket public
update storage.buckets
set public = true
where id = 'ebooks';

-- Allow public read access to files in the 'ebooks' bucket
drop policy if exists "Public read access for ebooks" on storage.objects;

create policy "Public read access for ebooks"
  on storage.objects
  for select
  using (bucket_id = 'ebooks');
