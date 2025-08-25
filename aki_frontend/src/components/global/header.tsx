import React from "react";
import styled from "styled-components";
import logo from "@/assets/snuhAKILogo.png";
import { useNavigate } from "react-router-dom";
import { PageTypes } from "@/types/pageTypes";
import { useAuth } from "@/hooks/useAuth";

const HeaderContainer = styled.header`
  position: absolute;
  z-index: ${(props) => props.theme.z_index.top_1};
  top: 0;
  width: 100%;
  min-width: 700px;
  max-height: 83px;
  background: ${(props) => props.theme.ui_base};
  border-bottom: ${(props) => props.theme.border};
`;

const HeaderInner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0 50px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderRight = styled.div``;

const HeaderLogoWrapper = styled.div`
  transform: translateY(5px);
  cursor: pointer;
`;

const HeaderLinkGroup = styled.div`
  display: flex;
  padding: 0 40px;
  //gap: 50px;
`;

const HeaderLink = styled.a<{ isActive: boolean }>`
  font-size: ${(props) => props.theme.font.size.m};
  font-weight: ${(props) => props.theme.font.weight.semibold};
  color: ${(props) =>
    props.isActive ? props.theme.font.color.accent : props.theme.font.color.secondary};
  padding: 30px 10px;
  position: relative;
  width: 130px;
  text-align: center;
  &:hover {
    cursor: pointer;
    //font-weight: bold;
    // color: ${(props) => props.theme.primary};
    background: ${(props) => props.theme.hover.hover_on_white_bg};
  }
`;

const HeaderUserGroup = styled.div``;

const HeaderAvatarContainer = styled.div``;

const HeaderUserAction = styled.div`
  font-size: ${(props) => props.theme.font.size.m};
`;

const Header: React.FC<{ currentPage: PageTypes }> = (props) => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const linkClickHandler = (link: string) => {
    navigate(link);
  };

  return (
    <HeaderContainer>
      <HeaderInner>
        <HeaderLeft>
          <HeaderLogoWrapper onClick={() => navigate("/")}>
            <img src={logo} height={"40px"} width={"90px"} alt={"SNUH AKI Detector Logo"} />
          </HeaderLogoWrapper>
          <HeaderLinkGroup>
            <HeaderLink
              isActive={props.currentPage == "patients"}
              onClick={(e) => linkClickHandler("/patients/all")}
            >
              입원 중 환자
            </HeaderLink>
            <HeaderLink
              isActive={props.currentPage == "predictions"}
              onClick={(e) => linkClickHandler("/predictions/periodic")}
            >
              과거 예측
            </HeaderLink>
            { user?.isAdmin ? <HeaderLink
                isActive={["users", "departments"].includes(props.currentPage)}
                onClick={(e) => linkClickHandler("/admin/users")}
              >
                Admin
              </HeaderLink> : null
            }
          </HeaderLinkGroup>
        </HeaderLeft>
        <HeaderRight>
          <HeaderUserGroup>
            <HeaderAvatarContainer></HeaderAvatarContainer>
            <HeaderUserAction onClick={logout}>로그인</HeaderUserAction>
          </HeaderUserGroup>
        </HeaderRight>
      </HeaderInner>
    </HeaderContainer>
  );
};

export default Header;
