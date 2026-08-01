import { Observable, ObservableArray, Http, Device, Frame, isAndroid } from '@nativescript/core';
import { KarmaHostResolver } from './services/karma-host-resolver';
import { KarmaFilesService } from './services/karma-files-service';
import { TestExecutionService } from './services/test-execution-service';
import { killProcess } from './stop-process';
import { executeRegisteredTests } from './services/test-runner-registry';

// `config.js` is generated fresh by the `nativescript` CLI's own
// `TestExecutionService.generateConfig` right before every `nativescript
// test android` run, written straight into this package's own directory
// (`TestExecutionService.CONFIG_FILE_NAME`, hardcoded in the CLI to
// `node_modules/@nativescript/unit-test-runner/config.js` - see
// VITE_MIGRATION_NOTES.md's "Our own unit test runner" section for why this
// package still has to keep that exact name/path even though it's no longer
// the upstream npm package). The committed `config.js` here is just a
// placeholder so imports resolve before the first real test run.
//
// Both `config` and `socket.io-client` are imported as namespaces with a
// manual CJS-interop fallback, not plain default imports: Rollup can't
// always statically prove a safe-to-eagerly-evaluate `default` export for
// these two (observed flipping between passing/failing across otherwise
// identical builds depending on cached dep-optimization state), and when it
// can't, it synthesizes a frozen namespace object with only a lazy
// `__require()` accessor - a plain default import or `ns.default || ns`
// fallback then either gets `undefined` or throws when this file's own
// `config.options = ...` mutation hits that frozen object.
import * as configModule from '../config';
import * as socketIOModule from 'socket.io-client';

function resolveCjsInterop(ns) {
  if (ns.default !== undefined) return ns.default;
  if (typeof ns.__require === 'function') return ns.__require();
  return ns;
}

const config = resolveCjsInterop(configModule);
const io = resolveCjsInterop(socketIOModule);

function enableSocketIoDebugging() {
  console.log('enabling socket.io debugging');
  global.localStorage = { debug: '*' };
  global.window = global;
}

config.options = config.options || {};
if (isAndroid) {
  config.ips = (config.ips || []).concat(['10.0.2.2']);
}
if (!config.options.appDirectoryRelativePath) {
  config.options.appDirectoryRelativePath = 'app';
}

export class TestBrokerViewModel extends Observable {
  constructor() {
    super();
    global.__karma__ = this;
    if (config.options.debugTransport) {
      enableSocketIoDebugging();
    }
    this.testResults = new ObservableArray();
    this.updateView({
      testResults: this.testResults,
      serverInfo: 'disconnected',
      imageSrc: this.getImageSrc(),
      goToTestsText: 'Run Tests',
      isConnected: false,
      testsPassed: '-',
      testsFailed: '-',
      testsRan: 0,
      testsTotal: 0,
    });
    this.startEmitted = false;
    this.karmaHostResolver = new KarmaHostResolver(Http);
    this.karmaFilesService = new KarmaFilesService(Http, config);
    this.testExecutionService = new TestExecutionService();
    this.karmaHostResolver
      .resolveKarmaHost(config.ips, config.port)
      .then((hostIP) => {
        const serverInfo = hostIP ? `found karma at ${hostIP}` : 'no reachable hosts';
        this.updateView({ serverInfo });
        this.connectToKarma(hostIP);
      })
      .catch((e) => console.log(e.toString()));
  }

  viewTestRunDetails() {
    this.navigateTo('run-details');
  }

  beginLocalRun() {
    this.config = this.config || { args: [] };
    this.navigateTo('test-run-page');
  }

  onKarmaExecute(cfg) {
    this.karmaRequestedRun = true;
    this.config = cfg;
    this.beginLocalRun();
  }

  executeTestRun() {
    if (this.executed) {
      console.log('NSUTR: disregarding second execution');
      return;
    }
    this.executed = true;
    this.startEmitted = false;
    this.hasError = false;
    this.set('goToTestsText', 'View Test Run');
    this.karmaFilesService.getServedFilesData(this.baseUrl).then((scriptsContents) => setTimeout(() => this.runTests(scriptsContents), 0));
  }

  async runTests(scripts) {
    const errors = this.testExecutionService.runTests(scripts);
    errors.forEach((err) => this.error(err.msg, err.url, err.line));
    try {
      await executeRegisteredTests();
    } catch (e) {
      this.error(`${e?.message || e}`);
    }
    if (!this.hasError) {
      console.log('NSUTR: beginning test run');
      if (config.options.debugBrk) {
        // eslint-disable-next-line no-debugger
        debugger;
      }
      this.start(this.config);
    }
  }

  start() {
    this.error("You need to include a test adapter for the testing framework you're using");
  }

  info(data) {
    this.emitInfoToSocketIfNeeded(data);
    this.emitStartToSocketIfNeeded(data);
    if (Object.hasOwnProperty.call(data, 'total')) {
      this.updateView({
        testsRunning: true,
        testsPassed: 0,
        testsFailed: 0,
        testsRan: 0,
        testsTotal: data.total,
      });
    }
  }

  result(data) {
    this.emitStartToSocketIfNeeded({ total: null });
    this.emitToSocket('result', data);
    this.updateView({
      testsPassed: data.success ? this.get('testsPassed') + 1 : undefined,
      testsFailed: data.success ? undefined : this.get('testsFailed') + 1,
      testsRan: this.get('testsRan') + 1,
    });
    this.testResults.push(data);
  }

