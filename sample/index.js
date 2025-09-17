// sample/index.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Client-ID"],
  })
);
app.use(express.json());

/* --------------------
   Auth Setup
   -------------------- */
function loadExpectedToken() {
  try {
    const p = path.join(process.cwd(), "env.json");
    if (fs.existsSync(p)) {
      const o = JSON.parse(fs.readFileSync(p, "utf-8"));
      if (typeof o.ACCESS_TOKEN !== "undefined") return o.ACCESS_TOKEN;
    }
  } catch (e) {
    console.warn("⚠️ Could not read env.json:", e.message);
  }
  return "my-secret-token-987";
}
const EXPECTED_TOKEN = loadExpectedToken();

function mask(t) {
  if (!t || typeof t !== "string") return String(t);
  if (t.length <= 8) return t;
  return `${t.slice(0, 3)}…${t.slice(-3)}`;
}

function authMiddleware(req, res, next) {
  const bodyToken = req.body?.token;
  let headerToken = null;

  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) headerToken = parts[1];
    else headerToken = authHeader;
  }

  const token = bodyToken || headerToken;

  console.log(`[auth] bodyToken=${mask(bodyToken)} headerToken=${mask(headerToken)} expected=${mask(EXPECTED_TOKEN)}`);

  if (!token) return res.status(401).json({ error: "Missing token" });
  if (token !== EXPECTED_TOKEN) return res.status(401).json({ error: "Invalid token" });

  next();
}

/* --------------------
   Routes
   -------------------- */

// Profile
app.get("/profile", authMiddleware, (req, res) => {
  const details = req.query.details || "basic";
  const baseUser = { id: 1, name: "Alice Example", email: "test@example.com" };
  if (details === "full") return res.json({ ...baseUser, theme: "dark", role: "admin" });
  res.json(baseUser);
});
app.post("/profile", authMiddleware, (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "Missing userId" });
  res.json({ userId, name: "Alice Example", email: "alice@example.com" });
});

// Settings
app.post("/settings", authMiddleware, (req, res) => {
  const { userId, theme } = req.body || {};
  if (!userId || !theme) return res.status(400).json({ error: "Missing userId or theme" });
  res.json({ message: `Settings updated for user ${userId}`, theme });
});

// Search with query params
app.get("/search", authMiddleware, (req, res) => {
  const { q = "", limit = 5 } = req.query;
  const results = Array.from({ length: limit }, (_, i) => ({
    id: i + 1,
    text: `Result for "${q}" #${i + 1}`,
  }));
  res.json({ q, results });
});

// Orders with path param
app.get("/orders/:orderId", authMiddleware, (req, res) => {
  const { orderId } = req.params;
  res.json({
    orderId,
    item: "Laptop",
    price: 1200,
    status: "shipped",
  });
});

// Projects with path + query
app.get("/projects/:id/tasks", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { status = "all" } = req.query;
  const tasks = [
    { id: 1, title: "Setup repo", status: "done" },
    { id: 2, title: "Add CI/CD", status: "in-progress" },
  ];
  res.json({ projectId: id, filter: status, tasks: status === "all" ? tasks : tasks.filter(t => t.status === status) });
});

// Reports with custom header
app.get("/reports", authMiddleware, (req, res) => {
  const clientId = req.headers["x-client-id"] || "anonymous";
  res.json({ client: clientId, generatedAt: new Date().toISOString(), stats: { users: 10, sales: 99 } });
});

// Upload simulation
app.post("/upload", authMiddleware, (req, res) => {
  const { filename, size } = req.body || {};
  if (!filename || !size) return res.status(400).json({ error: "Missing filename or size" });
  res.json({ message: `File ${filename} uploaded`, size });
});

// Delete example
app.delete("/users/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  res.json({ message: `User ${id} deleted` });
});

// Patch example
app.patch("/users/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Missing email" });
  res.json({ message: `User ${id} email updated`, email });
});

// Health
app.get("/health", (req, res) => res.json({ status: "ok", message: "API is running" }));

// Auth (login/signup)
app.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });
  if (email === "test@example.com" && password === "Passw0rd!") {
    return res.json({ message: "Login successful", token: EXPECTED_TOKEN, user: { id: 1, name: "Alice Example", email } });
  }
  res.status(401).json({ error: "Invalid credentials" });
});
app.post("/signup", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: "Missing name, email, or password" });
  res.json({ message: "Signup successful", user: { id: Date.now(), username, email } });
});

// Example new route in sample/index.js
app.post("/orders/:orderId", authMiddleware, (req, res) => {
  const { orderId } = req.params;
  const { product, qty } = req.body;

  if (!product || !qty) {
    return res.status(400).json({ error: "Missing product or qty" });
  }

  res.json({
    message: "Order created",
    orderId,
    product,
    qty,
    status: "confirmed",
  });
});

app.get("/orders/:orderId", authMiddleware, (req, res) => {
  const { orderId } = req.params;
  const expand = req.query.expand === "true";

  const baseOrder = { orderId, product: "Laptop", qty: 2 };

  if (expand) {
    return res.json({ ...baseOrder, status: "shipped", tracking: "XYZ123" });
  }
  res.json(baseOrder);
});

/* --------------------
   Start
   -------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dummy API running at http://localhost:${PORT}`);
  console.log(`ℹ️ Expected token: ${mask(EXPECTED_TOKEN)}`);
});
