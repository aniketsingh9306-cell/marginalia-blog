const API_BASE = window.MARGINALIA_API_BASE || 'http://localhost:5000/api';

// ---------- Mobile nav ----------
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
});

// ---------- Nav auth state (Log in/Get started vs Profile/Log out) ----------
document.addEventListener('DOMContentLoaded', () => {
  const loggedIn = !!getToken();
  document.querySelectorAll('.nav-guest-item').forEach((el) => {
    el.style.display = loggedIn ? 'none' : '';
  });
  document.querySelectorAll('.nav-user-item').forEach((el) => {
    el.classList.toggle('show', loggedIn);
  });

  const navLogoutBtn = document.getElementById('nav-logout-btn');
  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'login.html';
    });
  }
});

// ---------- Token helpers ----------
function saveSession(token, user) {
  localStorage.setItem('marginalia_token', token);
  localStorage.setItem('marginalia_user', JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem('marginalia_token');
}

function getUser() {
  const raw = localStorage.getItem('marginalia_user');
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem('marginalia_token');
  localStorage.removeItem('marginalia_user');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }
  return data;
}

// ---------- Field validation helpers ----------
function setFieldError(fieldEl, message) {
  const errorEl = fieldEl.querySelector('.error-msg');
  if (message) {
    fieldEl.classList.add('invalid');
    if (errorEl) errorEl.textContent = message;
  } else {
    fieldEl.classList.remove('invalid');
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showBanner(el, message, isError) {
  el.textContent = message;
  el.classList.add('show');
  if (isError) {
    el.style.background = '#b5533c';
  } else {
    el.style.background = '';
  }
}

// ---------- Login form ----------
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    const emailField = document.getElementById('login-email-field');
    const emailInput = document.getElementById('login-email');
    if (!isEmail(emailInput.value.trim())) {
      setFieldError(emailField, 'Enter a valid email address.');
      valid = false;
    } else {
      setFieldError(emailField, null);
    }

    const pwField = document.getElementById('login-password-field');
    const pwInput = document.getElementById('login-password');
    if (pwInput.value.length < 6) {
      setFieldError(pwField, 'Password must be at least 6 characters.');
      valid = false;
    } else {
      setFieldError(pwField, null);
    }

    if (!valid) return;

    const banner = document.getElementById('login-success');
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailInput.value.trim(), password: pwInput.value }),
      });
      saveSession(data.token, data.user);
      showBanner(banner, 'Signed in. Taking you to your dashboard \u2026', false);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 600);
    } catch (err) {
      showBanner(banner, err.message, true);
    }
  });
}

// ---------- Register form ----------
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    const nameField = document.getElementById('reg-name-field');
    const nameInput = document.getElementById('reg-name');
    if (nameInput.value.trim().length < 2) {
      setFieldError(nameField, 'Enter your name.');
      valid = false;
    } else {
      setFieldError(nameField, null);
    }

    const emailField = document.getElementById('reg-email-field');
    const emailInput = document.getElementById('reg-email');
    if (!isEmail(emailInput.value.trim())) {
      setFieldError(emailField, 'Enter a valid email address.');
      valid = false;
    } else {
      setFieldError(emailField, null);
    }

    const pwField = document.getElementById('reg-password-field');
    const pwInput = document.getElementById('reg-password');
    if (pwInput.value.length < 6) {
      setFieldError(pwField, 'Password must be at least 6 characters.');
      valid = false;
    } else {
      setFieldError(pwField, null);
    }

    const confirmField = document.getElementById('reg-confirm-field');
    const confirmInput = document.getElementById('reg-confirm');
    if (confirmInput.value !== pwInput.value || confirmInput.value === '') {
      setFieldError(confirmField, 'Passwords do not match.');
      valid = false;
    } else {
      setFieldError(confirmField, null);
    }

    if (!valid) return;

    const banner = document.getElementById('register-success');
    try {
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: pwInput.value,
        }),
      });
      saveSession(data.token, data.user);
      showBanner(banner, 'Account created. Taking you to your dashboard \u2026', false);
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
    } catch (err) {
      showBanner(banner, err.message, true);
    }
  });
}

