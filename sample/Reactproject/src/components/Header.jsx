import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";

export default function Header() {
  const { user } = useContext(UserContext);
  return (
    <header style={{ padding: 12, background: "#0f172a", color: "#fff" }}>
      <Link to="/">Home</Link> | <Link to={`/profile/${user.id}`}>Profile</Link>
      <div style={{ float: "right" }}>Welcome, {user.name}</div>
    </header>
  );
}
