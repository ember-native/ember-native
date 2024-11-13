import { service } from '@ember/service';
import Component from '@glimmer/component';
import { NavigationTransition, NavigationEntry } from '@nativescript/core';
import { on } from '@ember/modifier';
import type NativeRouter from 'ember-native/services/native-router';

export interface LinkToInterface {
    Args: {
        route: string;
        text: string;
        model?: any;
        animated?: boolean;
        transitionName?: NavigationTransition['name'];
        transitionDuration?: NavigationTransition['duration'];
        transitionInstance?: NavigationTransition['instance'];
        transitionCurve?: NavigationTransition['curve'];
    }
}


export default class LinkTo extends Component<LinkToInterface> {
    @service('ember-native/native-router') nativeRouter: NativeRouter;
    onClick = () => {
        const args = this.args;
        const options: NavigationEntry = {
            animated: args.animated,
            transition: {
                duration: this.args.transitionDuration,
                name: this.args.transitionName,
                instance: this.args.transitionInstance,
                curve: this.args.transitionCurve
            }
        };
        if (this.args.model) {
            this.nativeRouter.transitionTo(this.args.route, this.args.model, options);
        } else {
            this.nativeRouter.transitionTo(this.args.route, undefined, options);
        }
    }
    <template>
        <button ...attributes text={{@text}} class="btn link-to" {{on 'tap' this.onClick}}>{{yield}}</button>
    </template>
}
