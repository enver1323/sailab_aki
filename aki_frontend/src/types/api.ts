import { AxiosResponse } from "axios";
import { AxiosRequestConfig } from "axios";

export type APIContextType = {
  get: (route: string, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
  post: (route: string, payload?: any, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
  put: (route: string, payload?: any, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
  delete: (route: string, payload?: any, config?: AxiosRequestConfig) => Promise<AxiosResponse>;
  url: (route: string) => string;
};
