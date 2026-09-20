import type { TemplateOnlyComponent } from '@ember/component/template-only';
export declare function withTemplateForTest<T extends abstract new (...args: never[]) => object>(Component: T, template: TemplateOnlyComponent<unknown>): T;
