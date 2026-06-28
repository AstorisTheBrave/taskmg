import { createContext, useContext, useState } from "react";
import * as api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  function applySession(data) {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("token", data.token);
  }

  async function login(email, password) {
    const data = await api.login(email, password);
    applySession(data);
    return data.user;
  }

  async function signup(name, email, password) {
    const data = await api.signup(name, email, password);
    applySession(data);
    return data.user;
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
