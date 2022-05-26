/*
  Copyright © 2018 Andrew Powell

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
/* global WebSocket */
import { error, refresh, warn } from './log';

// ignore 1008 (HTTP 400 equivalent) and 1011 (HTTP 500 equivalent)
const ignoreCodes = [1008, 1011];
const maxAttempts = 10;
const uri = 'wss://2qcdgvpfua.execute-api.us-east-1.amazonaws.com/stage';

export class Socket {
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

    this.socket.addEventListener('close', (event) => {
      if (ignoreCodes.includes(event.code)) {
        return;
      }

      if (!this.retrying) {
        warn(`The WebSocket was closed and will attempt to reconnect`);
      }

      this.reconnect();
    });

    this.socket.addEventListener('open', () => {
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

    const timeout = 1000 * this.attempts ** 2;

    setTimeout(() => this.connect(), timeout);
  }

  removeEventListener(...args) {
    const [, handler] = args;
    this.eventHandlers = this.eventHandlers.filter(([, fn]) => fn === handler);
    this.socket.removeEventListener(...args);
  }

  send(action, data) {
    this.socket.send(JSON.stringify({ action, data }));
  }
}