// ---------- Dashboard: load real posts, filter, delete ----------
const dashPostTableBody = document.getElementById('dash-post-body');
if (dashPostTableBody) {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = 'login.html';
  } else {
    const greetEl = document.getElementById('dash-greeting');
    if (greetEl) greetEl.textContent = `${user.name}'s notebook`;

    loadDashboard();
  }

  async function loadDashboard(searchTerm) {
    try {
      const query = searchTerm && searchTerm.trim() ? `?search=${encodeURIComponent(searchTerm.trim())}` : '';
      const data = await apiFetch(`/blogs${query}`);
      renderPosts(data.posts);
    } catch (err) {
      dashPostTableBody.innerHTML = `<tr><td colspan="5">Could not load posts: ${err.message}</td></tr>`;
    }
  }

  const searchInput = document.getElementById('dash-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadDashboard(searchInput.value), 300);
    });
  }

  function renderPosts(posts) {
    const totalEl = document.getElementById('stat-total');
    const pubEl = document.getElementById('stat-published');
    const draftEl = document.getElementById('stat-draft');
    const viewsEl = document.getElementById('stat-views');

    const published = posts.filter((p) => p.status === 'published');
    const drafts = posts.filter((p) => p.status === 'draft');
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    if (totalEl) totalEl.textContent = posts.length;
    if (pubEl) pubEl.textContent = published.length;
    if (draftEl) draftEl.textContent = drafts.length;
    if (viewsEl) viewsEl.textContent = totalViews;

    if (posts.length === 0) {
      dashPostTableBody.innerHTML = `<tr><td colspan="5">No posts yet. <a href="create-blog.html">Write your first one</a>.</td></tr>`;
      return;
    }

    dashPostTableBody.innerHTML = posts.map((p) => `
      <tr data-status="${p.status}" data-id="${p._id}">
        <td>
          <div class="p-title"><a href="view-blog.html?id=${p._id}" style="text-decoration:none;color:inherit;">${escapeHtml(p.title)}</a></div>
          <div class="p-excerpt">${escapeHtml(p.body.slice(0, 80))}${p.body.length > 80 ? '\u2026' : ''}</div>
        </td>
        <td><span class="status-pill status-${p.status}">${p.status === 'published' ? 'Published' : 'Draft'}</span></td>
        <td>${new Date(p.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</td>
        <td>${p.views || 0}</td>
        <td class="row-actions">
          <button data-action="view" data-id="${p._id}">View</button>
          <button data-action="edit" data-id="${p._id}">Edit</button>
          <button data-action="delete" data-id="${p._id}">Delete</button>
        </td>
      </tr>
    `).join('');

    dashPostTableBody.querySelectorAll('[data-action="view"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.href = `view-blog.html?id=${btn.dataset.id}`;
      });
    });

    dashPostTableBody.querySelectorAll('[data-action="edit"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.location.href = `create-blog.html?id=${btn.dataset.id}`;
      });
    });

    dashPostTableBody.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          await apiFetch(`/blogs/${id}`, { method: 'DELETE' });
          loadDashboard();
        } catch (err) {
          alert(err.message);
        }
      });
    });

    setupFilterTabs();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setupFilterTabs() {
    const filterTabs = document.querySelectorAll('.filter-tabs button');
    const rows = document.querySelectorAll('#dash-post-body tr[data-status]');
    filterTabs.forEach((tab) => {
      tab.onclick = () => {
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        const status = tab.dataset.status;
        rows.forEach((row) => {
          row.style.display = (status === 'all' || row.dataset.status === status) ? '' : 'none';
        });
      };
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.href = 'login.html';
    });
  }
}

// ---------- Create blog: live preview + word count + real submit ----------
const editorTitle = document.getElementById('post-title');
const editorBody = document.getElementById('post-body');
const editorTag = document.getElementById('post-tag');

