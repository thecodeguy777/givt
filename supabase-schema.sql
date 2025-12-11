-- Givt Database Schema for Supabase
-- Run this in Supabase SQL Editor to set up your database

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '🎁',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parties (gift exchange events)
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  budget DECIMAL(10,2),
  join_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  draw_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Party memberships (many-to-many: users <-> parties)
CREATE TABLE IF NOT EXISTS party_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  has_drawn BOOLEAN DEFAULT FALSE,
  assigned_to UUID REFERENCES profiles(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(party_id, user_id)
);

-- Wishlist items with product data
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'PHP',
  source TEXT CHECK (source IN ('lazada', 'shopee', 'manual')),
  notes TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_by UUID REFERENCES profiles(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view any profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Parties policies
CREATE POLICY "Anyone can view parties by join code" ON parties
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create parties" ON parties
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update own party" ON parties
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Creator can delete own party" ON parties
  FOR DELETE USING (auth.uid() = created_by);

-- Party members policies
CREATE POLICY "Members can view party members" ON party_members
  FOR SELECT USING (
    party_id IN (SELECT party_id FROM party_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can join parties" ON party_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own membership" ON party_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave parties" ON party_members
  FOR DELETE USING (auth.uid() = user_id);

-- Wishlist policies
CREATE POLICY "Users can manage own wishlist" ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Members can view wishlists in their party" ON wishlist_items
  FOR SELECT USING (
    party_id IN (SELECT party_id FROM party_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can mark items as purchased" ON wishlist_items
  FOR UPDATE USING (
    party_id IN (SELECT party_id FROM party_members WHERE user_id = auth.uid())
  );

-- Function to perform party draw (Fisher-Yates shuffle for circular assignment)
CREATE OR REPLACE FUNCTION perform_party_draw(p_party_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  member_ids UUID[];
  shuffled UUID[];
  i INTEGER;
  j INTEGER;
  temp UUID;
BEGIN
  -- Get all member user_ids
  SELECT array_agg(user_id ORDER BY random()) INTO member_ids
  FROM party_members WHERE party_id = p_party_id;

  -- Need at least 3 members
  IF array_length(member_ids, 1) < 3 THEN
    RAISE EXCEPTION 'Need at least 3 members to perform draw';
  END IF;

  -- Create shuffled copy
  shuffled := member_ids;

  -- Fisher-Yates shuffle
  FOR i IN REVERSE array_length(shuffled, 1)..2 LOOP
    j := floor(random() * i + 1)::INTEGER;
    temp := shuffled[i];
    shuffled[i] := shuffled[j];
    shuffled[j] := temp;
  END LOOP;

  -- Assign: each person at index i gifts to person at index (i mod length) + 1
  -- This creates a circular chain where everyone gives to someone different
  FOR i IN 1..array_length(member_ids, 1) LOOP
    UPDATE party_members
    SET assigned_to = shuffled[(i % array_length(shuffled, 1)) + 1]
    WHERE party_id = p_party_id AND user_id = member_ids[i];
  END LOOP;

  -- Mark party draw complete
  UPDATE parties SET draw_complete = TRUE WHERE id = p_party_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, avatar_emoji)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    '🎁'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_party_members_party_id ON party_members(party_id);
CREATE INDEX IF NOT EXISTS idx_party_members_user_id ON party_members(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_party_id ON wishlist_items(party_id);
CREATE INDEX IF NOT EXISTS idx_parties_join_code ON parties(join_code);
