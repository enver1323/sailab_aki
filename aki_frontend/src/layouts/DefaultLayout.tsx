import React from "react";
import styled from "styled-components";
import Header from "@/components/global/header";
import MainNavigation from "@/components/global/mainNavigation";
import Spacer from "@/components/utils/spacer";

import { PageTypes } from "@/types/pageTypes";

const DefaultLayoutWrapper = styled.div`
  width: 100%;
  height: 100%;
`;

const MainContentWrapper = styled.div<{ navigationCollapsed: boolean }>`
  background: ${(props) => props.theme.ui_background};

  width: 100%;
  height: 100%;

  padding: 10px 40px 0 ${(props) => (props.navigationCollapsed ? "80px" : "260px")};
`;

const MainContentPositioner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const MainContentPage = styled.div`

`;
const DefaultLayout: React.FC<
  React.PropsWithChildren & { currentPage: PageTypes; subPage: string }
> = (props) => {
  const [navigationCollapsed, setNavigationCollapsed] = React.useState<boolean>(false);

  return (
    <DefaultLayoutWrapper>
      <Header currentPage={props.currentPage} />
      <MainNavigation
        currentPage={props.currentPage}
        subPage={props.subPage}
        navigationCollapsed={navigationCollapsed}
        onNavigationCollapse={setNavigationCollapsed}
      />
      <MainContentWrapper navigationCollapsed={navigationCollapsed}>
        <MainContentPositioner>
          <Spacer height={100} />
          <MainContentPage>
            <>{props.children}</>
          </MainContentPage>
        </MainContentPositioner>
      </MainContentWrapper>
    </DefaultLayoutWrapper>
  );
};

export default DefaultLayout;