if (editorBody) {
  if (!getToken()) {
    window.location.href = 'login.html';
  }

  const previewTitle = document.getElementById('preview-title');
  const previewBody = document.getElementById('preview-body');
  const previewTag = document.getElementById('preview-tag');
    const previewEmpty = document.getElementById('preview-empty');
  const wordCountEl = document.getElementById('word-count');
  const previewAuthor = document.getElementById('preview-author');
  const currentUser = getUser();
  if (previewAuthor && currentUser) previewAuthor.textContent = currentUser.name.toUpperCase();

  function updatePreview() {
    const title = editorTitle.value.trim();
    const body = editorBody.value.trim();
    const tag = editorTag.value.trim();

    if (!title && !body) {
      previewEmpty.style.display = 'block';
      previewTitle.parentElement.style.display = 'none';
    } else {
      previewEmpty.style.display = 'none';
      previewTitle.parentElement.style.display = 'block';
      previewTitle.textContent = title || 'Untitled post';
      previewBody.textContent = body || 'Start writing to see your draft take shape here.';
      previewTag.textContent = tag ? tag.toUpperCase() : 'UNTAGGED';
    }

    const words = body.length ? body.trim().split(/\s+/).length : 0;
    wordCountEl.textContent = words + (words === 1 ? ' word' : ' words');
  }

  [editorTitle, editorBody, editorTag].forEach((el) => el && el.addEventListener('input', updatePreview));
  updatePreview();
}

