-- Add target_url, cluster, priority to keywords table
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS target_url TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS cluster TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('high','medium','low'));
