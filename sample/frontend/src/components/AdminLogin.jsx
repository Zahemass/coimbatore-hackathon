import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Typography, TextField, Button, Paper, Box } from "@mui/material";
import logo from "../assets/logo.png";

function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();

      if (res.status === 200) {
        navigate("/dashboard"); // Redirect after success
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error, try again later");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={6} sx={{ p: 4, textAlign: "center", borderRadius: "12px" }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <img src={logo} alt="Admin Logo" style={{ height: 80 }} />
          </Box>

          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333", mb: 3 }}>
            Admin Login
          </Typography>

          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            variant="outlined"
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            sx={{ mb: 2 }}
          />

          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#3498DB",
              color: "#fff",
              py: 1.2,
              fontSize: "16px",
              borderRadius: "8px",
            }}
            onClick={handleLogin}
          >
            Login
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default AdminLogin;
