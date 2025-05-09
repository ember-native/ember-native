import { service } from '@ember/service';
import Component from '@glimmer/component';
import { Button, NavigationTransition } from '@nativescript/core';
import { on } from '@ember/modifier';
import type NativeRouter from 'ember-native/services/native-router';
import NativeElementNode from "ember-native/dom/native/NativeElementNode";

export interface LinkToInterface {
    Element: NativeElementNode<Button>,
    Args: {
        route: string;
        text?: string;
        model?: unknown;
        animated?: boolean;
        transitionName?: NavigationTransition['name'];
        transitionDuration?: NavigationTransition['duration'];
        transitionInstance?: NavigationTransition['instance'];
        transitionCurve?: NavigationTransition['curve'];
    },

    Blocks: {
        default: []
    }
}


export default class LinkTo extends Component<LinkToInterface> {
    @service('ember-native/native-router') nativeRouter: NativeRouter;
    onClick = () => {
        const args = this.args;
        const options = {
            animated: args.animated ?? true,
            transition: {
                duration: this.args.transitionDuration,
                name: this.args.transitionName,
                instance: this.args.transitionInstance,
                curve: this.args.transitionCurve
            }
        };
        const queryParams = {};
        if (this.args.model) {
            this.nativeRouter.transitionTo(this.args.route, this.args.model, queryParams, options);
        } else {
            this.nativeRouter.transitionTo(this.args.route, undefined, queryParams, options);
        }
    }
    <template>
        <button ...attributes text={{@text}} class="btn link-to" {{on 'tap' this.onClick}}>{{yield}}</button>
    </template>
}
