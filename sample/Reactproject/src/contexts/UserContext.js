import React, { createContext, useState } from "react";

export const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState({ id: "u1", name: "Alice" });
  const login = (u) => setUser(u);
  return <UserContext.Provider value={{ user, login }}>{children}</UserContext.Provider>;
}
