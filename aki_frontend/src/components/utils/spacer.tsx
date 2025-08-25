import styled from "styled-components";

const Spacer = styled.div<{
  height: number;
  mobileHeight?: {
    height: number;
    breakpoint?: number;
  };
}>`
  height: ${(props) => props.height}px;

  ${(props) => {
    if (!!props.mobileHeight) {
      return `@media screen and (max-width: ${props.mobileHeight.breakpoint ?? 768}px) { height: ${
        props.mobileHeight.height
      }px }`;
    }
  }}
`;

export default Spacer;