  complete(data) {
    console.log('NSUTR: completed test run.');
    this.set('testsRunning', false);
    delete this.start;
    let acknowledged = false;
    const ackFn = () => {
      if (acknowledged) {
        return;
      }
      acknowledged = true;
      console.log('NSUTR: completeAck');
      this.emitToSocket('disconnect');
      if (typeof __TEST_RUNNER_STAY_OPEN__ === 'undefined' || !__TEST_RUNNER_STAY_OPEN__) {
        setTimeout(() => killProcess(), 500);
      }
    };
    this.emitToSocket('complete', data || {}, ackFn);
    setTimeout(ackFn, 1000);
  }

  error(msg, url, line) {
    this.hasError = true;
    const fullMsg = url ? msg + '\nat ' + url + (line ? ':' + line : '') : msg;
    console.log('NSUTR: this.error: ' + fullMsg);
    this.result({
      id: url,
      description: `${url} at line ${line}` || '',
      log: [msg],
      time: 0,
      success: false,
      suite: [],
    });
    this.complete();
    return false;
  }

  connectToKarma(hostIP) {
    if (!hostIP) {
      return;
    }
    this.baseUrl = `http://${hostIP}:${config.port}`;
    console.log(`NSUTR: connecting to karma at ${this.baseUrl}`);
    global.navigator = { userAgent: 'nativescript' };
    global.document = { documentElement: { style: {} } };
    this.updateView({ serverInfo: `connected to ${this.baseUrl}` });
    // `transports: ['websocket']` - engine.io-client's default
    // (`['polling', 'websocket']`) always starts with an XHR polling
    // handshake, which hangs indefinitely under NativeScript's XHR
    // implementation for reasons never fully root-caused (see
    // VITE_MIGRATION_NOTES.md's socket.io section) even though raw
    // TCP/HTTP to the same endpoint works fine. Skipping polling entirely
    // and going straight to a real native WebSocket (via
    // `@valor/nativescript-websockets`, imported before this module in
    // demo-app's `boot-test.js` so `global.WebSocket` exists before
    // engine.io-client's websocket transport module evaluates) avoids XHR
    // altogether instead of trying to fix it.
    const socket = (this.socket = io.connect(this.baseUrl, {
      forceBase64: true,
      jsonp: false,
      reconnection: false,
      transports: ['websocket'],
    }));
    socket.on('connect', (err) => {
      console.log('NSUTR: successfully connected to karma');
      delete global.navigator;
      delete global.document;
      this.updateBanner('connected');
      this.updateView({ isConnected: true });
      socket.emit('register', {
        // Use the id `karma-ember-native-launcher` was assigned for this
        // run when it's available (see that package's own `self.start` in
        // ../../karma-launcher/index.js) instead of always making one up
        // here. Karma core's singleRun completion
        // bookkeeping keys off the id the *launcher* was assigned,
        // expecting the browser to report that same id back - a
        // self-picked random id here means that bookkeeping key never gets
        // marked done, `run_complete` never fires, and the whole
        // `nativescript test android` process just hangs forever after the
        // last test finishes. Falls back to a random id for any other
        // launcher (e.g. `dev-test`) that doesn't send one.
        id: config.options.id || 'NativeScriptUnit-' + (0 | (Math.random() * 10000)),
        name: `NativeScript / ${Device.sdkVersion} (${Device.osVersion}; ${Device.model})`,
      });
    });
    this.attachOnServerSocketEvents(socket);
  }

  attachOnServerSocketEvents(socket) {
    socket.on('disconnect', this.updateBanner('disconnected'));
    socket.on('reconnecting', this.updateBanner('reconnecting in $ ms...'));
    socket.on('reconnect_failed', this.updateBanner('failed to reconnect'));
    socket.on('connect_failed', this.updateBanner('connection failed'));
    socket.on('reconnect', this.updateBanner('connected'));
    socket.on('connect_error', (data) => console.log('NSUTR: socket.io error on connect: ' + data));
    socket.on('execute', this.onKarmaExecute.bind(this));
  }

  emitToSocket(...args) {
    if (this.karmaRequestedRun) {
      if (args.length > 0 && args[0] === 'disconnect') {
        this.socket.disconnect();
        return;
      }
      this.socket.emit.apply(this.socket, args);
    }
  }

  emitStartToSocketIfNeeded(data) {
    if (!this.startEmitted) {
      this.emitToSocket('start', data);
      this.startEmitted = true;
    }
  }

  emitInfoToSocketIfNeeded(data) {
    if (this.startEmitted) {
      this.emitToSocket('info', data);
    }
  }

  updateView(data) {
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        this.set(key, data[key]);
      }
    });
  }

  updateBanner(message) {
    return (err) => {
      this.updateView({ serverInfo: message });
      if (err) {
        console.log('NSUTR-socket.io: ' + err.toString());
      }
    };
  }

  navigateTo(pageName) {
    Frame.getFrameById('root-frame').navigate(pageName);
  }

  getImageSrc() {
    return 'data:image/png;base64,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';
  }
}

// Lazy singleton, not `export var mainViewModel = new TestBrokerViewModel()`
// (a real, eager module-top-level side effect) - the constructor calls
// `Http.getString(...)` (via `KarmaHostResolver`), which needs a running
// `Application` (native Android context) or it crashes. Rollup/Vite always
// eagerly evaluates a module once it's part of the bundle - even code only
// reachable via a dynamic `import()` can still end up merged into an
// eagerly-evaluated vendor chunk by Rollup's own chunking - so the
// singleton has to be lazy at the *language* level instead.
let mainViewModel;

export function getMainViewModel() {
  if (!mainViewModel) {
    mainViewModel = new TestBrokerViewModel();
  }
  return mainViewModel;
}

global.__onUncaughtError = (error) => {
  console.log('NSUTR: uncaught error');
  getMainViewModel().error(error.message);
};
