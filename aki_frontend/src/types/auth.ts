import {User} from "@/types/user"

export type AuthContextType = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
};

export type AuthErrorItem = {
  username?: Array<string>;
  password?: Array<string>;
};