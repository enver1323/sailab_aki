import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
  * {
    margin: 0;
    box-sizing: border-box;
    padding: 0;
    font-family: "Noto Sans KR", Inter, Avenir, Helvetica, Arial, sans-serif;
  }

  
  html {
    min-width: 1400px;
    position: relative;
    font-size: 16px;
  }

  body {
    font-size: 1.6rem;
  }

  a {
    cursor: pointer;
    text-decoration: inherit;
    &:focus {
      outline: none;
    }
  }
  button {
    border: none;
    cursor: pointer;
    &:disabled {
      cursor: default;
    }
  }
  input {
    border: none;
    outline: none;
    background: none;
  }
`;
