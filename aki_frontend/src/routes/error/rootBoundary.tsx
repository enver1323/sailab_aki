import React from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import logger from "@/utils/logger";
import ErrorPage from "@/routes/error/errorPage";

const RootBoundary = () => {
  const error = useRouteError();

  React.useEffect(() => {
    logger.exception(`An Error has occurred [RootBoundaryError][${error}`, error);
  });
  // if (isRouteErrorResponse(error)) {
  //   if (error.status === 404)
  //     return (
  //       <ErrorPage
  //         errorCode={404}
  //         errorText={"요청하신 페이지는 없는 페이지 입니다"}
  //         errorDescription={
  //           "요청하신 페이지는 없는 페이지 입니다. 링크가 올바른지 다시 확인해 주세요."
  //         }
  //       />
  //     );
  // }
  return (
    <ErrorPage
      errorCode={1305}
      errorText={"예상치 못한 오류가 발생했습니다"}
      errorDescription={"요청하신 작업을 수행 중 예상치 못한 오류가 발생하였습니다. 죄송합니다."}
    />
  );
};

export default RootBoundary;
