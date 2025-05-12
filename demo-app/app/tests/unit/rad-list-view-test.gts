import { setupRenderingTest } from "~/tests/helpers";
import { render, rerender } from '@ember/test-helpers';
import { RenderingTestContext } from "@ember/test-helpers/setup-rendering-context";
import { tracked } from '@glimmer/tracking';
import { RadListView } from 'ember-native';
import { modifier } from 'ember-modifier';

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

const onInsert = modifier(function setRef(element: any, [fn, ...args]: any) {
    fn(...args)
});


/**
 * mostly tests if glimmer is patched up correctly so that JS Objects can be passed through attributes
 * otherwise glimmer will stringify it. check ember-native setup.js patches on SimpleDynamicAttribute
 */
QUnit.module('RadListView | test', function(hooks) {
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

        let counter = 0;
        function count() {
            counter += 1;
        }

        await render(<template>
            <grid-layout rows="*">
                <RadListView row="1" @items={{test.list}}>
                    <:header><label>header</label></:header>
                    <:item as |item|>
                        <label  {{onInsert count}}>
                            {{item.label}}
                            {{call item.resolve 1}}
                        </label>
                    </:item>
                    <:footer><label>footer</label></:footer>
                </RadListView>
            </grid-layout>
        </template>);
        await Promise.all(test.list.map(x => x.promise));
        assert.equal(this.element.textContent.trim(), 'hello');
        assert.equal(counter, 1, '1 after first time render');

        await new Promise(resolve => setTimeout(resolve, 50));

        test.list = [...test.list, PromiseWithResolvers('world')];

        await rerender();
        await Promise.all(test.list.map(x => x.promise));
        await new Promise(resolve => setTimeout(resolve, 50));
        assert.equal(counter, 2, '2 after first time render');

        assert.dom(this.element as Element).containsText('hello');
        assert.dom(this.element as Element).containsText('world');

        await new Promise(resolve => setTimeout(resolve, 50));

        test.list = [PromiseWithResolvers('hi')];

        await rerender();
        await Promise.all(test.list.map(x => x.promise));
        await new Promise(resolve => setTimeout(resolve, 50));

        assert.dom(this.element as Element).doesNotContainText('hello');
        assert.dom(this.element as Element).doesNotContainText('world');
        assert.dom(this.element as Element).containsText('hi');
    });
});
