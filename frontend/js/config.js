// Marginalia — environment config
//
// Locally (opening the HTML files directly, or via a dev server on
// localhost), this points at your local backend running on port 5000.
//
// Once deployed to Vercel — where the frontend and backend live under the
// same domain — it automatically uses a relative "/api" path instead, so
// no manual editing is needed after deployment.
//
// If you deploy the backend somewhere else (Render, Railway, etc.)
// separately from the frontend, replace the fallback URL below with your
// backend's full address, e.g. 'https://marginalia-backend.onrender.com/api'.

(function () {
  const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  window.MARGINALIA_API_BASE = isLocal ? 'http://localhost:5000/api' : '/api';
})();
