-- Migration and upsert function for user profiles in Supabase

-- 1. Create the public.users table with all required fields
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  address text not null,
  phone text,
  created_at timestamp with time zone default now()
);

-- 2. Migrate all existing users from auth.users to public.users (if not already present)
-- For existing users, full_name, address, and phone will be empty unless you have this data elsewhere
insert into public.users (id, email, full_name, address)
select id, email, '', ''
from auth.users
where id not in (select id from public.users);

-- 3. Add indexes for faster lookups
create index if not exists idx_users_phone on public.users(phone);
create index if not exists idx_users_full_name on public.users(full_name);

-- 4. Grant permissions to authenticated users (adjust as needed)
grant select, insert, update on public.users to authenticated;

-- 5. Create a trigger function to auto-insert new users into public.users with email
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, address)
  values (new.id, new.email, '', '');
  return new;
end;
$$ language plpgsql security definer;

-- 6. Create the trigger on auth.users for new user signups
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 7. Create a function to insert/update user profile after registration
-- Call this from your app after registration to store full_name, address, and phone
create or replace function public.upsert_user_profile(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_address text,
  p_phone text default null
) returns void as $$
begin
  insert into public.users (id, email, full_name, address, phone)
  values (p_id, p_email, p_full_name, p_address, p_phone)
  on conflict (id) do update
    set full_name = excluded.full_name,
        address = excluded.address,
        phone = excluded.phone,
        email = excluded.email;
end;
$$ language plpgsql security definer;

-- 8. Grant execute permission on the upsert function
grant execute on function public.upsert_user_profile(uuid, text, text, text, text) to authenticated;
