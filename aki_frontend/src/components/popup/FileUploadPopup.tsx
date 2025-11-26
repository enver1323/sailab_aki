import React from "react";
import styled from "styled-components";
import LayoutPopup from "./LayoutPopup";
import { FileUpload, FileUploadHandlerEvent } from "primereact/fileupload";
import "primereact/resources/themes/mdc-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

interface IFileUploadModalProps {
  isOpen: boolean;
  accept: string;
  multiple?: boolean;
  uploadHandler: (event: FileUploadHandlerEvent) => void;
  onCloseHandler: VoidFunction;
  onFileUploadStateChange: (isUploading: boolean) => void;
}

const voidFn = () => {
  return;
};

const EmptyFileWrapper = styled.div`
  height: 250px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyFileUpload: React.FC = () => {
  return (
    <EmptyFileWrapper>
      <p style={{ color: "grey" }}>업로드할 파일을 여기로 끌어 주세요</p>
    </EmptyFileWrapper>
  );
};

const FileUploadModal: React.FC<IFileUploadModalProps> = (props) => {
  return (
    <LayoutPopup isOpen={props.isOpen} onClose={props.onCloseHandler ?? voidFn} height={"530px"}>
      <FileUpload
        customUpload
        uploadHandler={props.uploadHandler}
        accept={props.accept}
        maxFileSize={2e9}
        emptyTemplate={<EmptyFileUpload />}
        onBeforeDrop={() => props.onFileUploadStateChange(true)}
        onUpload={() => props.onFileUploadStateChange(false)}
        multiple={props.multiple}
      />
    </LayoutPopup>
  );
};

FileUploadModal.defaultProps = { multiple: false };

export default FileUploadModal;
