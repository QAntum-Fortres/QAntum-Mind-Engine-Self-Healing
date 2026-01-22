import React from 'react'
import ReactDOM from 'react-dom/client'
import Singularity from './Singularity.tsx'
import './index.css'

// Brutalist global styles
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');

  :root {
    --void: #050505;
    --matrix: #00FF41;
    --alert: #FF0055;
    --gold: #D4AF37;
    --cyan: #00F3FF;
  }

  body {
    background-color: var(--void);
    color: var(--matrix);
    font-family: 'JetBrains Mono', monospace;
    overflow: hidden;
  }

  .scanline {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(
      to bottom,
      rgba(0, 255, 65, 0) 50%,
      rgba(0, 255, 65, 0.05) 50%
    );
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 9999;
  }

  .vignette {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle, transparent 50%, black 150%);
    pointer-events: none;
    z-index: 9998;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="scanline" />
    <div className="vignette" />
    <Singularity />
  </React.StrictMode>,
)
