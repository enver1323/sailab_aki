import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@/types/user";
import { UserResponse } from "@/types/responses";
import { useAPI } from "../useAPI";
import { AxiosError } from "axios";

export const useLogin = (onError: (err: AxiosError<UserResponse>) => void = () => {}) => {
  const { login } = useAuth();
  const api = useAPI();

  const loginQuery = async (username: string, password: string): Promise<UserResponse> => {
    return api.post("login", { username, password }).then((response) => response.data);
  };

  return useMutation<
    UserResponse,
    AxiosError<UserResponse>,
    { username: string; password: string }
  >({
    mutationFn: (payload) => loginQuery(payload.username, payload.password),
    onSuccess: (response: UserResponse) => {
      if (response.data) {
        login(new User(response.data));
        return response.data;
      }
      return {};
    },
    onError
  });
};
