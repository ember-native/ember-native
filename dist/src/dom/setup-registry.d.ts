import { View } from '@nativescript/core';
import { ComponentMeta } from './native/NativeElementNode';
export declare function registerNativeElement(elementName: string, resolver: () => typeof View, meta?: ComponentMeta): void;
export declare function registerElements(): void;
