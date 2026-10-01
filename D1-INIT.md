# D1 数据库初始化（逐条执行）

> **Cloudflare D1 Console 一次只能执行一条 SQL**。
> 按下面顺序复制每条 SQL 到 Console，**Execute 一次**就行。

---

## 第 1 条 · 留言板表

```sql
CREATE TABLE IF NOT EXISTS guestbook (id TEXT PRIMARY KEY, author TEXT NOT NULL, avatar_hash TEXT NOT NULL, message TEXT NOT NULL, created_at INTEGER NOT NULL);
```

## 第 2 条 · 留言板索引

```sql
CREATE INDEX IF NOT EXISTS idx_guestbook_created ON guestbook(created_at DESC);
```

## 第 3 条 · 文章表

```sql
CREATE TABLE IF NOT EXISTS articles (id TEXT PRIMARY KEY, type TEXT NOT NULL, category TEXT, body TEXT NOT NULL DEFAULT '', title TEXT NOT NULL, cover_url TEXT, photo_urls TEXT, sort_order INTEGER DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
```

## 第 4 条 · 文章索引

```sql
CREATE INDEX IF NOT EXISTS idx_articles_type ON articles(type, created_at DESC);
```

## 第 5 条 · 最近沉迷卡片表

```sql
CREATE TABLE IF NOT EXISTS features (id TEXT PRIMARY KEY, icon TEXT NOT NULL, title TEXT NOT NULL, description TEXT, sort_order INTEGER DEFAULT 0, created_at INTEGER NOT NULL);
```

## 第 6 条 · 最近沉迷索引

```sql
CREATE INDEX IF NOT EXISTS idx_features_sort ON features(sort_order, created_at DESC);
```

## 第 7 条 · 照片表

```sql
CREATE TABLE IF NOT EXISTS photos (id TEXT PRIMARY KEY, group_name TEXT NOT NULL, url TEXT NOT NULL, caption TEXT, sort_order INTEGER DEFAULT 0, created_at INTEGER NOT NULL);
```

## 第 8 条 · 照片索引

```sql
CREATE INDEX IF NOT EXISTS idx_photos_group ON photos(group_name, sort_order, created_at DESC);
```

## 第 9 条 · 个人头像表（单值）

```sql
CREATE TABLE IF NOT EXISTS profile_photo (id INTEGER PRIMARY KEY DEFAULT 1, url TEXT NOT NULL, updated_at INTEGER NOT NULL);
```

## 第 10 条 · 管理员会话表

```sql
CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
```

## 第 11 条 · 会话索引

```sql
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);
```

## 第 12 条 · 管理员配置表

```sql
CREATE TABLE IF NOT EXISTS admin_config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

## 第 13 条 · 初始化空密码（首次登录会自动设置）

```sql
INSERT OR IGNORE INTO admin_config (key, value) VALUES ('password_hash', '');
```

## 第 14 条 · 初始化空密码 salt

```sql
INSERT OR IGNORE INTO admin_config (key, value) VALUES ('password_salt', '');
```

## 第 15 条 · 种子留言 · 小米

```sql
INSERT OR IGNORE INTO guestbook (id, author, avatar_hash, message, created_at) VALUES ('gb_seed_01', '小米', 'frina', '看到 sonder 突然心里咯噔一下 —— 我也是茫茫人海里的那个陌生路人呀。希望你今天也在被这个世界温柔对待 ♡', 1734115200);
```

## 第 16 条 · 种子留言 · 匿名

```sql
INSERT OR IGNORE INTO guestbook (id, author, avatar_hash, message, created_at) VALUES ('gb_seed_02', '匿名', 'frina', '今天的照片墙好治愈 ✿ 看到你把它做出来好开心', 1735507200);
```

## 第 17 条 · 种子留言 · 阿泽

```sql
INSERT OR IGNORE INTO guestbook (id, author, avatar_hash, message, created_at) VALUES ('gb_seed_03', '阿泽', 'frina', '你的 website 真的好像一本手帐，看着看着就忘了自己在刷手机。', 1736467200);
```

## 第 18 条 · 种子留言 · 小满

```sql
INSERT OR IGNORE INTO guestbook (id, author, avatar_hash, message, created_at) VALUES ('gb_seed_04', '小满', 'frina', '蹲到一份真诚的日记，比什么数据都珍贵。继续写下去 ✿', 1737168000);
```

## 第 19 条 · 种子留言 · 邻居小 L

```sql
INSERT OR IGNORE INTO guestbook (id, author, avatar_hash, message, created_at) VALUES ('gb_seed_05', '邻居小 L', 'frina', '路过看看，希望你每天都开开心心的。', 1737438000);
```

---

## ✅ 验证

跑完最后一条后，执行这条确认：

```sql
SELECT count(*) AS total FROM guestbook;
```

应该返回 `total = 5`。

---

## 💡 不想一条一条敲？

有 Node.js 的话（你本地或 cloud shell）：

```bash
# 安装 wrangler
npm install -g wrangler

# 登录
wrangler login

# 用合并的 schema.sql 一键跑（schema.sql 已存在，文件名带分号即可）
wrangler d1 execute frina-website-db --file=schema.sql --remote
```

但 Console 一条一条复制也行，只是要跑 19 次。