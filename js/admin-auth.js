// 管理员认证 UI：长按 logo 5 次 / 点击隐藏按钮 → 弹密码框 → 调 /api/login
// 进入管理员模式后，全局 body 加 .is-admin，CSS 可据此显示工具栏
(function () {
  const PRESS_KEY = 'frina_admin_unlocked';
  let unlockProgress = 0;
  let unlockTimer = null;

  // ============= 登录弹窗 =============
  function showModal() {
    if (document.getElementById('fbAdminModal')) return;

    const wrap = document.createElement('div');
    wrap.id = 'fbAdminModal';
    wrap.className = 'fb-modal-backdrop';
    wrap.innerHTML = `
      <div class="fb-modal" role="dialog" aria-label="管理员登录">
        <div class="fb-modal-head">
          <span class="fb-modal-title">🔐 管理员登录</span>
          <button class="fb-modal-close" type="button" aria-label="关闭">×</button>
        </div>
        <div class="fb-modal-body">
          <p class="fb-modal-hint">输入管理员密码进入编辑后台</p>
          <input type="password" class="fb-modal-input" id="fbAdminPwd"
                 placeholder="管理员密码" autocomplete="current-password" />
          <div class="fb-modal-msg" id="fbAdminMsg"></div>
        </div>
        <div class="fb-modal-foot">
          <button class="fb-modal-btn fb-modal-btn-ghost" type="button" data-act="cancel">取消</button>
          <button class="fb-modal-btn fb-modal-btn-primary" type="button" data-act="login">进入后台</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);

    const pwd = wrap.querySelector('#fbAdminPwd');
    const msg = wrap.querySelector('#fbAdminMsg');
    const close = () => {
      wrap.classList.add('fb-modal-leave');
      setTimeout(() => wrap.remove(), 180);
    };

    wrap.querySelector('.fb-modal-close').addEventListener('click', close);
    wrap.querySelector('[data-act="cancel"]').addEventListener('click', close);
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) close();
    });

    async function doLogin() {
      const password = pwd.value;
      if (!password) {
        msg.textContent = '请输入密码';
        msg.className = 'fb-modal-msg fb-modal-msg-err';
        return;
      }
      msg.textContent = '正在登录…';
      msg.className = 'fb-modal-msg';
      try {
        await window.FB.auth.login(password);
        msg.textContent = '✓ 登录成功';
        msg.className = 'fb-modal-msg fb-modal-msg-ok';
        document.body.classList.add('is-admin');
        try { sessionStorage.setItem(PRESS_KEY, '1'); } catch {}
        setTimeout(close, 600);
        document.dispatchEvent(new CustomEvent('fb:admin-login'));
      } catch (e) {
        msg.textContent = '✗ ' + (e.message || '登录失败');
        msg.className = 'fb-modal-msg fb-modal-msg-err';
      }
    }

    wrap.querySelector('[data-act="login"]').addEventListener('click', doLogin);
    pwd.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doLogin();
    });

    setTimeout(() => pwd.focus(), 50);
  }

  // ============= 解锁手势：长按 logo 5 次 =============
  function bindLogoUnlock() {
    const logo =
      document.querySelector('header .logo, .logo, [data-fb-logo]') ||
      document.querySelector('header');

    if (!logo) return;
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', (e) => {
      // 已经登录就不响应
      if (window.FB && window.FB.auth && window.FB.auth.isAdmin()) return;
      unlockProgress += 1;
      clearTimeout(unlockTimer);
      unlockTimer = setTimeout(() => (unlockProgress = 0), 1800);
      if (unlockProgress >= 5) {
        unlockProgress = 0;
        showModal();
      }
    });
  }

  // ============= 初始化 =============
  function init() {
    // 已登录 → 还原 is-admin 类
    if (window.FB && window.FB.auth && window.FB.auth.isAdmin()) {
      document.body.classList.add('is-admin');
    }

    bindLogoUnlock();

    // 全局快捷键：Ctrl+Shift+L 切焦点
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        if (window.FB && window.FB.auth && window.FB.auth.isAdmin()) {
          window.FB.auth.logout().then(() => {
            document.body.classList.remove('is-admin');
            document.dispatchEvent(new CustomEvent('fb:admin-logout'));
            alert('已退出管理员');
            location.reload();
          });
        } else {
          showModal();
        }
      }
    });
  }

  window.FBAdminAuth = { show: showModal, init };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();