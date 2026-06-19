import React, { useState } from "react";
import { Views } from "../models/Views";
import { Usuario } from "../models/Usuario";
import { UserContext } from "../context/UserContext";

export default function UserProvider({ children }: Views) {
  const [user, setUser] = useState<Usuario | null>(null);

  async function login(userName: string, password: string) {
    const response = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ userName, password }),
    });

    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      localStorage.setItem("token", data.token);
      alert("Inicio de sesion exitosa");
    } else {
      console.log("Usuario o contrasenia incorrecto");
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("token");
  }

  return (
    <div>
      <UserContext.Provider value={{ user, login, logout }}>
        {children}
      </UserContext.Provider>
    </div>
  );
}
