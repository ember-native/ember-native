declare namespace globalThis {
  let define: (p: string, cb: () => unknown) => void;
  let require: (p: string) => unknown;
  let requireModule: (p: string) => unknown;
}

declare module '@embroider/virtual/compat-modules';
