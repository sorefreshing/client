/*
  Copyright © 2022 Refreshment Ltd. Liability Co.

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
/* global window */
/* eslint-disable global-require */

import { info, warn } from './log';
import { Socket } from './socket';

const run = (buildHash, options) => {
  const { address, client = {} } = options;

  const protocol = 'wss';
  const socket = new Socket(
    client,
    `${client.protocol || protocol}://${client.address || address}/wps`
  );

  const { compilerName } = options;

  window.webpackPluginServe.compilers[compilerName] = {};

  // prevents ECONNRESET errors on the server
  window.addEventListener('beforeunload', () => socket.close());

  socket.addEventListener('message', (message) => {
    const { action, data = {} } = JSON.parse(message.data);

    switch (action) {
      case 'connected':
        info('WebSocket connected');
        break;
      case 'ping':
        socket.send('pong', {});
        break;
      case 'refresh':
        window.location.reload();
        break;
      default:
        warn(`Unknown message: ${action}`);
    }
  });
};

module.exports = { run };
