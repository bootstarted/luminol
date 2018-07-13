import React from 'react';
import blessed from 'blessed';
import {render} from 'react-blessed';

import AppRoot from './AppRoot';

const createUi = (client) => {
  // Creating our screen
  const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    title: 'webpack',
  });
  // Adding a way to quit the program
  screen.key(['escape', 'q', 'C-c'], (_ch, _key) => {
    return process.exit(0);
  });
  // Rendering the React app using our screen
  render(<AppRoot client={client} />, screen);
};

export default createUi;
