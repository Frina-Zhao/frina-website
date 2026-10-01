# Frina 网站部署到 Cloudflare Pages 指南

> 跟着走大概 30-40 分钟能搞定，主要是 Cloudflare 账号注册 + GitHub 推代码 + 绑定资源。

---

## 📦 你要准备的东西

1. 一个 **GitHub 账号**（用来存代码、触发自动部署）
2. 一个 **Cloudflare 账号**（免费的，https://dash.cloudflare.com/sign-up ）
3. 你的网站代码（这个 workspace）

---

## 第 1 步 · 注册 Cloudflare 账号

1. 打开 https://dash.cloudflare.com/sign-up
2. 邮箱 + 密码注册（不需要绑卡）
4. 选 Free 套餐

---

## 第 2 步 · 创建 D1 数据库

1. Cloudflare 控制台 → 左侧菜单 **Workers & Pages** → **D1** → **Create database**
2. 名字：`frina-website-db`
3. 位置：**Asia Pacific**（离国内近）
4. 创建后点进数据库 → 顶部 **Console** 标签
5. **打开 `D1-INIT.md`**，按编号复制每条 SQL 到 Console → Execute

> ⚠️ D1 Console 一次只能执行一条 SQL，不要整段 `schema.sql` 粘贴。

---

## 第 3 步 · 创建 R2 存储桶（存照片视频）

1. 左侧菜单 **R2** → **Create bucket**
2. 名字：`frina-website-photos`
3. 位置：**Asia Pacific**

> ✅ **不需要启用 Public Access** — 图片通过 Pages Function `/cdn/*` 代理访问，bucket 保持 private 即可，更安全。

---

## 第 4 步 · 把代码推到 GitHub

### 4.1 新建 GitHub 仓库

1. https://github.com/new
2. Repository name: `frina-website`（或你喜欢的名字）
3. 选 **Public** 或 **Private** 都可以
4. **不要**勾 "Add a README file"
5. 点 Create repository

### 4.2 推送 workspace 到 GitHub

打开 PowerShell，到 workspace 目录：

```powershell
cd C:\Users\徐硕宁\.minimax\sessions\mvs_f8752f8dee48451ab08cc7932ce4a478\workspace

# 第一次推送需要先 git init
git init
git add .
git commit -m "init: frina website + cloud backend"
git branch -M main
git remote add origin https://github.com/你的用户名/frina-website.git
git push -u origin main
```

> 提示：如果之前推过，origin 已存在，用 `git remote set-url origin https://github.com/...` 改地址。

---

## 第 5 步 · 创建 Cloudflare Pages 项目

1. Cloudflare 控制台 → **Workers & Pages** → **Pages** → **Create application** → **Pages: Connect to Git**
2. 选你的 GitHub 仓库 `frina-website`
3. **Project name**: `frina-website`（决定你的默认域名 `frina-website.pages.dev`）
4. **Build command**: 留空（我们没有构建）
5. **Build output directory**: 留空或填 `/`
6. 点 **Save and Deploy**
7. 等 1-2 分钟，第一次部署会成功（但还没接 D1/R2）

---

## 第 6 步 · 绑定 D1 / R2 + 设置密钥

部署成功后，进入项目 → **Functions** 标签：

### 6.1 D1 binding

1. **D1 database bindings** → **Add binding**
3. **Variable name**: `DB`
4. **D1 database**: 选 `frina-website-db`
5. **Save**

### 6.2 R2 binding

1. **R2 bucket bindings** → **Add binding**
2. **Variable name**: `PHOTOS`
3. **R2 bucket**: 选 `frina-website-photos`
4. **Save**

### 6.3 设置环境变量

同页面 → **Environment variables** → **Add variable**：