const createForm = document.getElementById('create-blog-form');
if (createForm) {
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');
  let isEditMode = false;

  const editorEyebrow = document.getElementById('editor-eyebrow');
  const editorHeading = document.getElementById('editor-heading');
  const publishBtn = document.getElementById('publish-btn');
  const draftBtnEl = document.getElementById('save-draft-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');

  async function loadForEdit() {
    try {
      const data = await apiFetch(`/blogs/${editId}`);
      const post = data.post;
      isEditMode = true;

      editorTitle.value = post.title;
      editorTag.value = post.tag === 'Untagged' ? '' : post.tag;
      editorBody.value = post.body;

      if (editorEyebrow) editorEyebrow.textContent = 'Editing entry';
      if (editorHeading) editorHeading.textContent = 'Edit post';
      if (publishBtn) publishBtn.textContent = post.status === 'draft' ? 'Publish post' : 'Save changes';
      if (draftBtnEl) draftBtnEl.textContent = 'Save as draft';
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';

      // Re-run the live preview + word count now that fields are filled.
      editorTitle.dispatchEvent(new Event('input'));
    } catch (err) {
      const banner = document.getElementById('create-success');
      showBanner(banner, `Could not load that post: ${err.message}`, true);
    }
  }

  if (editId) {
    loadForEdit();
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      window.location.href = 'dashboard.html';
    });
  }

  async function submitPost(status) {
    let valid = true;

    const titleField = document.getElementById('post-title-field');
    if (editorTitle.value.trim().length < 3) {
      setFieldError(titleField, 'Give your post a title (3+ characters).');
      valid = false;
    } else {
      setFieldError(titleField, null);
    }

    const bodyField = document.getElementById('post-body-field');
    if (editorBody.value.trim().length < 20) {
      setFieldError(bodyField, 'Write at least a few sentences before publishing.');
      valid = false;
    } else {
      setFieldError(bodyField, null);
    }

    if (!valid) return;

    const banner = document.getElementById('create-success');
    const payload = {
      title: editorTitle.value.trim(),
      tag: editorTag.value.trim(),
      body: editorBody.value.trim(),
      status,
    };

    try {
      if (isEditMode) {
        await apiFetch(`/blogs/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        showBanner(banner, status === 'draft' ? 'Saved as draft. Redirecting \u2026' : 'Changes saved. Redirecting \u2026', false);
      } else {
        await apiFetch('/blogs', { method: 'POST', body: JSON.stringify(payload) });
        showBanner(banner, status === 'draft' ? 'Draft saved. Redirecting \u2026' : 'Post published. Redirecting \u2026', false);
      }
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
    } catch (err) {
      showBanner(banner, err.message, true);
    }
  }

  createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitPost('published');
  });

  const draftBtn = document.getElementById('save-draft-btn');
  if (draftBtn) {
    draftBtn.addEventListener('click', () => submitPost('draft'));
  }
}

// ---------- Home page: load public posts, with search + category filter ----------
const homePostGrid = document.getElementById('home-post-grid');
if (homePostGrid) {
  const homeSearchInput = document.getElementById('home-search');
  const homeTagSelect = document.getElementById('home-tag-filter');
  const homeEmptyState = document.getElementById('home-empty-state');
  let hasRealData = false; // becomes true once we know the backend has published posts

  function renderHomePosts(posts) {
    if (!posts.length) {
      homePostGrid.style.display = 'none';
      if (homeEmptyState) homeEmptyState.style.display = 'block';
      return;
    }
    homePostGrid.style.display = '';
    if (homeEmptyState) homeEmptyState.style.display = 'none';

    homePostGrid.innerHTML = posts.slice(0, 12).map((p) => `
      <a href="view-blog.html?id=${p._id}" style="text-decoration:none;color:inherit;">
        <article class="post-card">
          <span class="tag">${p.tag}</span>
          <h3>${p.title}</h3>
          <p>${p.body.slice(0, 100)}${p.body.length > 100 ? '\u2026' : ''}</p>
          <div class="meta">BY ${p.authorName.toUpperCase()}</div>
        </article>
      </a>
    `).join('');
  }

  async function loadHomePosts() {
    const search = homeSearchInput ? homeSearchInput.value.trim() : '';
    const tag = homeTagSelect ? homeTagSelect.value : 'all';
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (tag && tag !== 'all') qs.set('tag', tag);

    try {
      const data = await apiFetch(`/blogs/public${qs.toString() ? `?${qs.toString()}` : ''}`);
      if (!hasRealData && !data.posts.length && !search && tag === 'all') {
        return; // no posts in the DB yet — keep the static sample cards already in the HTML
      }
      hasRealData = true;
      renderHomePosts(data.posts);
    } catch (err) {
      // backend not running yet — keep static sample content
    }
  }

  async function loadTagOptions() {
    try {
      const data = await apiFetch('/blogs/public/tags');
      if (homeTagSelect && data.tags && data.tags.length) {
        data.tags.forEach((tag) => {
          const opt = document.createElement('option');
          opt.value = tag;
          opt.textContent = tag;
          homeTagSelect.appendChild(opt);
        });
      }
    } catch (err) {
      // ignore — category dropdown just stays at "All categories"
    }
  }

  loadHomePosts();
  loadTagOptions();

  if (homeSearchInput) {
    let debounceTimer;
    homeSearchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadHomePosts, 300);
    });
  }
  if (homeTagSelect) {
    homeTagSelect.addEventListener('change', loadHomePosts);
  }
}

// ---------- Individual blog detail page ----------
const postContentEl = document.getElementById('post-content');
if (postContentEl) {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  function renderPost(p) {
    const dateStr = new Date(p.updatedAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
    postContentEl.innerHTML = `
      <span class="tag">${escapeHtmlSafe(p.tag)}</span>
      <h1>${escapeHtmlSafe(p.title)}</h1>
      <div class="meta">
        <span>BY ${escapeHtmlSafe(p.authorName || '').toUpperCase()}</span>
        <span>${dateStr}</span>
        <span>${p.status === 'draft' ? 'DRAFT' : `${p.views || 0} VIEWS`}</span>
      </div>
      <div class="body-text">${escapeHtmlSafe(p.body)}</div>
    `;
  }

  function escapeHtmlSafe(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  async function loadPost() {
    if (!postId) {
      postContentEl.innerHTML = '<p class="state-msg">No post specified.</p>';
      return;
    }
    // If logged in, try the owner endpoint first (covers drafts too).
    if (getToken()) {
      try {
        const data = await apiFetch(`/blogs/${postId}`);
        renderPost(data.post);
        return;
      } catch (err) {
        // fall through to public endpoint
      }
    }
    try {
      const res = await fetch(`${API_BASE}/blogs/public/${postId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Post not found.');
      renderPost(data.post);
    } catch (err) {
      postContentEl.innerHTML = `<p class="state-msg">${err.message}</p>`;
    }
  }

  loadPost();
}

// ---------- Profile page ----------
const profileContent = document.getElementById('profile-content');
if (profileContent) {
  if (!getToken()) {
    window.location.href = 'login.html';
  } else {
    loadProfile();
  }

  async function loadProfile() {
    try {
      const data = await apiFetch('/auth/me');
      const loadingEl = document.getElementById('profile-loading');
      if (loadingEl) loadingEl.style.display = 'none';
      profileContent.style.display = 'block';

      const avatarEl = document.getElementById('profile-avatar');
      if (avatarEl) avatarEl.textContent = (data.user.name || '?').charAt(0).toUpperCase();

      document.getElementById('meta-name').textContent = data.user.name;
      document.getElementById('meta-email').textContent = data.user.email;
      document.getElementById('meta-joined').textContent = new Date(data.user.joinedAt).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      });
      document.getElementById('profile-total').textContent = data.stats.total;
      document.getElementById('profile-published').textContent = data.stats.published;
      document.getElementById('profile-drafts').textContent = data.stats.drafts;

      const nameInput = document.getElementById('profile-name');
      if (nameInput) nameInput.value = data.user.name;
    } catch (err) {
      const loadingEl = document.getElementById('profile-loading');
      if (loadingEl) loadingEl.textContent = `Could not load your profile: ${err.message}`;
    }
  }

  const nameForm = document.getElementById('name-form');
  if (nameForm) {
    nameForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameField = document.getElementById('name-field');
      const nameInput = document.getElementById('profile-name');
      const banner = document.getElementById('name-success');

      if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
        setFieldError(nameField, 'Name must be at least 2 characters.');
        return;
      }
      setFieldError(nameField, null);

      try {
        const data = await apiFetch('/auth/me', {
          method: 'PUT',
          body: JSON.stringify({ name: nameInput.value.trim() }),
        });
        saveSession(data.token, data.user);
        document.getElementById('meta-name').textContent = data.user.name;
        const avatarEl = document.getElementById('profile-avatar');
        if (avatarEl) avatarEl.textContent = (data.user.name || '?').charAt(0).toUpperCase();
        showBanner(banner, 'Name updated.', false);
      } catch (err) {
        showBanner(banner, err.message, true);
      }
    });
  }

  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const currentField = document.getElementById('current-password-field');
      const currentInput = document.getElementById('current-password');
      if (!currentInput.value) {
        setFieldError(currentField, 'Enter your current password.');
        valid = false;
      } else {
        setFieldError(currentField, null);
      }

      const newField = document.getElementById('new-password-field');
      const newInput = document.getElementById('new-password');
      if (newInput.value.length < 6) {
        setFieldError(newField, 'New password must be at least 6 characters.');
        valid = false;
      } else {
        setFieldError(newField, null);
      }

      if (!valid) return;

      const banner = document.getElementById('password-success');
      try {
        await apiFetch('/auth/me', {
          method: 'PUT',
          body: JSON.stringify({
            currentPassword: currentInput.value,
            newPassword: newInput.value,
          }),
        });
        showBanner(banner, 'Password updated.', false);
        currentInput.value = '';
        newInput.value = '';
      } catch (err) {
        showBanner(banner, err.message, true);
      }
    });
  }

  const logoutBtnProfile = document.getElementById('logout-btn-profile');
  if (logoutBtnProfile) {
    logoutBtnProfile.addEventListener('click', () => {
      clearSession();
      window.location.href = 'login.html';
    });
  }
}
