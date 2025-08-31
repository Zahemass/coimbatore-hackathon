import express from "express";

const app = express();
app.use(express.json());

// ✅ Basic GET route
app.get("/signup", (req, res) => {
  res.json({ message: "Signup GET working!" });
});

// ✅ Basic POST route with body
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  res.json({
    message: "Signup POST working!",
    receivedData: { name, email, password }
  });
});

// ✅ Login GET
app.get("/login", (req, res) => {
  res.json({ message: "Login GET working!" });
});

// ✅ Login POST with params
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email & password are required" });
  }

  res.json({
    message: "Login POST working!",
    receivedData: { email, password }
  });
});

// ✅ Profile GET with query params
app.get("/profile", (req, res) => {
  const { userId } = req.query;
  res.json({
    message: "Profile GET working!",
    userId: userId || "No userId provided"
  });
});

// ✅ Profile POST with body
app.post("/profile", (req, res) => {
  const { userId, bio } = req.body;

  if (!userId || !bio) {
    return res.status(400).json({ error: "userId and bio are required" });
  }

  res.json({
    message: "Profile POST working!",
    receivedData: { userId, bio }
  });
});

// ✅ Update settings POST
app.post("/settings", (req, res) => {
  const { theme, notifications } = req.body;

  res.json({
    message: "Settings POST working!",
    receivedData: { theme, notifications }
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
