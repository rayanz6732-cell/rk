# Supabase Setup Guide

## 1. Create a Supabase project
Go to https://supabase.com and create a free project.

## 2. Add environment variables
Create a `.env` file in the project root (or set in Vercel dashboard):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run this SQL in the Supabase SQL Editor

```sql
-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT,
  bio TEXT,
  location TEXT,
  favorite_anime TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  theme TEXT DEFAULT 'default',
  role TEXT DEFAULT 'user',
  watch_streak INT DEFAULT 0,
  last_watched_date TEXT,
  total_episodes_watched INT DEFAULT 0,
  total_watch_minutes INT DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  anime_id TEXT NOT NULL,
  episode TEXT,
  text TEXT NOT NULL,
  author_name TEXT DEFAULT 'Anonymous',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User ratings table
CREATE TABLE user_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mal_id TEXT NOT NULL,
  anime_title TEXT,
  rating INT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update only their own
CREATE POLICY "Public profiles readable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Comments: anyone can read, authenticated users can insert
CREATE POLICY "Comments readable" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ratings: users manage their own
CREATE POLICY "Ratings readable" ON user_ratings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert ratings" ON user_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update ratings" ON user_ratings FOR UPDATE USING (auth.uid() = user_id);

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

## 4. Deploy to Vercel
- Connect your GitHub repo to Vercel
- Add the env vars above in Vercel dashboard
- The `/api/stream` and `/api/episodes` routes will auto-deploy as serverless functions

## 5. Auth Setup in Supabase
- Go to Authentication → Settings
- Set Site URL to your Vercel domain
- Enable "Magic Link" (email OTP) — it's on by default
``