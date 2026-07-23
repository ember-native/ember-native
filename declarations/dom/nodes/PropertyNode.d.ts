import ElementNode from './ElementNode.ts';
import ViewNode from './ViewNode.ts';
export default class PropertyNode extends ElementNode {
    constructor(tagName: string);
    get propertyName(): string;
    onInsertedChild(): void;
    onRemovedChild(): void;
    toString(): string;
    setOnNode(parent: ViewNode | null): void;
    clearOnNode(parent: ViewNode): void;
}
