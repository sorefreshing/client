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

// TODO: assert a single socket
// TODO: single socket handles all messages
// When calling the main function in a snippet, we should "register" a refresher so the "refresh"
// message just bounces it off of all registered tags

const tags = {};
const refreshingId = 'ƃuᴉɥsǝɹɟǝɹ';
window[refreshingId] = window[refreshingId] || {};

const once = (fn) => {
  let result;
  let ran = false;
  return (...args) => {
    if (ran) return result;
    ran = true;
    result = fn(...args);
    return result;
  };
};

const init = ({ accountId, appId }) => {
  let { socket } = window[refreshingId];

  if (socket) return;

  // prevents ECONNRESET errors on the server
  window.addEventListener('beforeunload', () => socket.close());

  window[refreshingId].socket = new Socket();
  ({ socket } = window[refreshingId]);

  socket.addEventListener('message', (message) => {
    const { action, data = {} } = JSON.parse(message.data);
    const refreshFn = tags[data.tagId];

    switch (action) {
      case 'connected':
        info('WebSocket connected');
        break;
      case 'ping':
        info('sending pong');
        socket.send('pong', {});
        break;
      case 'refresh':
        if (refreshFn) refreshFn();
        break;
      default:
        warn(`Unknown message:`, message);
        break;
    }
  });

  socket.addEventListener('open', () => {
    info('WebSocket open');
    socket.send('init', { accountId, appId });
    info('init message sent');
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
