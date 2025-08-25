import React from "react";
import styled from "styled-components";

const AlertBox = styled.div`
  padding: 0.5rem;
  color: red;
  background-color: #ffd2d2;
  font-size: 0.5em;
  border-radius: 5px;
`;

const Alert: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <AlertBox>{children}</AlertBox>;
};

export default Alert;
