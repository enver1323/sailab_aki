import styled from "styled-components";
import AuthLayout from "@/layouts/AuthLayout";
import Spacer from "@/components/utils/spacer";
import PageCard from "@/components/global/pageCard";
import LoginForm from "@/components/login/LoginForm";

const Title = styled.h2`
  color: ${(props) => props.theme.font.color.accent};
  font-size: ${(props) => props.theme.font.size.mxl};

  text-align: center;
  padding: 10px 0;
`;

const Login = () => {
  return (
    <AuthLayout>
      <div>
        <PageCard>
          <Spacer height={50} />
          <Title>Login</Title>
          <LoginForm />
          <Spacer height={50} />
        </PageCard>
      </div>
    </AuthLayout>
  );
};

export default Login;
