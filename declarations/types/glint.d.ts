import NativeElementNode from '../dom/native/NativeElementNode';
import '@glint/environment-ember-template-imports/globals';
import '@glint/template/-private/dsl/emit';
import type { ComponentLike, ModifierLike } from '@glint/template';
import type { ViewBase } from '@nativescript/core';
import 'ember-modifier';
import type { EmptyObject, NamedArgs, PositionalArgs } from 'ember-modifier/-private/signature';
import type { FunctionBasedModifier, Teardown } from 'ember-modifier/-private/function-based/modifier';
import type { NativeElementsTagNameMap } from '../dom/native-elements-tag-name-map.ts';
declare module 'ember-modifier' {
    type ViewNode<T extends ViewBase> = import('../dom/native/NativeElementNode').default<T>;
    function modifier<E extends ViewNode<T>, P extends unknown[] = [], N = EmptyObject, T extends ViewBase = ViewBase>(fn: (element: E, positional: P, named: N) => void | Teardown): FunctionBasedModifier<{
        Args: {
            Positional: P;
            Named: N;
        };
        Element: E;
    }>;
    type ElementFor<S, T extends ViewBase = ViewBase> = 'Element' extends keyof S ? S['Element'] extends ViewNode<T> ? S['Element'] : ViewNode<T> : ViewNode<T>;
    function modifier<S>(fn: (element: ElementFor<S>, positional: PositionalArgs<S>, named: NamedArgs<S>) => void | Teardown): FunctionBasedModifier<{
        Element: ElementFor<S>;
        Args: {
            Named: NamedArgs<S>;
            Positional: PositionalArgs<S>;
        };
    }>;
}
declare module '@glint/environment-ember-template-imports/globals' {
    type InElementKeyword = ComponentLike<{
        Args: {
            Positional: [element: NativeElementNode<any>];
            Named: {
                insertBefore?: null | undefined;
            };
        };
        Blocks: {
            default: [];
        };
    }>;
    export default interface Globals {
        'in-element': InElementKeyword;
    }
}
declare module '@glint/template/-private/dsl/emit' {
    function emitElement<Name extends string>(name: Name): {
        element: Name extends keyof NativeElementsTagNameMap ? NativeElementsTagNameMap[Name] : NativeElementNode<null>;
    };
    function applySplattributes<SourceElement extends NativeElementNode<any>, TargetElement extends SourceElement>(source: SourceElement, target: TargetElement): void;
    function applyAttributes<T extends ViewBase>(element: NativeElementNode<T>, attrs: Record<string, any>): void;
    function applySplattributes<T extends ViewBase, SourceElement extends NativeElementNode<T>, TargetElement extends SourceElement>(source: SourceElement, target: TargetElement): void;
}
declare module '@ember/modifier' {
    interface OnModifierArgs {
        capture?: boolean;
        once?: boolean;
        passive?: boolean;
    }
    type OnModifierType = abstract new <Name extends string>() => InstanceType<ModifierLike<{
        Element: NativeElementNode<ViewBase>;
        Args: {
            Named: OnModifierArgs;
            Positional: [name: Name, callback: (event: any) => void];
        };
    }>>;
    interface OnModifier extends OnModifierType {
    }
}
