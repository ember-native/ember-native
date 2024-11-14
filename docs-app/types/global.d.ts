declare namespace globalThis {
  var define: (p: string, cb: () => any) => void;
}

declare module '@embroider/virtual/compat-modules';
