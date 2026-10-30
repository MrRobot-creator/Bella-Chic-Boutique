import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'DM Sans', 'Inter', Arial, sans-serif;
  }

  html { scroll-behavior: smooth; }

  body {
    background-color: #FFFCFB;
    color: #3E2A2E;
    -webkit-font-smoothing: antialiased;
  }

  /* Custom Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #fde9eb;
  }
  ::-webkit-scrollbar-thumb {
    background: #f4a3b1;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #c2405b;
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
    outline: 2px solid #c2405b;
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

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
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
