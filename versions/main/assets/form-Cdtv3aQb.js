import { s as setComponentTemplate, t as templateOnly, a as templateFactory, o as on, f as fn } from './main-CjWhnG7r.js';
import { dataFrom } from './index-dGgzbTWI.js';

const dataFromEvent = dataFrom;
const handleInput = (onChange, event, eventType = "input") => {
  const data = dataFrom(event);
  onChange(data, eventType, event);
};
const handleSubmit = (onChange, event) => {
  event.preventDefault();
  handleInput(onChange, event, "submit");
};
const Form = setComponentTemplate(templateFactory(
/*
  
  <form {{on "input" (fn handleInput @onChange)}} {{on "submit" (fn handleSubmit @onChange)}} ...attributes>
    {{yield}}
  </form>

*/
{
  "id": "j1vDqtkF",
  "block": "[[[1,\"\\n  \"],[11,\"form\"],[17,1],[4,[32,0],[\"input\",[28,[32,1],[[32,2],[30,2]],null]],null],[4,[32,0],[\"submit\",[28,[32,1],[[32,3],[30,2]],null]],null],[12],[1,\"\\n    \"],[18,3,null],[1,\"\\n  \"],[13],[1,\"\\n\"]],[\"&attrs\",\"@onChange\",\"&default\"],false,[\"yield\"]]",
  "moduleName": "/home/runner/work/ember-native/ember-native/node_modules/.pnpm/ember-primitives@0.32.0_@babel+core@7.27.1_@ember+test-helpers@5.2.2_@babel+core@7.27.1_@glin_6tfyhtclqroved25hlgpx5igfy/node_modules/ember-primitives/dist/components/form.js",
  "scope": () => [on, fn, handleInput, handleSubmit],
  "isStrictMode": true
}), templateOnly(undefined, "form:Form"));

export { Form, dataFromEvent, Form as default };
