// Frina 网站统一后端 API 客户端
// 用法：window.FB.api.guestbook.list() / .create(msg) / .delete(id)
//      window.FB.api.articles.list({type, category}) / .get(id) / .create(...) / .update(id, ...) / .delete(id)
//      window.FB.api.features.list() / .create(...) / .update(id, ...) / .delete(id)
//      window.FB.api.photos.list({group}) / .create(...) / .delete(id)
//      window.FB.api.profilePhoto.get() / .set(url)
//      window.FB.api.upload(file, type)
//      window.FB.auth.login(password) / .logout() / .isAdmin() / .token() / .showLoginModal()

(function () {
  const TOKEN_KEY = 'frina_admin_token';
  const EXPIRES_KEY = 'frina_admin_expires';

  const token = () => localStorage.getItem(TOKEN_KEY);
  const expires = () => parseInt(localStorage.getItem(EXPIRES_KEY) || '0', 10);
  const isAdmin = () => {
    const t = token();
    if (!t) return false;
    if (expires() && expires() < Date.now() / 1000) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_KEY);
      return false;
    }
    return true;
  };

  async function request(path, opts = {}) {
    const headers = { ...(opts.headers || {}) };
    if (opts.body && !(opts.body instanceof FormData) && typeof opts.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    if (isAdmin()) headers['Authorization'] = 'Bearer ' + token();

    const r = await fetch(path, { ...opts, headers });
    const ct = r.headers.get('Content-Type') || '';
    const data = ct.includes('json') ? await r.json() : await r.text();
    if (!r.ok) {
      const msg = (data && data.error) || ('HTTP ' + r.status);
      const e = new Error(msg);
      e.status = r.status;
      throw e;
    }
    return data;
  }

  const api = {
    guestbook: {
      list: () => request('/api/guestbook'),
      create: ({ author, message, avatarHash }) =>
        request('/api/guestbook', {
          method: 'POST',
          body: { author, message, avatarHash },
        }),
      delete: (id) =>
        request('/api/guestbook?id=' + encodeURIComponent(id), { method: 'DELETE' }),
    },
    articles: {
      list: (params = {}) => {
        const q = new URLSearchParams();
        if (params.type) q.set('type', params.type);
        if (params.category) q.set('category', params.category);
        const qs = q.toString();
        return request('/api/articles' + (qs ? '?' + qs : ''));
      },
      get: (id) => request('/api/articles/' + encodeURIComponent(id)),
      create: (data) => request('/api/articles', { method: 'POST', body: data }),
      update: (id, data) =>
        request('/api/articles/' + encodeURIComponent(id), { method: 'PUT', body: data }),
      delete: (id) =>
        request('/api/articles/' + encodeURIComponent(id), { method: 'DELETE' }),
    },
    features: {
      list: () => request('/api/features'),
      create: (data) => request('/api/features', { method: 'POST', body: data }),
      update: (id, data) =>
        request('/api/features?id=' + encodeURIComponent(id), {
          method: 'PUT',
          body: data,
        }),
      delete: (id) =>
        request('/api/features?id=' + encodeURIComponent(id), { method: 'DELETE' }),
    },
    photos: {
      list: (params = {}) => {
        const qs = params.group ? '?group=' + params.group : '';
        return request('/api/photos' + qs);
      },
      create: (data) => request('/api/photos', { method: 'POST', body: data }),
      delete: (id) =>
        request('/api/photos?id=' + encodeURIComponent(id), { method: 'DELETE' }),
    },
    profilePhoto: {
      get: () => request('/api/profile-photo'),
      set: (url) => request('/api/profile-photo', { method: 'PUT', body: { url } }),
    },
    upload: async (file, type) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', type);
      return request('/api/upload', { method: 'POST', body: fd });
    },
  };

  const auth = {
    isAdmin,
    token,
    expires,
    async login(password) {
      const r = await request('/api/login', {
        method: 'POST',
        body: { password },
      });
      localStorage.setItem(TOKEN_KEY, r.token);
      localStorage.setItem(EXPIRES_KEY, String(Math.floor(Date.now() / 1000) + 30));
      return r;
    },
    async logout() {
      try {
        await request('/api/logout', { method: 'POST' });
      } catch (e) {
        // 即使后端失败也清本地
      }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_KEY);
    },
    showLoginModal() {
      // 由 admin-auth.js 实现
      return window.FBAdminAuth && window.FBAdminAuth.show();
    },
  };

  window.FB = window.FB || {};
  window.FB.api = api;
  window.FB.auth = auth;
})();