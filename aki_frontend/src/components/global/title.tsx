import styled from "styled-components";

const Title = styled.h2`
  color: ${(props) => props.theme.font.color.accent};
  font-weight: ${(props) => props.theme.font.weight.bold};
  font-size: ${(props) => props.theme.font.size.l};
`;

export default Title;
