// Critical CSS extraction utility
// This helps reduce render-blocking by inlining critical styles

export const criticalStyles = `
  /* Reset and base */
  *,::before,::after{box-sizing:border-box;border:0 solid}
  html{-webkit-text-size-adjust:100%;tab-size:4;font-family:ui-sans-serif,system-ui,sans-serif}
  body{margin:0;line-height:inherit}
  
  /* Gradient backgrounds */
  .bg-gradient-hero{background:linear-gradient(135deg,#1a1a1a 0%,#262626 50%,#8B1A1A 100%)}
  .bg-gradient-subtle{background:linear-gradient(180deg,hsl(var(--background)) 0%,hsl(var(--muted)) 100%)}
  
  /* Animations */
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}
  
  /* Utility classes for hero */
  .min-h-screen{min-height:100vh}
  .flex{display:flex}
  .items-center{align-items:center}
  .justify-center{justify-content:center}
  .text-center{text-align:center}
  .text-white{color:#fff}
  .drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]{filter:drop-shadow(0 20px 40px rgba(0,0,0,.25))}
`;

export const injectCriticalStyles = () => {
  if (typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = criticalStyles;
  document.head.appendChild(style);
};
