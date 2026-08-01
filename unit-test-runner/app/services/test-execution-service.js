import { TYPE_TEST, TYPE_NODE_MODULE } from './karma-files-service';

export class TestExecutionService {
  runTests(scripts) {
    const errors = [];
    scripts
      .filter((script) => script.type === TYPE_NODE_MODULE || script.type === TYPE_TEST)
      .forEach((script) => {
        try {
          this.runTest(script);
        } catch (err) {
          errors.push({
            msg: err.toString(),
            url: script.url,
            line: err.lineNumber || 0,
          });
        }
      });
    return errors;
  }

  runTest(script) {
    if (!script.shouldEval) {
      console.log('NSUTR: ignoring evaluation of script ' + script.url);
      return;
    }
    console.log('NSUTR: eval script ' + script.url);
    this.loadShim(script.url);
    const geval = eval;
    geval(script.contents);
    this.completeLoading(script.url);
  }

  // karma-qunit's own adapter expects an AMD `define()`/global `QUnit` shim
  // around qunit.js's evaluation (matching how karma serves/loads it in a
  // real browser) - see the corresponding cleanup in `completeLoading`.
  loadShim(url) {
    if (url.indexOf('qunit.js') !== -1) {
      global.define = function (factory) {
        global.QUnit = factory();
      };
      global.define.amd = true;
    }
  }

  completeLoading(url) {
    if (url.indexOf('qunit.js') !== -1) {
      delete global.define;
    }
  }
}
