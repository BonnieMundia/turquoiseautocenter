-- Create enquiries table
CREATE TABLE IF NOT EXISTS enquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  service TEXT NOT NULL,
  vehicle TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed', 'cancelled'))
);

-- Create index on created_at for efficient queries
CREATE INDEX IF NOT EXISTS enquiries_created_at_idx ON enquiries (created_at DESC);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS enquiries_status_idx ON enquiries (status);

-- Enable Row Level Security (RLS)
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts (for the edge function)
CREATE POLICY "Allow inserts for enquiries" ON enquiries FOR INSERT WITH CHECK (true);

-- Create policy to allow authenticated users to read enquiries
CREATE POLICY "Allow authenticated users to read enquiries" ON enquiries FOR SELECT USING (auth.role() = 'authenticated');