| Variable name | Value | 必填？ |
|---|---|---|
| `JWT_SECRET` | 随机字符串（用来签 JWT）— 用下面这条命令生成：<br/>`[System.Web.Security.Membership]::GeneratePassword(48, 0)` （PowerShell）<br/>或随便敲一长串 `sK8df93jK2kdjaskdjf2938ujad` 这样的 | ✅ 必填 |
| `PUBLIC_PHOTO_BASE` | 第 3 步拿到的 R2.dev 公开 URL（`<https://pub-xxxx.r2.dev`）| ⭕ 可选 |

> 如果你启用了 R2 Public Development URL，把那个 r2.dev 域名填到这里 —— 图片会走 R2 CDN（不消耗 Pages Function 请求配额），加载更快。
> 如果没填，图片会走 Pages Function `/cdn/*` 代理（默认就行）。

1. **Environment**: 选 **Production**（如果想 Preview 也生效就两个都加）
2. **Save**

### 6.4 重新部署让配置生效

顶部 → **Deployments** → 最新一次 → 右上 **⋯** → **Retry deployment**

---

## 第 7 步 · 首次登录设密码

1. 打开 `https://你的项目.pages.dev/index.html#guestbook`
2. **连续点 5 下左上角的 Logo** → 弹密码框
3. 输入你想设的密码（至少 6 位）→ 进入后台
4. 第一次会自动把这个密码写到 D1 里
5. 之后再次点 logo = 弹密码框 = 输入正确密码 = 进入后台

> 快捷键：`Ctrl+Shift+L` 也能调出登录框 / 退出登录

---

## 🎉 完成！

你现在拥有：

| 功能 | 谁能用 |
|---|---|
| 看网站 | 所有人 |
| 在留言板发留言 | 所有人 |
| 删除留言 | 只有你（管理员） |
| 之后接照片墙编辑、文章 CRUD、视频上传 | 只有你 |

---

## 📝 日常使用流程

**发新留言（别人发的）**：自动全网可见，无需你操作。

**修改网站内容（你自己）**：
1. 打开网站
2. 点 5 下 logo → 输密码 → 进入后台
3. 后续每个页面会陆续加后台编辑工具栏（首页照片墙上传、文章 CRUD 等）
4. 你编辑的所有内容自动全网可见

**退出后台**：再按 `Ctrl+Shift+L`，或顶栏右侧的"退出登录"按钮。

---

## ❓ 常见问题

### 留言提交失败 / 留言显示不出

1. 检查 Functions → D1 binding 是否生效
2. 检查 schema.sql 是否执行成功（控制台 Console 跑 `SELECT * FROM guestbook;` 看是否有种子数据）
3. 浏览器开发者工具 → Console 看具体错误

### 上传图片失败

1. 检查 R2 binding 是否生效（Functions → R2 bucket bindings）
2. 访问 `https://你的项目.pages.dev/cdn/<key>` 看是否能拿到图片
3. 图片不显示时，浏览器 DevTools → Network → 看 `/cdn/...` 状态码

### 想换密码

目前没有改密码的页面，需要去 Cloudflare 控制台：
- D1 → frina-website-db → Console → `DELETE FROM admin_config WHERE key IN ('password_hash', 'password_salt');`
- 下次登录时会重新让你设密码

### 想绑定自己的域名

Pages 项目 → **Custom domains** → **Set up a custom domain** → 输入你的域名 → 按提示改 DNS。

### 想回滚版本

Pages 项目 → **Deployments** → 选历史版本 → **Rollback to this deploy**

---

## 🛠 技术栈说明

- **前端**：纯静态 HTML/CSS/JS，零构建步骤
- **后端**：Cloudflare Pages Functions（基于 Workers，JS ES Modules）
- **数据库**：Cloudflare D1（SQLite 兼容）
- **存储**：Cloudflare R2（S3 兼容，零出口费用）
- **认证**：PBKDF2 密码哈希 + HS256 JWT + SHA-256 会话表
- **种子留言**：5 条温暖留言由 SQL 初始化写入，所有访客都能看到

后续扩展（比如首页照片墙 CRUD、文章 CRUD、视频上传）都走这套架构，无需引入额外依赖。