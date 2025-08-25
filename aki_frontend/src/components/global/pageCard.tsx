import styled from "styled-components";

const PageCard = styled.div<{ padding?: number }>`
  width: 100%;
  background: ${(props) => props.theme.ui_base};
  border: solid 1px #88888833;
  padding: ${(props) => props.padding ?? 20}px;
  min-width: 25rem;
`;

export default PageCard;
