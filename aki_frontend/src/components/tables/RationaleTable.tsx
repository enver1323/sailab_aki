import styled from "styled-components";

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
`;

const Thead = styled.thead`
`;

const TheadTd = styled.td`
  color: #3E3E3E;
  background-color: #F8F8F8;
  font-size: ${(props) => props.theme.font.size.m};
  height: 76px;
`;

const Tr = styled.tr``;

const Td = styled.td`
  font-size: ${(props) => props.theme.font.size.m};
  height: 63px;
  border-bottom: 1px solid #DFDFDF;
`;

const RationaleTable = ({ data }: { data: any[] }) => {
  return (
    <Table>
      <Thead>
        <TheadTd>순위</TheadTd>
        <TheadTd>구분</TheadTd>
        <TheadTd>검사 결과</TheadTd>
        <TheadTd>기여도</TheadTd>
      </Thead>
      {data.map((item, index) => {
        return (
          <Tr key={index}>
            <Td>{item.rank}</Td>
            <Td>{item.category}</Td>
            <Td>{item.result}</Td>
            <Td>{item.contribution}</Td>
          </Tr>
        );
      })}
    </Table>
  );
};

export default RationaleTable
