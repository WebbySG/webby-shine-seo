-- video_assets table — stores AI-generated video scripts and rendered videos
CREATE TABLE video_assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  article_id      UUID REFERENCES seo_articles(id) ON DELETE SET NULL,
  social_post_id  UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('tiktok','instagram_reels','facebook_reels','youtube_shorts')),
  video_script    TEXT NOT NULL DEFAULT '',
  scene_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  caption_text    TEXT NOT NULL DEFAULT '',
  avatar_type     TEXT NOT NULL DEFAULT 'professional',
  voice_type      TEXT NOT NULL DEFAULT 'friendly',
  video_url       TEXT,
  thumbnail_url   TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','rendering','review','approved','published')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_video_assets_client ON video_assets (client_id, status);
CREATE INDEX idx_video_assets_article ON video_assets (article_id);
