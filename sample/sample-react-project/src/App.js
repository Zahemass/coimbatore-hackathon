import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Header from "./components/Header";

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile/:id" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
