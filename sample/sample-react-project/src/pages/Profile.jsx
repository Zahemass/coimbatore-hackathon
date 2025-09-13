import React from "react";
import { useParams } from "react-router-dom";

export default function Profile() {
  const { id } = useParams();
  return (
    <section style={{ padding: 16 }}>
      <h2>Profile</h2>
      <p>User ID: {id}</p>
    </section>
  );
}
