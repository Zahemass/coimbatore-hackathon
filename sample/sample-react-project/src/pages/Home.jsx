import React, { useContext } from "react";
import useFetch from "../hooks/useFetch";
import { UserContext } from "../contexts/UserContext";

export default function Home() {
  const { user } = useContext(UserContext);
  const { data, loading } = useFetch("/api/todos");

  return (
    <main style={{ padding: 16 }}>
      <h1>Home</h1>
      <p>Signed in as: {user.name}</p>
      {loading ? <p>Loading...</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
    </main>
  );
}
