import styled from "styled-components"

const Container = styled.div`
  border: 1px solid #DFDFDF;
  border-radius: 10px;
  width: 367px;
  height: 117px;
  margin-right: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Picture = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #DFDFDF;
  margin-left: 40px;
  margin-right: 20px;
`

const Name = styled.span`
  font-size: ${(props) => props.theme.font.size.m};
  font-weight: bold;
  margin-right: 5px;
`;

const Role = styled.span`
  font-size: ${(props) => props.theme.font.size.s};
  color: #02348B;
`;

const Message = styled.button`
  width: 62px;
  height: 20px;
  border-radius: 4px;
  background-color: #6694E3;
  color: #FFFFFF;
  margin-top: 10px;
`;

const DoctorInfo = () => {
 return (
   <Container>
     <Picture />
     <div style={{ display: "flex", flexDirection: "column" }}>
       <div style={{ display: "flex", flexDirection: "row", alignItems: 'end' }}>
         <Name>김이박</Name>
         <Role>주치의</Role>
       </div>
       <Message>메시지</Message>
     </div>
   </Container>
 );
}

export default DoctorInfo;
