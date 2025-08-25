import React from "react"
import styled from "styled-components"

// TODO: 이 Spinner은 임의로 추가한 Spinner로, 이후 공식 Spinner가 나왔을 때 대체해 주시기 바랍니다.
// undefined state 에서 표시할 content 입니다.

const DemoSpinnerWrapper = styled.div`
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;

  & div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #fff;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);
  }
  & div:nth-child(1) {
    left: 8px;
    animation: lds-ellipsis1 0.6s infinite;
  }
  & div:nth-child(2) {
    left: 8px;
    animation: lds-ellipsis2 0.6s infinite;
  }
  & div:nth-child(3) {
    left: 32px;
    animation: lds-ellipsis2 0.6s infinite;
  }
  & div:nth-child(4) {
    left: 56px;
    animation: lds-ellipsis3 0.6s infinite;
  }
  @keyframes lds-ellipsis1 {
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes lds-ellipsis3 {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(0);
    }
  }
  @keyframes lds-ellipsis2 {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: translate(24px, 0);
    }
  }
`

const DemoSpinner: React.FC<{ className?: string }> = (props) => {
  return (
    <DemoSpinnerWrapper className={props.className}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </DemoSpinnerWrapper>
  )
}

export default DemoSpinner
