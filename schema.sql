-- ============================================================
-- Frina 个人网站 · Cloudflare D1 数据库结构
-- 在 Cloudflare Dashboard → D1 → 控制台 粘贴执行即可
-- ============================================================

-- 留言板（访客可发，仅管理员可删）
CREATE TABLE IF NOT EXISTS guestbook (
  id          TEXT PRIMARY KEY,
  author      TEXT NOT NULL,
  avatar_hash TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_guestbook_created
  ON guestbook(created_at DESC);

-- 文章（study / life / hobby / couple_log 通用）
CREATE TABLE IF NOT EXISTS articles (
  id         TEXT PRIMARY KEY,
  type       TEXT NOT NULL,            -- study / life / hobby / couple_log
  category   TEXT,                     -- 阅读与写作 / 音乐与绘画 / ...
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,            -- markdown
  cover_url  TEXT,
  photo_urls TEXT,                     -- JSON 数组字符串
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articles_type
  ON articles(type, created_at DESC);

-- 最近沉迷（兴趣爱好页卡片 CRUD）
CREATE TABLE IF NOT EXISTS features (
  id          TEXT PRIMARY KEY,
  icon        TEXT NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_features_sort
  ON features(sort_order, created_at DESC);

-- 照片（首页墙 / 情侣照 / 头像等）
CREATE TABLE IF NOT EXISTS photos (
  id         TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,            -- index / couple
  url        TEXT NOT NULL,
  caption    TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_photos_group
  ON photos(group_name, sort_order, created_at DESC);

-- 个人头像（单值）
CREATE TABLE IF NOT EXISTS profile_photo (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  url        TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 管理员 JWT 会话表
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,         -- JWT 的 SHA-256
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires
  ON admin_sessions(expires_at);

-- 管理员配置（密码哈希存这里）
CREATE TABLE IF NOT EXISTS admin_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ============================================================
-- 初始化：插入空密码（首次部署后用 /api/login 设置）
-- ============================================================
INSERT OR IGNORE INTO admin_config (key, value)
VALUES ('password_hash', ''), ('password_salt', '');

-- ============================================================
-- 种子留言（5 条 — 首次部署即对所有访客可见）
-- 时间戳：北京时间 2024 年 12 月的不同日期（offset 真实"现在"较远）
-- ============================================================
INSERT OR IGNORE INTO guestbook (id, author, avatar_hash, message, created_at) VALUES
  ('gb_seed_01', '小米', 'frina', '看到 sonder 突然心里咯噔一下 —— 我也是茫茫人海里的那个陌生路人呀。希望你今天也在被这个世界温柔对待 ♡', 1734115200),
  ('gb_seed_02', '匿名', 'frina', '今天的照片墙好治愈 ✿ 看到你把它做出来好开心', 1735507200),
  ('gb_seed_03', '阿泽', 'frina', '你的 website 真的好像一本手帐，看着看着就忘了自己在刷手机。', 1736467200),
  ('gb_seed_04', '小满', 'frina', '蹲到一份真诚的日记，比什么数据都珍贵。继续写下去 ✿', 1737168000),
  ('gb_seed_05', '邻居小 L', 'frina', '路过看看，希望你每天都开开心心的。', 1737438000);