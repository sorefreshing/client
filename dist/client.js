(() => {
  // src/log.js
  var error = console.error.bind(console, "\u21BB refreshing:");
  var info = console.info.bind(console, "\u21BB refreshing:");
  var refresh = "Please refresh the page";
  var warn = console.warn.bind(console, "\u21BB refreshing:");

  // src/socket.js
  var ignoreCodes = [1008, 1011];
  var maxAttempts = 10;
  var uri = "wss://ws.refreshing.to";
  var Socket = class {
    constructor() {
      this.attempts = 0;
      this.eventHandlers = [];
      this.retrying = false;
      this.connect();
    }
    addEventListener(...args) {
      this.eventHandlers.push(args);
      this.socket.addEventListener(...args);
    }
    close() {
      this.socket.close();
    }
    connect() {
      if (this.socket) {
        delete this.socket;
      }
      this.connecting = true;
      this.socket = new WebSocket(uri);
      this.socket.addEventListener("close", (event) => {
        if (ignoreCodes.includes(event.code)) {
          return;
        }
        if (!this.retrying) {
          warn(`The WebSocket was closed and will attempt to reconnect`);
        }
        this.reconnect();
      });
      this.socket.addEventListener("open", () => {
        this.attempts = 0;
        this.retrying = false;
      });
      if (this.eventHandlers.length) {
        for (const [name, fn] of this.eventHandlers) {
          this.socket.addEventListener(name, fn);
        }
      }
    }
    reconnect() {
      this.attempts += 1;
      this.retrying = true;
      if (this.attempts > maxAttempts) {
        error(`The WebSocket could not be reconnected. ${refresh}`);
        this.retrying = false;
        return;
      }
      const timeout = 1e3 * this.attempts ** 2;
      setTimeout(() => this.connect(), timeout);
    }
    removeEventListener(...args) {
      const [, handler] = args;
      this.eventHandlers = this.eventHandlers.filter(([, fn]) => fn === handler);
      this.socket.removeEventListener(...args);
    }
    send(action, data) {
      const ourData = JSON.stringify({ action, data });
      this.socket.send(JSON.stringify({
        data: ourData,
        message: "sendmessage"
      }));
    }
  };

  // src/client.js
  var tags = {};
  var refreshingId = "\u0183u\u1D09\u0265s\u01DD\u0279\u025F\u01DD\u0279";
  window[refreshingId] = window[refreshingId] || {};
  var once = (fn) => {
    let result;
    let ran = false;
    return (...args) => {
      if (ran)
        return result;
      ran = true;
      result = fn(...args);
      return result;
    };
  };
  var init = ({ accountId, appId }) => {
    let { socket } = window[refreshingId];
    if (socket)
      return;
    window.addEventListener("beforeunload", () => socket.close());
    window[refreshingId].socket = new Socket();
    ({ socket } = window[refreshingId]);
    socket.addEventListener("message", (message) => {
      const { action, data = {} } = JSON.parse(message.data);
      const refreshFn = tags[data.tagId];
      switch (action) {
        case "connected":
          info("WebSocket connected");
          break;
        case "ping":
          socket.send("pong", {});
          break;
        case "refresh":
          if (refreshFn)
            refreshFn();
          break;
        default:
          warn(`Unknown message:`, message);
          break;
      }
    });
    socket.addEventListener("open", () => {
      info("WebSocket open");
      const message = {
        action: "init",
        data: { accountId, appId }
      };
      socket.send(JSON.stringify(message));
    });
  };
  window[refreshingId].init = once((...args) => {
    init(...args);
  });
  window[refreshingId].component = ({ fn, tagId }) => {
    tags[tagId] = fn;
  };
  window[refreshingId].page = ({ tagId }) => {
    tags[tagId] = () => window.location.reload();
  };
})();
