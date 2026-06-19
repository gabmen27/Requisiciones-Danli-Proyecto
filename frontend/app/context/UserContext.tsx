import { createContext } from "react";
import { Usuario } from "../models/Usuario";

export const UserContext = createContext({
  user: null as Usuario | null,
  login: (username: string, password: string) => {},
  logout: () => {},
});
