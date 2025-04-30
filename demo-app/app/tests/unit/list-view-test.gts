import { setupRenderingTest } from "~/tests/helpers";
import { render, rerender } from '@ember/test-helpers';
import { RenderingTestContext } from "@ember/test-helpers/setup-rendering-context";
import { tracked } from '@glimmer/tracking';
import { ListView } from 'ember-native';

function PromiseWithResolvers(label) {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return {
        promise,
        label,
        resolve,
        reject
    }
}


/**
 * mostly tests if glimmer is patched up correctly so that JS Objects can be passed through attributes
 * otherwise glimmer will stringify it. check ember-native setup.js patches on SimpleDynamicAttribute
 */
QUnit.module('ListView | test', function(hooks) {
    setupRenderingTest(hooks);

    class Test {
        @tracked list = [PromiseWithResolvers('hello')];
    }

    QUnit.test('shows & updates list', async function(this: RenderingTestContext, assert) {
        const test = new Test();

        function call(fn, param) {
            fn(param);
            return '';
        }

        await render(<template>
            <stack-layout>
                <ListView height="100%" @items={{test.list}}>
                    <:item as |item|>
                        <label>
                            {{item.label}}
                            {{call item.resolve 1}}
                        </label>
                    </:item>
                </ListView>
            </stack-layout>
        </template>);
        await Promise.all(test.list.map(x => x.promise));
        assert.equal(this.element.textContent.trim(), 'hello');

        test.list = [PromiseWithResolvers('hello'), PromiseWithResolvers('world')];

        await rerender();
        await Promise.all(test.list.map(x => x.promise));

        assert.dom(this.element as Element).containsText('hello');
        assert.dom(this.element as Element).containsText('world');

        test.list = [PromiseWithResolvers('hi')];

        await rerender();
        await Promise.all(test.list.map(x => x.promise));

        assert.dom(this.element as Element).doesNotContainText('hello');
        assert.dom(this.element as Element).doesNotContainText('world');
        assert.dom(this.element as Element).containsText('hi');
    });
});
