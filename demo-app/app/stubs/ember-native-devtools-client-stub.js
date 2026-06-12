// NativeScript-compatible stub for ember-native-devtools/client
// socket.io-client and Node.js-specific APIs (url, module, path) are not
// available in the NativeScript JS runtime, so we implement the inspector
// client using the native WebSocket API (polyfilled by @valor/nativescript-websockets).

// Ensure WebSocket is available in NativeScript's global scope.
import '@valor/nativescript-websockets';

function createSocket(serverUrl, options = {}) {
  const {
    reconnection = true,
    reconnectionDelay = 1000,
    reconnectionAttempts = 5,
  } = options;

  let ws = null;
  let _connected = false;
  let reconnectCount = 0;
  let reconnectTimer = null;
  const listeners = {};

  // socket.io uses a WebSocket subprotocol upgrade path: /socket.io/?EIO=4&transport=websocket
  const wsUrl = serverUrl.replace(/^http/, 'ws') + '/socket.io/?EIO=4&transport=websocket&type=app';

  const socket = {
    id: null,
    get connected() {
      return _connected;
    },

    on(event, handler) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(handler);
      return socket;
    },

    off(event, handler) {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((h) => h !== handler);
      }
      return socket;
    },

    emit(event, ...args) {
      if (!_connected || !ws) return socket;
      try {
        // socket.io v4 message packet type 2
        ws.send('42' + JSON.stringify([event, ...args]));
      } catch (e) {
        console.warn('[EmberInspector] emit error:', e?.message);
      }
      return socket;
    },

    connect() {
      if (ws) return socket;
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // socket.io EIO4 handshake: send a connect packet ("40")
          ws.send('40');
        };

        ws.onmessage = (event) => {
          const data = event.data;
          if (typeof data !== 'string') return;

          // EIO4 open packet
          if (data.startsWith('0')) {
            try {
              const payload = JSON.parse(data.slice(1));
              socket.id = payload.sid;
            } catch (_) {}
            return;
          }

          // socket.io connected packet "40"
          if (data === '40') {
            _connected = true;
            reconnectCount = 0;
            _fire('connect');
            return;
          }

          // socket.io connected with namespace + sid "40{...}"
          if (data.startsWith('40{')) {
            _connected = true;
            reconnectCount = 0;
            try {
              const payload = JSON.parse(data.slice(2));
              socket.id = payload.sid || socket.id;
            } catch (_) {}
            _fire('connect');
            return;
          }

          // socket.io ping (EIO heartbeat)
          if (data === '2') {
            ws.send('3');
            return;
          }

          // socket.io event packet "42[...]"
          if (data.startsWith('42')) {
            try {
              const [eventName, ...args] = JSON.parse(data.slice(2));
              _fire(eventName, ...args);
            } catch (_) {}
          }
        };

        ws.onerror = (err) => {
          _fire('connect_error', err);
        };

        ws.onclose = (event) => {
          ws = null;
          if (_connected) {
            _connected = false;
            _fire('disconnect', event.reason || 'transport close');
          }
          if (reconnection && reconnectCount < reconnectionAttempts) {
            reconnectCount++;
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              socket.connect();
            }, reconnectionDelay);
          }
        };
      } catch (e) {
        console.warn('[EmberInspector] WebSocket connect error:', e?.message);
      }
      return socket;
    },

    disconnect() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
      _connected = false;
    },
  };

  function _fire(event, ...args) {
    const handlers = listeners[event];
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(...args);
        } catch (e) {
          console.warn('[EmberInspector] handler error:', e?.message);
        }
      });
    }
  }

  return socket;
}

export function setupEmberInspector(options = {}) {
  const {
    serverUrl = 'http://10.0.2.2:9230',
    appName = 'Ember App',
    autoConnect = true,
    verbose = false,
  } = options;

  const log = (...args) => {
    if (verbose) console.log('[Ember Inspector]', ...args);
  };

  let socket = null;

  // Monkey-patch emit to drop messages when disconnected (prevents buffering).
  function patchSocket(s) {
    const originalEmit = s.emit.bind(s);
    s.emit = function (...args) {
      if (s.connected) return originalEmit(...args);
      return s;
    };
    return s;
  }

  const client = {
    connect() {
      if (socket) {
        log('Already connected');
        return socket;
      }

      log(`Connecting to inspector server at ${serverUrl}...`);

      socket = patchSocket(createSocket(serverUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      }));

      // Expose socket to ember_debug via global config.
      const config = {
        remoteDebugSocket: socket,
        appName,
      };
      if (typeof globalThis !== 'undefined') {
        globalThis.EMBER_INSPECTOR_CONFIG = config;
      }

      socket.on('connect', () => {
        console.log('✅ Connected to Ember Inspector server');
        log(`Socket ID: ${socket.id}`);
      });

      socket.on('disconnect', (reason) => {
        console.log('⚠️  Disconnected from Ember Inspector server:', reason);
      });

      socket.on('connect_error', (error) => {
        console.warn('❌ Failed to connect to Ember Inspector server:', error?.message || error);
      });

      socket.connect();
      return socket;
    },

    disconnect() {
      if (socket) {
        log('Disconnecting from inspector server...');
        socket.disconnect();
        socket = null;
      }
    },

    get isConnected() {
      return socket?.connected ?? false;
    },

    get socket() {
      return socket;
    },
  };

  if (autoConnect) {
    client.connect();
  }

  return client;
}

export async function loadEmberDebug() {
  try {
    await import('ember-inspector/dist/websocket/ember_debug.js');
  } catch (e) {
    console.warn('❌ Failed to load ember_debug:', e?.message || e);
  }
}

export default setupEmberInspector;
