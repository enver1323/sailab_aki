import { useMutation, useQuery } from "@tanstack/react-query";
import { PaginatedType } from "@/types/patientTypes";
import { useAPI } from "@/hooks/useAPI";
import { User, UserFormPayload, UserProps } from "@/types/user";
import { AxiosError } from "axios";
import { UserDetailsResponse } from "@/types/responses";
import { useAuth } from "@/hooks/useAuth";

export const useUserListData = (page: number, search?: string) => {
  const api = useAPI();
  const usersQuery = async (page: number, search?: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append("page", page.toString());
    searchParams.append("search", search ?? "");

    return api.get(`users?${searchParams.toString()}`).then((response) => response.data.data);
  };
  return useQuery<PaginatedType<UserProps>, undefined>({
    queryKey: ["userList", page, search],
    queryFn: () => usersQuery(page, search),
    keepPreviousData: true,
  });
};

export const useUserCreate = (
  onSuccess: (data: UserProps | Object) => void = () => {},
  onError: (err: AxiosError<UserDetailsResponse>) => void = () => {}
) => {
  const api = useAPI();

  const createQuery = async (data: UserFormPayload): Promise<UserDetailsResponse> =>
    api.post("users", data).then((response) => response.data);

  return useMutation<
    UserDetailsResponse,
    AxiosError<UserDetailsResponse>,
    { data: UserFormPayload }
  >({
    mutationFn: (payload) => createQuery(payload.data),
    onSuccess: ({ data }: UserDetailsResponse) => {
      if (!data) return onSuccess({});

      return onSuccess(data);
    },
    onError,
  });
};

export const useUserEdit = (
  onSuccess: (data: UserProps | Object) => void = () => {},
  onError: (err: AxiosError<UserDetailsResponse>) => void = () => {}
) => {
  const { user: sessionUser, login } = useAuth();
  const api = useAPI();

  const editQuery = async (user: User, data: UserFormPayload): Promise<UserDetailsResponse> =>
    api.put(`users/${user.id}`, { ...data, user_id: user.id }).then((response) => response.data);

  return useMutation<
    UserDetailsResponse,
    AxiosError<UserDetailsResponse>,
    { user?: User; data: UserFormPayload }
  >({
    mutationFn: ({ user, data }) => editQuery(user!, data),
    onSuccess: ({ data }: UserDetailsResponse) => {
      if (!data) return onSuccess({});
      
      if (data.id === sessionUser?.id) login(new User(data));

      return onSuccess(data);
    },
    onError,
  });
};

export const useUserShow = (id: number) => {
  const api = useAPI();
  const userQuery = async (id: number) =>
    api.get(`users/${id}`).then(({ data: payload }) => new User(payload.data));
    
  return useQuery<User, undefined>({
    queryKey: ["userShow", id],
    queryFn: () => userQuery(id),
    keepPreviousData: false,
  });
};
