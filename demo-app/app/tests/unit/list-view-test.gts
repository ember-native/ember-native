import { setupRenderingTest } from "~/tests/helpers";
import { render, rerender } from '@ember/test-helpers';
import { RenderingTestContext } from "@ember/test-helpers/setup-rendering-context";
import { tracked } from '@glimmer/tracking';
import { ListView } from 'ember-native';
import { modifier } from 'ember-modifier';

const onInsert = modifier(function setRef(element: any, [fn, ...args]: any) {
    fn(...args)
});

function PromiseWithResolvers(label) {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    const ref = {
        called: 0
    };
    const rendered = () => {
        ref.called += 1;
    }
    return {
        promise,
        label,
        ref,
        rendered,
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

        let counter = 0;
        function count() {
            counter += 1;
        }

        await render(<template>
            <stack-layout>
                <ListView height="100%" @items={{test.list}}>
                    <:item as |item|>
                        <label {{onInsert count}}>
                            {{item.label}}
                            {{call item.resolve 1}}
                        </label>
                    </:item>
                </ListView>
            </stack-layout>
        </template>);
        await Promise.all(test.list.map(x => x.promise));
        assert.equal(this.element.textContent.trim(), 'hello');
        assert.equal(counter, 1, '1 after first time render');

        test.list = [...test.list, PromiseWithResolvers('world')];

        await rerender();
        await Promise.all(test.list.map(x => x.promise));
        assert.equal(counter, 2, '2 after second time render');

        assert.dom(this.element as Element).containsText('hello');
        assert.dom(this.element as Element).containsText('world');

        test.list = [...test.list, PromiseWithResolvers('again')];

        await rerender();
        await Promise.all(test.list.map(x => x.promise));
        assert.equal(counter, 3, '3 after second time render');

        test.list = [PromiseWithResolvers('hi')];

        await rerender();
        await Promise.all(test.list.map(x => x.promise));
        assert.equal(counter, 4, '4 after third time render');

        assert.dom(this.element as Element).doesNotContainText('hello');
        assert.dom(this.element as Element).doesNotContainText('world');
        assert.dom(this.element as Element).containsText('hi');
    });
});
