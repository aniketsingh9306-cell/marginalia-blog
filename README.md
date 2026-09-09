# 📝 Marginalia — A Full-Stack Blog Application

Marginalia is a full-stack blogging platform built as a step-by-step learning project — from a static frontend to a database-backed, authenticated, deployable web app.

> "A quiet place to draft, not perform."

---

## ✨ Features

- **Authentication** — register, log in, and stay signed in with JWT
- **Protected routes** — Dashboard, Write, and Profile pages require login, both on the frontend (redirects) and backend (JWT-checked API routes)
- **Full CRUD** — create, read, update, and delete blog posts
- **Drafts & publishing** — save a post as a draft or publish it immediately
- **Search & filters** — search posts by keyword, filter by category (tag), or by status (draft/published) in your dashboard
- **Individual post pages** — every post has its own shareable page, with a live view counter
- **User profile** — see your post stats, update your name, or change your password
- **Responsive design** — works on desktop, tablet, and mobile
- **Real database** — MongoDB via Mongoose, not flat files

## 🧱 Tech stack

| Layer      | Technology                          |
|------------|---------------------------------------|
| Frontend   | HTML, CSS, vanilla JavaScript          |
| Backend    | Node.js, Express                       |
| Database   | MongoDB (Mongoose)                     |
| Auth       | JWT (jsonwebtoken) + bcrypt password hashing |
| Deployment | Everything on **Vercel** (frontend static + backend serverless API), one project |

## 📁 Project structure

```
marginalia/
├── backend/
│   ├── app.js                  # Express app (routes, middleware) — no listener here
│   ├── server.js                # local dev only: runs app.js with app.listen()
│   ├── api/
│   │   └── index.js             # Vercel serverless entry point — wraps app.js
│   ├── config/
│   │   └── db.js               # MongoDB connection (cached for serverless reuse)
│   ├── models/
│   │   ├── User.js
│   │   └── Blog.js
│   ├── routes/
│   │   ├── auth.js             # register, login, profile (get/update)
│   │   └── blogs.js            # create, list, search, view, update, delete
│   ├── middleware/
│   │   └── auth.js             # JWT verification
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html              # Home — published posts, search, category filter
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html          # your posts — search, filter, edit, delete
│   ├── create-blog.html        # write & edit posts, live preview
│   ├── view-blog.html          # individual post page
│   ├── profile.html            # account details, stats, name/password update
│   ├── css/style.css
│   └── js/
│       ├── config.js           # API base URL — auto-detects local vs deployed
│       └── app.js
├── vercel.json                  # deploys frontend (static) + backend (serverless) together
├── render.yaml                  # optional — deploy backend separately on Render instead
└── netlify.toml                 # optional — deploy frontend separately on Netlify instead
```

## 🚀 Getting started locally

### 1. Set up MongoDB (free, cloud-hosted)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free **M0** cluster
3. Under **Database Access**, add a database user + password
4. Under **Network Access**, allow access from anywhere (fine for learning)
5. Click **Connect → Drivers**, copy the connection string, and add `/marginalia` before the `?`:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/marginalia?retryWrites=true&w=majority
   ```

### 2. Start the backend

```bash
cd backend
npm install
cp .env.example .env    # Windows: copy .env.example .env
```

Open `.env` and fill in your real `MONGO_URI` and a random `JWT_SECRET`. Then:

```bash
npm start
```

You should see:
```
Connected to MongoDB.
Marginalia backend running on http://localhost:5000
```

### 3. Open the frontend

No build step — just open `frontend/index.html` in your browser, or serve the folder with a static server (e.g. VS Code's "Live Server" extension).

Try the full flow: **Register → Write a post → Dashboard → Edit/Delete → Profile → Log out.**

## 🌍 Deploying to production (everything on Vercel)

This project deploys as **one Vercel project**: the `frontend/` folder is served as static files, and `backend/api/index.js` runs as a serverless function that handles every `/api/*` request. Same domain, so there's no CORS setup to worry about.

1. Push this repo to GitHub (if you haven't already)
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import your `marginalia` repo
3. Vercel will detect `vercel.json` at the root automatically — leave the root directory as the repo root (don't set it to `frontend` or `backend`)
4. Before deploying, add **Environment Variables**:
   - `MONGO_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — any random string
5. Click **Deploy** — you'll get a live URL like `https://marginalia-xyz.vercel.app`

That's it — `frontend/js/config.js` automatically detects it's running on a live domain (not `localhost`) and calls the API at a relative `/api` path, so no manual URL editing is needed.

### Alternative: separate hosts (Render + Netlify)

If you'd rather host the backend and frontend on different platforms, `render.yaml` (backend on Render) and `netlify.toml` (frontend on Netlify) are still included and work independently — you'd just need to manually set `window.MARGINALIA_API_BASE` in `frontend/js/config.js` to your Render backend's URL, and set `FRONTEND_URL` in Render's environment variables to your Netlify URL.

## 📡 API reference

| Method | Route                    | Auth | Description                                    |
|--------|---------------------------|:----:|--------------------------------------------------|
| POST   | `/api/auth/register`      | No   | Create an account, returns a JWT                 |
| POST   | `/api/auth/login`         | No   | Log in, returns a JWT                             |
| GET    | `/api/auth/me`            | Yes  | Get your profile + post stats                     |
| PUT    | `/api/auth/me`            | Yes  | Update your name and/or password                  |
| POST   | `/api/blogs`               | Yes  | Create a post                                       |
| GET    | `/api/blogs`               | Yes  | List your own posts (supports `?search=` `?status=` `?tag=`) |
| GET    | `/api/blogs/public`        | No   | List published posts (supports `?search=` `?tag=`) |
| GET    | `/api/blogs/public/tags`   | No   | List distinct categories/tags in use               |
| GET    | `/api/blogs/public/:id`    | No   | View a single published post (increments views)   |
| GET    | `/api/blogs/:id`           | Yes  | Get one of your own posts (draft or published)     |
| PUT    | `/api/blogs/:id`           | Yes  | Update one of your posts                           |
| DELETE | `/api/blogs/:id`           | Yes  | Delete one of your posts                           |

## 🔒 Security notes

- Passwords are hashed with bcrypt — never stored in plain text
- JWTs are stored in `localStorage` and sent as a `Bearer` token on every protected request
- Every protected API route re-verifies the JWT server-side (`requireAuth` middleware) — frontend redirects are a UX nicety, not the real security boundary
- `.env` is git-ignored — never commit real database credentials or secrets

## 🙌 About this project

Built as a self-guided, module-by-module learning project covering the full lifecycle of a web app: frontend, backend, database, auth, CRUD, and deployment.
