declare module 'loader.js' {
  declare const require: Function;
  declare const define: Function;
}

declare module '@glint/environment-ember-loose/registry' {
  import type { EmbroiderUtilRegistry } from '@embroider/util';
  export default interface Registry extends EmbroiderUtilRegistry {
    // ...
  }
}
