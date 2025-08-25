import styled from "styled-components";

const Input = styled.input.attrs((props) => ({
  type: props.type || "text",
}))`
  font-size: 0.75em;
  border: 1px solid ${(props) => props.theme.primary};
  border-radius: 5px;
`;

export default Input;
