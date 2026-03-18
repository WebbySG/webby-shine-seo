-- Reset Demo Data Script
-- Clears all data and re-runs seed
-- Usage: psql -h localhost -U postgres -d webby_seo -f backend/db/reset-demo.sql

-- Clear in dependency order
TRUNCATE TABLE weekly_action_items CASCADE;
TRUNCATE TABLE weekly_action_plans CASCADE;
TRUNCATE TABLE cross_channel_recommendations CASCADE;
TRUNCATE TABLE marketing_priorities CASCADE;
TRUNCATE TABLE marketing_goals CASCADE;
TRUNCATE TABLE crm_activities CASCADE;
TRUNCATE TABLE crm_deals CASCADE;
TRUNCATE TABLE crm_contacts CASCADE;
TRUNCATE TABLE lead_capture_events CASCADE;
TRUNCATE TABLE attribution_records CASCADE;
TRUNCATE TABLE crm_insights CASCADE;
TRUNCATE TABLE asset_performance_snapshots CASCADE;
TRUNCATE TABLE keyword_performance_snapshots CASCADE;
TRUNCATE TABLE page_performance_snapshots CASCADE;
TRUNCATE TABLE gbp_qna_items CASCADE;
TRUNCATE TABLE gbp_review_items CASCADE;
TRUNCATE TABLE gbp_post_drafts CASCADE;
TRUNCATE TABLE gbp_connections CASCADE;
TRUNCATE TABLE video_assets CASCADE;
TRUNCATE TABLE social_posts CASCADE;
TRUNCATE TABLE seo_articles CASCADE;
TRUNCATE TABLE seo_briefs CASCADE;
TRUNCATE TABLE audit_issues CASCADE;
TRUNCATE TABLE audit_runs CASCADE;
TRUNCATE TABLE rank_snapshots CASCADE;
TRUNCATE TABLE competitors CASCADE;
TRUNCATE TABLE keywords CASCADE;
TRUNCATE TABLE clients CASCADE;
TRUNCATE TABLE workspace_branding CASCADE;
TRUNCATE TABLE user_permissions CASCADE;
TRUNCATE TABLE user_roles CASCADE;
TRUNCATE TABLE invites CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE workspaces CASCADE;

-- Re-run demo seed (paste 031_demo_seed.sql content or use \i)
\echo 'All demo data cleared. Run 031_demo_seed.sql to re-seed.'
