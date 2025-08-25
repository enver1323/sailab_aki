import { createContext, useContext, useMemo } from "react";
import { APIContextType } from "@/types/api";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { getUserFromLocalStorage, useAuth } from "./useAuth";
import { User } from "@/types/user";
import { UserResponse } from "@/types/responses";

const HOME = "/api";
// const HOME = "http://localhost:9000/api";

const getContextObject = (apiInstance: AxiosInstance = axios) => ({
  get: (route: string, config: AxiosRequestConfig = {}) => apiInstance.get(route, config),
  post: (route: string, payload: any = {}, config: AxiosRequestConfig = {}) =>
    apiInstance.post(route, payload, config),
  put: (route: string, payload: any = {}, config: AxiosRequestConfig = {}) =>
    apiInstance.put(route, payload, config),
  delete: (route: string, config: AxiosRequestConfig = {}) => apiInstance.delete(route, config),
  url: (route: string) => `${HOME}/${route}`,
});

const api = axios.create({});
const publicAPI = axios.create({});

const getBearerToken = (token: string | null): string | null => (token ? `Bearer ${token}` : null);

const getTokenFromUser = (): string | null => {
  const curUser: User | null = getUserFromLocalStorage();
  return curUser?.accessToken ? getBearerToken(curUser.accessToken) : null;
};

const APIContext = createContext<APIContextType>(getContextObject(api));

export const APIProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { login, logout } = useAuth();

  const value: APIContextType = useMemo(() => getContextObject(api), []);
  api.defaults.baseURL = HOME;
  publicAPI.defaults.baseURL = HOME;

  const refreshToken = (token: string | null): Promise<UserResponse> => {
    return publicAPI
      .post("refresh", {}, { headers: { Authorization: getBearerToken(token) } })
      .then((response) => response.data);
  };

  api.interceptors.request.use(
    (config) => {
      if (!config.headers.Authorization) config.headers.Authorization = getTokenFromUser();
      return config;
    },
    (error) => Promise.reject(error)
  );

  api.interceptors.response.use(
    async (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const token = getUserFromLocalStorage()?.refreshToken;
      const config = error.config;

      if (status === 401 && token && !config?.sent) {
        config.sent = true;

        return await refreshToken(token)
          .then(async (refreshResponse: UserResponse) => {
            if (!refreshResponse?.data) return;

            const newUser = new User(refreshResponse.data);
            login(newUser);

            delete config.headers.Authorization;
            config.headers.Authorization = getBearerToken(newUser.accessToken);
            return publicAPI.request(config).catch(() => Promise.reject(error));
          })
          .catch(() => {
            logout();
            return Promise.reject(error);
          });
      }

      return Promise.reject(error);
    }
  );

  return <APIContext.Provider value={value}>{children}</APIContext.Provider>;
};

export const useAPI = () => {
  return useContext(APIContext);
};
