import React, { PropsWithChildren, ReactNode } from "react";
import styled, { useTheme } from "styled-components";
import { useOnClickOutside } from "usehooks-ts";
import { disableScroll } from "../utils/scrollUtil";
import ScrimPopupContainer from "./ScrimPopupContainer/ScrimPopupContainer";
import CloseIcon from "@/assets/close.svg";

const Container = styled.div<{ width?: string; height?: string }>`
  position: relative;

  display: flex;
  flex-flow: column;

  height: ${(props) => props.height ?? "calc(100vh - 80px)"};
  width: 100%;
  min-width: 334px;
  max-width: ${(props) => props.width ?? "750px"};

  min-height: 280px;

  background-color: white;
  border-radius: 12px;
`;

const Header = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  flex-flow: row;
  text-align: center;
  align-items: center;
  min-height: 90px;

  padding: 28px 24px;
`;

const CloseButton = styled.button`
  position: absolute;
  padding: 0;
  outline: none;
  border: none;
  background: none;

  top: 33px;
  right: 24px;

  & > .icon-container {
    background: "red";
  }
  ::before {
    position: absolute;
    background: none;
    content: "";
    border-radius: 4px;
    top: 0;
    bottom: 0;
    right: 0;
    left: 0;
    transition: background-color 0.2s;
  }
  &:hover::before {
    background-color: ${({ theme, disabled }) => (disabled ? "none" : "rgba(255,255,255, 0.3)")};
  }
  &:active::before {
    background-color: ${({ theme, disabled }) => (disabled ? "none" : "rgba(254, 254, 254, 0.5)")};
  }
`;
const LayerPopupScrollContainer = styled.div`
  overflow: auto;

  height: 100%;
  width: 100%;

  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  flex-grow: 1;
`;

const FixedBottomArea = styled.div`
  width: 100%;
  padding: "24px 16px 35px";
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 10px;
  padding: 28px 24px;
`;

export interface LayoutPopupType {
  width?: string;
  height?: string;
  header?: ReactNode;
  isOpen: boolean;
  footer?: ReactNode;
  onClose: VoidFunction;
}

export default function LayoutPopup({
  width,
  height,
  header,
  footer,
  isOpen,
  children,
  onClose,
}: PropsWithChildren<LayoutPopupType>) {
  const scrollContainerRef = React.useRef(null);
  const theme = useTheme();

  React.useLayoutEffect(() => {
    if (!isOpen) return;

    const enableScroll = disableScroll(scrollContainerRef.current);

    return () => {
      enableScroll();
    };
  }, [isOpen]);

  const handleClickOutside = () => {
    onClose();
  };
  useOnClickOutside(scrollContainerRef, handleClickOutside);

  return (
    <ScrimPopupContainer isOpen={isOpen}>
      {isOpen && (
        <Container width={width} height={height} ref={scrollContainerRef}>
          <Header>
            {header}
            <CloseButton onClick={onClose}>
              <img src={CloseIcon} width={24} height={24} />
            </CloseButton>
          </Header>
          <LayerPopupScrollContainer>
            {children}
          </LayerPopupScrollContainer>
          <FixedBottomArea>{footer}</FixedBottomArea>
        </Container>
      )}
    </ScrimPopupContainer>
  );
}
