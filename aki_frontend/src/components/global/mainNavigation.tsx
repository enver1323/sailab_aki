import styled from "styled-components";
import React from "react";
import { MdMenuOpen, MdMenu } from "react-icons/md";

import { PageTypes } from "@/types/pageTypes";

import { redirect, useNavigate } from "react-router-dom";

const NavigationContainer = styled.div<{ collapsed: boolean }>`
  padding: 0;
  margin: 0;
  position: absolute;
  top: 84px;
  bottom: 0;
  left: 0;
  z-index: ${(props) => props.theme.z_index.top_2};

  width: ${(props) => (props.collapsed ? "40px" : "220px")};
  background: ${(props) => props.theme.ui_base};
  border-right: ${(props) => props.theme.border};
`;

const NavigationInner = styled.div`
  padding: 0;
  margin: 0;
`;

const TopContainer = styled.div`
  // border-top: ${(props) => props.theme.border};
  border-bottom: ${(props) => props.theme.border};

  padding: 20px 25px;

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const IconContainer = styled.div`
  padding: 2px;
  height: 30px;
  width: 30px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  & > .menu-icon {
    color: ${(props) => props.theme.font.color.secondary};
  }
  &:hover {
    background: ${(props) => props.theme.hover.hover_on_white_bg};
    cursor: pointer;
  }
`;

const LinkItem = styled.div`
  padding: 15px 25px;
  &:hover {
    background: ${(props) => props.theme.hover.hover_on_white_bg};
    cursor: pointer;
  }
`;

const LinkItemText = styled.h3<{ active: boolean }>`
  font-size: ${(props) => props.theme.font.size.m};
  font-weight: ${(props) => props.theme.font.weight.semibold};
  color: ${(props) =>
    props.active ? props.theme.font.color.secondary_accent : props.theme.font.color.secondary};
`;

const CurrentPage = styled.h2`
  font-size: ${(props) => props.theme.font.size.m};
  color: ${(props) => props.theme.font.color.accent};
`;

const BottomContainer = styled.div`
  padding: 20px 0;
`;

const MainNavigation: React.FC<{
  currentPage: PageTypes;
  subPage: string;
  navigationCollapsed: boolean;
  onNavigationCollapse: (newVal: boolean) => void;
}> = (props) => {
  const pageNames = {
    patients: "입원 중 환자",
    predictions: "과거 예측",
    settings: "설정",
    home: "AKI 예측 홈",
    admin: "Admin"
  };

  const pagination = {
    patients: [
      {
        key: "all",
        title: "전체 환자 조회",
        link: "/patients/all",
      },
      {
        key: "interests",
        title: "관심환자 조회",
        link: "/patients/interests",
      },
    ],
    predictions: [
      {
        key: "periodic",
        title: "기간별 예측",
        link: "/predictions/periodic",
      },
      {
        key: "dashboard",
        title: "예측 대시보드",
        link: "/predictions/dashboard",
      },
    ],
    settings: [
      {
        key: "edit",
        title: "기본정보 수정",
        link: "/settings/edit",
      },
      {
        key: "notifications",
        title: "알림 설정",
        link: "/settings/notifications",
      },
    ],
    admin: [
      {
        key: "users",
        title: "Users",
        link: "/admin/users",
      },{
        key: "departments",
        title: "Departments",
        link: "/admin/departments",
      },
    ],
    home: [],
  };

  const navigate = useNavigate();
  const linkClickHandler = (link: string) => {
    navigate(link);
  };

  return (
    <NavigationContainer collapsed={props.navigationCollapsed}>
      <NavigationInner>
        <TopContainer>
          <CurrentPage>{pageNames[props.currentPage]}</CurrentPage>
          <IconContainer>
            {props.navigationCollapsed ? (
              <MdMenu
                size={18}
                className={"menu-icon"}
                onClick={() => props.onNavigationCollapse(false)}
              />
            ) : (
              <MdMenuOpen
                size={18}
                className={"menu-icon"}
                onClick={() => props.onNavigationCollapse(true)}
              />
            )}
          </IconContainer>
        </TopContainer>
        <BottomContainer>
          {pagination[props.currentPage].map((e, i) => (
            <LinkItem key={i} onClick={(_e) => linkClickHandler(`${e.link}`)}>
              <LinkItemText active={e.key == props.subPage}>{e.title}</LinkItemText>
            </LinkItem>
          ))}
        </BottomContainer>
      </NavigationInner>
    </NavigationContainer>
  );
};

export default MainNavigation;
