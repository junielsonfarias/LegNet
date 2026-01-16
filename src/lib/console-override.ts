// Override global console para suprimir warnings de desenvolvimento
if (typeof window !== 'undefined') {
  const originalConsole = { ...console };
  
  const shouldSuppress = (message: any): boolean => {
    if (typeof message === 'string') {
      return (
        message.includes('Extra attributes from the server') ||
        message.includes('Warning: Extra attributes') ||
        message.includes('data-new-gr-c-s-check-loaded') ||
        message.includes('data-gr-ext-installed') ||
        message.includes('cz-shortcut-listen') ||
        message.includes('warnForExtraAttributes') ||
        message.includes('Download the React DevTools') ||
        message.includes('class,style') ||
        message.includes('hydration') ||
        message.includes('Prop `className` did not match') ||
        message.includes('Server: "__className_') ||
        message.includes('Client: "__className_') ||
        message.includes('window.console.error') ||
        message.includes('console.error') ||
        message.includes('hydration-error-info.ts') ||
        message.includes('app-index.tsx') ||
        message === 'false' ||
        message === 'undefined' ||
        message === '{}' ||
        message.includes('89ab11b9ffc8d1e5416de675cd8f2997811d0a3c7989c8bb863b64f48f8d67b8608f8fb137a27ed860c229384e0ca724bbf8e2ade2f75ca17c8dec12cb6bf7ea') ||
        message.includes('[Fast Refresh]') ||
        message.includes('webpack-internal://') ||
        message.includes('app-index.js') ||
        message.includes('main-app.js')
      );
    }
    return false;
  };

  const createSuppressedMethod = (originalMethod: Function) => {
    return (...args: any[]) => {
      if (shouldSuppress(args[0])) {
        return;
      }
      originalMethod.apply(console, args);
    };
  };

  // Override todos os métodos do console
  console.error = createSuppressedMethod(originalConsole.error);
  console.warn = createSuppressedMethod(originalConsole.warn);
  console.log = createSuppressedMethod(originalConsole.log);
  console.info = createSuppressedMethod(originalConsole.info);
  console.debug = createSuppressedMethod(originalConsole.debug);

  // Interceptar também mensagens específicas do React
  const originalError = Error;
  (window as any).Error = function(message: string, ...args: any[]) {
    if (shouldSuppress(message)) {
      return new originalError('Suppressed error');
    }
    return new originalError(message + (args.length > 0 ? ' ' + args.join(' ') : ''));
  };

  // Suprimir warnings de hidratação
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Extra attributes from the server') ||
       message.includes('Warning: Extra attributes') ||
       message.includes('warnForExtraAttributes'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
