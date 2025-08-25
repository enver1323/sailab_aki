import { createContext, useState, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AuthContextType } from "@/types/auth";
import { User } from "@/types/user";

export const getUserFromLocalStorage = (): User | null => {
  const localUser: string | null = window.localStorage.getItem("user");
  if (!localUser) return null;

  return JSON.parse(localUser);
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [localStorageUser, setLocalStorageUser] = useLocalStorage("user", null);
  const [user, setUser] = useState(
    localStorageUser
      ? new User({
          id: localStorageUser.id,
          username: localStorageUser.username,
          name: localStorageUser.name,
          role: localStorageUser.role,
          external_id: localStorageUser.externalId,
          departments: localStorageUser.departments,
          access_token: localStorageUser.accessToken,
          refresh_token: localStorageUser.refreshToken,
        })
      : null
  );

  const navigate = useNavigate();
  const location = useLocation();

  const login = (user: User) => {
    setLocalStorageUser(user);
    setUser(user);
  };

  const logout = () => {
    setLocalStorageUser(null);
    setUser(null);
  };

  useEffect(() => {
    if (!user) navigate("/login", { replace: true, state: { from: location } });
  }, [user]);

  const value: AuthContextType = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
