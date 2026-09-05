import Component from '@glimmer/component';
import type PageStack from '../page-stack.ts';
export interface PageStackViewSignature {
    Args: {
        stack: PageStack;
    };
}
export default class PageStackView extends Component<PageStackViewSignature> {
    get entries(): {
        key: string | number;
        content: import("@glint/template").ComponentLike<{
            Args: {
                isActive: boolean;
            };
        }>;
        isActive: boolean;
    }[];
}
