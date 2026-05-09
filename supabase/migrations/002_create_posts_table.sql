-- Create posts table for blog
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on published_at for efficient queries
CREATE INDEX IF NOT EXISTS posts_published_at_idx ON posts (published_at DESC);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS posts_category_idx ON posts (category);

-- Enable Row Level Security (RLS)
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public reads
CREATE POLICY "Allow public to read posts" ON posts FOR SELECT USING (true);

-- Create policy to allow authenticated users to manage posts
CREATE POLICY "Allow authenticated users to manage posts" ON posts FOR ALL USING (auth.role() = 'authenticated');