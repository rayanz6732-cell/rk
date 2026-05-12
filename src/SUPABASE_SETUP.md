# Supabase Setup Guide

## 1. Create a Supabase project at https://supabase.com

## 2. Run this SQL in the Supabase SQL editor:

```sql
-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  username text,
  bio text,
  location text,
  favorite_anime text,
  avatar_url text,
  banner_url text,
  theme text default 'default',
  watch_streak int default 0,
  last_watched_date text,
  total_episodes_watched int default 0,
  total_watch_minutes int default 0,
  badges text[] default '{}',
  role text default 'user',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Comments table
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  anime_id text not null,
  episode text,
  text text not null,
  author_name text default 'Anonymous',
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);
create index on public.comments (anime_id);

-- User ratings table
create table public.user_ratings (
  id uuid default gen_random_uuid() primary key,
  mal_id text not null,
  anime_title text,
  rating int not null,
  user_id uuid references auth.users(id),
  created_at timestamptz default now(),
  unique(mal_id, user_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.comments enable row level security;
alter table public.user_ratings enable row level security;

-- RLS Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Authenticated users can insert comments" on public.comments for insert with check (true);

create policy "Ratings are viewable by everyone" on public.user_ratings for select using (true);
create policy "Users can upsert own ratings" on public.user_ratings for all using (auth.uid() = user_id);

-- Enable realtime for comments
alter publication supabase_realtime add table public.comments;
```

## 3. Set environment variables

In Vercel dashboard → Settings → Environment Variables:
- `VITE_SUPABASE_URL` = your project URL (e.g. https://xxxx.supabase.co)
- `VITE_SUPABASE_ANON_KEY` = your anon/public key

For local dev, copy `.env.example` to `.env.local` and fill in values.

## 4. Deploy to Vercel

```bash
npx vercel
```

Done!