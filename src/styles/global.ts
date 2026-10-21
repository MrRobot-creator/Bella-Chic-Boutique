import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'DM Sans', Arial, sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background-color: #fff;
    color: #503b3f;
    background-image: radial-gradient(circle at 10% 10%, rgba(185, 139, 145, 0.08), transparent 40%),
      radial-gradient(circle at 90% 20%, rgba(201, 155, 161, 0.09), transparent 45%),
      radial-gradient(circle at 60% 85%, rgba(185, 139, 145, 0.06), transparent 50%);
    background-attachment: fixed;
    -webkit-font-smoothing: antialiased;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    font-family: inherit;
  }

  ul {
    list-style: none;
  }

  img {
    max-width: 100%;
    display: block;
  }

  button, input, select, textarea { font-family: inherit; }

  button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid #a96f79;
    outline-offset: 3px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      scroll-behavior: auto !important;
      transition-duration: .01ms !important;
      animation-duration: .01ms !important;
    }
  }
`

export default GlobalStyle
