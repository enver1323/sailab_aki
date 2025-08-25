import React from "react";
import styled from "styled-components";

const AuthLayoutWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  background: ${(props) => props.theme.ui_background};
`;

const AuthLayout: React.FC<React.PropsWithChildren> = ({children}) => {
  return (
    <AuthLayoutWrapper>
      <>{children}</>
    </AuthLayoutWrapper>
  );
};

export default AuthLayout;
