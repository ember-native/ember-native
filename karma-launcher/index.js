'use strict';

var fork = require('child_process').fork;
var which = require('shelljs').which;

var fs = require('fs');
var os = require('os');
var path = require('path');
var URL = require('url');
var util = require('util');

var TEST_RUNNER_DIR = path.join(__dirname, 'runner');

function getTnsCliExecutablePath() {
	var pathToTnsExecutable = which('tns');
	return path.join(path.dirname(pathToTnsExecutable), "nativescript.js");
}

function NativeScriptLauncher(baseBrowserDecorator, logger, config, args, emitter, executor) {
	var self = this;

	baseBrowserDecorator(self);
	self.log = logger.create('launcher');

	if (!args.platform) {
		self.log.error('No platform specified.');
		process.exit(1);
	}

	self.platform = args.platform;

	var launcherConfig = config._NS || {};

	emitter.on('browser_register', function(browser) {
		// Matched on `fullName` (the device-reported display name, always
		// `NativeScript / ...`), not `id` - `self.start` below hands the
		// device our own launcher `id` so karma's singleRun bookkeeping can
		// find it again (see that comment), so `browser.id` is no longer
		// guaranteed to start with "NativeScript".
		if (!browser.fullName || browser.fullName.indexOf('NativeScript') !== 0) {
			return;
		}

		self.markCaptured();

		// In case --watch is passed to CLI, each change in file should restart the tests.
		// When a new browser is registered, in case `singleRun` is false (that's when --watch is not passed)
		// tests should be scheduled.
		// When `singleRun` is true, karma automatically runs the tests when browser is registered,
		// so do not schedule them in this case.
		if(launcherConfig.options.watch) {
			executor.schedule();
		}
	});

	function logDebugOutput(data) {
		process.stdout.write(data);
	}

	// Consider removing this in case we drop support for `tns dev-test` command
	self.liveSyncAndRun = function() {
		var tnsArgs = ['dev-test', self.platform, '--port', self.parsedUrl.port];
		if (args.arguments) {
			tnsArgs = tnsArgs.concat(args.arguments);
		}

		if (launcherConfig.log) {
			tnsArgs = tnsArgs.concat(['--log', launcherConfig.log]);
		}

		if (typeof launcherConfig.path !== 'undefined') {
			tnsArgs = tnsArgs.concat(['--path', launcherConfig.path]);
		}

		var tnsCli = launcherConfig.tns || getTnsCliExecutablePath();
		self.log.debug('Starting "' + tnsCli + '" ' + tnsArgs.join(' '));

		var runner = fork(tnsCli, tnsArgs);

		runner.on('message', function(data) {
			if (data === "ready") {
				// Child process is ready to read the data
				var optionsStr = JSON.stringify(launcherConfig.options);
				runner.send(optionsStr);
			}
		});

		runner.on('error', logDebugOutput);
		runner.on('data', logDebugOutput);
		runner.on('exit', function(code) {
			self.log.info('NativeScript deployment completed with code ' + code);
			if (code) {
				process.exit(code);
			}
		});
	}

	self.start = function(url) {
		self.parsedUrl = URL.parse(url);
		// Include our own `id` alongside the regular launcher options - karma
		// core's singleRun completion (`singleRunDoneBrowsers`/`launcher.kill`
		// in karma's server.js/launcher.js) keys everything off the id the
		// *launcher* was assigned when it launched a browser, expecting the
		// browser to report that same id back on `register`. A normal
		// browser launcher guarantees this by passing `?id=` in the URL it
		// opens; this launcher never did (the device makes up its own random
		// id instead), so karma's bookkeeping key (this launcher's id) never
		// gets marked done and `run_complete` never fires - the whole test
		// process just hangs forever after the last test finishes, until
		// something kills it. Passing `id` through `launcherConfig` (which
		// the NativeScript CLI already forwards verbatim into the on-device
		// `config.js`, see `nativescript`'s `TestExecutionService.generateConfig`)
		// lets `unit-test-runner`'s `main-view-model.js` use it for
		// `register` instead of a random id.
		process.send({ url: self.parsedUrl, launcherConfig: JSON.stringify(Object.assign({}, launcherConfig.options, { id: self.id })) });
	}
}

NativeScriptLauncher.prototype = {
	name: 'NativeScript Unit Test Runner'
}

module.exports = {
  'launcher:NS': ['type', NativeScriptLauncher]
};
