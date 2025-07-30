import { View } from '@nativescript/core';
import { type ComponentMeta } from './native/NativeElementNode.ts';
export declare function registerNativeElement(elementName: string, resolver: () => typeof View, meta?: ComponentMeta | null): void;
export declare function registerElements(): void;
