import { useLogin } from "@/hooks/queries/useLogin";
import { UserResponse } from "@/types/responses";
import { AxiosError } from "axios";
import { useForm, SubmitHandler } from "react-hook-form";
import Alert from "@/components/global/atoms/Alert";
import Input from "@/components/global/atoms/Input";
import styled from "styled-components";

const InputBlock = styled.div`
  margin: 0.5rem 0;
  & > label {
    display: block;
    font-size: 0.8em;
  }
  & > input{
    width: 100%;
  }
`

const SubmitButton = styled.input.attrs({
  type: "submit",
})`
  width: 100%;
  color: white;
  background-color: ${(props) => props.theme.primary};
  padding: 0.75rem;
  border-radius: 5px;
  cursor: pointer;
`;

type LoginInputs = {
  username: string;
  password: string;
};

const LoginForm = () => {
  const {
    register,
    setError,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInputs>();

  const onAPIError = (apiError: AxiosError<UserResponse>) => {
    const errorResponse = apiError.response?.data.errors ?? {};
    if (errorResponse?.username)
      setError("username", { message: (errorResponse?.username ?? []).join(", ") });
    if (errorResponse?.password)
      setError("password", { message: (errorResponse?.password ?? []).join(", ") });

    setError("root.serverError", { message: apiError.response?.data.message });
  };
  const mutation = useLogin(onAPIError);

  const onSubmit: SubmitHandler<LoginInputs> = (data) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.root && <Alert>{errors.root.serverError.message}</Alert>}
      <InputBlock>
        <label>Username</label>
        <Input {...register("username", { required: "Username is required" })} />
        {errors.username && <Alert>{errors.username?.message}</Alert>}
      </InputBlock>
      <InputBlock>
        <label>Password</label>
        <Input {...register("password", { required: "Password is required" })} type="password" />
        {errors.password && <Alert>{errors.password?.message}</Alert>}
      </InputBlock>
      <SubmitButton/>
    </form>
  );
};

export default LoginForm;
