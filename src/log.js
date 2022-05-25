/*
  Copyright © 2022 Refreshment Ltd. Liability Co.

  This Source Code Form is subject to the terms of the Mozilla Public
  License, v. 2.0. If a copy of the MPL was not distributed with this
  file, You can obtain one at http://mozilla.org/MPL/2.0/.

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of this Source Code Form.
*/
const { error, info, warn } = console;
export const log = {
  error: error.bind(console, '↻ refreshing:'),
  info: info.bind(console, '↻ refreshing:'),
  refresh: 'Please refresh the page',
  warn: warn.bind(console, '↻ refreshing:')
};
export const noop = () => {};
export const silent = {
  error: noop,
  info: noop,
  warn: noop
};
