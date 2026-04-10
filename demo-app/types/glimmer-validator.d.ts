// Ambient module declarations for internal Glimmer APIs
declare module '@glimmer/validator' {
  export interface Tag {
    [key: string]: unknown;
  }
  
  export function consumeTag(tag: Tag): void;
  export function createCache<T>(fn: () => T): { value: T };
  export function getValue<T>(cache: { value: T }): T;
  export function dirtyTag(tag: Tag): void;
}

// Extend Backburner to include _autorun property
declare module '@ember/runloop' {
  export interface Backburner {
    _autorun?: boolean;
    currentInstance?: unknown;
  }
  
  export const _backburner: Backburner;
}
