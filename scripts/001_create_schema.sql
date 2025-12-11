-- Create users table for profiles
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  level integer default 1 not null,
  experience_points integer default 0 not null,
  total_stars integer default 0 not null,
  created_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);

-- Create game_progress table
create table if not exists public.game_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  game_type text not null,
  level integer not null,
  stars_earned integer default 0 not null,
  completed boolean default false not null,
  completed_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.game_progress enable row level security;

create policy "game_progress_select_own"
  on public.game_progress for select
  using (auth.uid() = user_id);

create policy "game_progress_insert_own"
  on public.game_progress for insert
  with check (auth.uid() = user_id);

create policy "game_progress_update_own"
  on public.game_progress for update
  using (auth.uid() = user_id);

-- Create achievements table
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  achievement_type text not null,
  unlocked_at timestamptz default now() not null
);

alter table public.achievements enable row level security;

create policy "achievements_select_own"
  on public.achievements for select
  using (auth.uid() = user_id);

create policy "achievements_insert_own"
  on public.achievements for insert
  with check (auth.uid() = user_id);

-- Create user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
