import React, { createRef, useState } from "react";
import { UserDetailsResponse } from "@/types/responses";
import { AxiosError } from "axios";
import { useForm, SubmitHandler, Controller, ControllerRenderProps } from "react-hook-form";
import Alert from "@/components/global/atoms/Alert";
import Input from "@/components/global/atoms/Input";
import {
  AutoComplete,
  AutoCompleteChangeEvent,
  AutoCompleteCompleteEvent,
} from "primereact/autocomplete";
import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import styled from "styled-components";
import { useDepartmentListData } from "@/hooks/queries/useDepartmentData";
import { User, UserFormPayload, UserProps, UserRoles } from "@/types/user";
import { UseMutationResult } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

const InputBlock = styled.div`
  margin: 0.5rem 0;
  & label {
    display: block;
    font-size: 0.8em;
  }
  & input {
    width: 100%;
  }
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;

  @media only screen and (min-width: 768px) {
    flex-direction: row;
  }
`;

const Col = styled.div`
  @media only screen and (min-width: 768px) {
    width: 50%;
    padding: 0 1rem;
  }
`;

class SelectOption<TValue> {
  label: string;
  value: TValue;
  constructor(value: TValue, label?: string) {
    this.value = value;
    this.label = label ?? (value as string);
  }
}

const roleOptions = [
  new SelectOption(UserRoles.Admin, "Admin"),
  new SelectOption(UserRoles.User, "User"),
];

const SubmitButton = styled.button.attrs({
  type: "submit",
})`
  width: 100%;
  color: white;
  background-color: ${(props) => props.theme.primary};
  padding: 0.75rem;
  border-radius: 5px;
`;

type UserFormData = {
  username: string;
  name: string;
  password?: string | null;
  role: UserRoles.Admin | UserRoles.User;
  external_id?: string | null;
  departments?: Array<SelectOption<Number>>;
};

type UserDetailsFormProps = {
  user?: User;
  mutationGenerator: (
    onSuccess?: (data: UserProps | Object) => void,
    onError?: (err: AxiosError<UserDetailsResponse>) => void
  ) => UseMutationResult<
    UserDetailsResponse,
    AxiosError<UserDetailsResponse>,
    { user?: User; data: UserFormPayload }
  >;
};

const UserDetailsForm: React.FC<UserDetailsFormProps> = ({ user, mutationGenerator }) => {
  const defaultValues: UserFormData = {
    username: user?.username ?? "",
    name: user?.name ?? "",
    password: null,
    role: user?.role ?? UserRoles.User,
    external_id: user?.externalId,
    departments: user?.departments?.map((dep) => new SelectOption<number>(dep.id, dep.name)),
  };

  const {
    register,
    setError,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UserFormData>({ defaultValues });

  const reportableAttributes: Array<keyof UserFormData> = [
    "username",
    "password",
    "name",
    "external_id",
    "password",
    "role",
    "departments",
  ];
  const [filterData, setFilterData] = useState({ search: "", page: 1 });

  const departmentRef = createRef<AutoComplete>();
  const { data } = useDepartmentListData(filterData.page, filterData.search);
  const filteredDepartments: Array<SelectOption<Number>> =
    data?.items.map((item) => new SelectOption<Number>(item.id, item.name)) ?? [];

  const navigate = useNavigate();

  const onAPIError = (apiError: AxiosError<UserDetailsResponse>) => {
    const errorResponse = apiError.response?.data.errors ?? {};
    for (const attr of reportableAttributes) {
      if (errorResponse?.[attr])
        setError(attr, { message: (errorResponse?.[attr] ?? []).join(", ") });
    }

    setError("root.serverError", { message: apiError.response?.data.message });
  };
  const onSuccess = () => {
    navigate("/admin/users");
  };

  const searchDepartments = (event: AutoCompleteCompleteEvent) => {
    setFilterData({ search: event.query, page: 1 });
  };

  const mutation = mutationGenerator(onSuccess, onAPIError);

  const save: SubmitHandler<UserFormData> = (formData) => {
    const departments = formData.departments?.map((item) => item.value);

    const data: UserFormPayload = {
      username: formData.username,
      name: formData.name,
      password: formData?.password,
      external_id: formData.external_id,
      role: formData.role,
      departments,
    };

    mutation.mutate({ user, data });
  };

  const onSelectFieldChange = (
    field: ControllerRenderProps<UserFormData, any>,
    e: DropdownChangeEvent | AutoCompleteChangeEvent
  ) => field.onChange(e.value);

  const passwordRules = user ? {} : { required: "Password is required" };

  return (
    <form onSubmit={handleSubmit(save)}>
      {errors.root && <Alert>{errors.root.serverError.message}</Alert>}
      <Row>
        <Col>
          <InputBlock>
            <label>Username</label>
            <Input {...register("username", { required: "Username is required" })} />
            {errors.username && <Alert>{errors.username?.message}</Alert>}
          </InputBlock>
          <InputBlock>
            <label>Name</label>
            <Input {...register("name", { required: "Name is required" })} type="text" />
            {errors.name && <Alert>{errors.name?.message}</Alert>}
          </InputBlock>
          <InputBlock>
            <label>Password</label>
            <Input {...register("password", passwordRules)} type="password" />
            {errors.password && <Alert>{errors.password?.message}</Alert>}
          </InputBlock>
        </Col>
        <Col>
          <InputBlock>
            <label>External ID</label>
            <Input {...register("external_id")} type="text" />
            {errors.external_id && <Alert>{errors.external_id?.message}</Alert>}
          </InputBlock>
          <InputBlock>
            <label>Role</label>
            <Controller
              name="role"
              control={control}
              rules={{ required: "Role is required" }}
              render={({ field }) => (
                <Dropdown
                  id={field.name}
                  value={field.value}
                  onChange={(e) => onSelectFieldChange(field, e)}
                  options={roleOptions}
                  optionLabel="label"
                  multiple={false}
                />
              )}
            />
            {errors.role && <Alert>{errors.role?.message}</Alert>}
          </InputBlock>
          <InputBlock>
            <label>Departments</label>
            <Controller
              name="departments"
              control={control}
              render={({ field }) => (
                <AutoComplete
                  ref={departmentRef}
                  value={field.value}
                  suggestions={filteredDepartments}
                  completeMethod={searchDepartments}
                  virtualScrollerOptions={{ itemSize: 38 }}
                  field="label"
                  dropdown
                  multiple
                  onChange={(e) => onSelectFieldChange(field, e)}
                  dropdownAriaLabel="Select Item"
                />
              )}
            />
            {errors.departments && <Alert>{errors.departments?.message}</Alert>}
          </InputBlock>
        </Col>
      </Row>
      <SubmitButton>Submit</SubmitButton>
    </form>
  );
};

export default UserDetailsForm;
