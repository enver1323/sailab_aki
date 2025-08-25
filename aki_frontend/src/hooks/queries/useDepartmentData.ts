import { useMutation, useQuery } from "@tanstack/react-query";
import { PaginatedType } from "@/types/patientTypes";
import { useAPI } from "@/hooks/useAPI";
import { Department, DepartmentFormPayload } from "@/types/department";
import { AxiosError } from "axios";
import { DepartmentDetailsResponse } from "@/types/responses";

export const useDepartmentListData = (
  page: number,
  search?: string,
) => {
  const api = useAPI();
  const departmentsQuery = async (page: number, search?: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append("page", page.toString());
    searchParams.append("search", search ?? "");

    return api.get(`departments?${searchParams.toString()}`).then((response) => response.data.data);
  };
  return useQuery<PaginatedType<Department>, undefined>({
    queryKey: ["departmentList", page, search],
    queryFn: () => departmentsQuery(page, search),
    keepPreviousData: true,
  });
};

export const useDepartmentCreate = (
  onSuccess: (data: Department | Object) => void = () => {},
  onError: (err: AxiosError<DepartmentDetailsResponse>) => void = () => {}
) => {
  const api = useAPI();

  const createQuery = async (data: DepartmentFormPayload): Promise<DepartmentDetailsResponse> =>
    api.post("departments", data).then((response) => response.data);

  return useMutation<
    DepartmentDetailsResponse,
    AxiosError<DepartmentDetailsResponse>,
    { data: DepartmentFormPayload }
  >({
    mutationFn: ({data}) => createQuery(data),
    onSuccess: ({ data }: DepartmentDetailsResponse) => {
      if (!data) return onSuccess({});

      return onSuccess(data);
    },
    onError,
  });
};

export const useDepartmentEdit = (
  onSuccess: (data: Department | Object) => void = () => {},
  onError: (err: AxiosError<DepartmentDetailsResponse>) => void = () => {}
) => {
  const api = useAPI();

  const editQuery = async (department: Department, data: DepartmentFormPayload): Promise<DepartmentDetailsResponse> =>
    api.put(`departments/${department.id}`, { ...data, department_id: department.id }).then((response) => response.data);

  return useMutation<
    DepartmentDetailsResponse,
    AxiosError<DepartmentDetailsResponse>,
    { department?: Department; data: DepartmentFormPayload }
  >({
    mutationFn: ({ department, data }) => editQuery(department!, data),
    onSuccess: ({ data }: DepartmentDetailsResponse) => {
      if (!data) return onSuccess({});

      return onSuccess(data);
    },
    onError,
  });
};

export const useDepartmentShow = (id: number) => {
  const api = useAPI();
  const departmentQuery = async (id: number) =>
    api.get(`departments/${id}`).then(({ data: payload }) => payload.data);
    
  return useQuery<Department, undefined>({
    queryKey: ["departmentShow", id],
    queryFn: () => departmentQuery(id),
    keepPreviousData: false,
  });
};
