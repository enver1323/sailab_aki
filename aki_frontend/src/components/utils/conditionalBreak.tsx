import styled from "styled-components";

const ConditionalBreak = styled.br<{ breakOnWidth: number }>`
  display: none;
  @media screen and (min-width: ${(props) => props.breakOnWidth}px) {
    display: block;
  }
`;

export default ConditionalBreak;
