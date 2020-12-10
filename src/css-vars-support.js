let isCssVarsSupported;
const cssVarsSupported = () => {
  if (typeof isCssVarsSupported !== 'boolean') {
    const el = document.createElement('div');
    el.style.setProperty('--var', 'none');
    el.style.setProperty('display', 'var(--var)');
    document.body.appendChild(el);
    isCssVarsSupported = getComputedStyle(el).display === 'none';
    document.body.removeChild(el);
  }
  return isCssVarsSupported;
};
export {cssVarsSupported};
