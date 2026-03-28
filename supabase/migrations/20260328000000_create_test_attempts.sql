CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topics TEXT[],
  difficulty TEXT,
  num_questions INTEGER,
  question_type TEXT,
  questions JSONB,
  answers JSONB,
  analysis JSONB,
  report JSONB,
  score NUMERIC,
  total_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON test_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON test_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
