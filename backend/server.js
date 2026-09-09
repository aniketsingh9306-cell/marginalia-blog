const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Marginalia backend running on http://localhost:${PORT}`);
});
