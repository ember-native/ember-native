declare namespace globalThis {
  var define: (p: string, cb: () => any) => void;
  var require: any;
  var requireModule: any;
}

declare module '@embroider/virtual/compat-modules';
