/**
 * THIS IS THE ENTRY POINT FOR THE CLIENT, JUST LIKE server.js IS THE ENTRY POINT FOR THE SERVER.
 */
import 'babel-polyfill';
import React from 'react';
import ReactDOM from 'react-dom';
import createStore from './redux/create';
import ApiClient from './helpers/ApiClient';
import io from 'socket.io-client';
import { Provider } from 'react-redux';
import { Router, browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { ReduxAsyncConnect } from 'redux-async-connect';
import useScroll from 'scroll-behavior/lib/useStandardScroll';

import getRoutes from './routes';

const client = new ApiClient();
const _browserHistory = useScroll(() => browserHistory)();
const dest = document.getElementById('content');
const store = createStore(_browserHistory, client, window.__data);
const history = syncHistoryWithStore(_browserHistory, store);

function initSocket() {
  const socket = io('', { path: '/ws' });
  socket.on('news', (data) => {
    console.log(data);
    socket.emit('my other event', { my: 'data from client' });
  });
  socket.on('msg', (data) => {
    console.log(data);
  });

  return socket;
}

global.socket = initSocket();

const component = (
  <Router render={(props) =>
    <ReduxAsyncConnect {...props} helpers={{ client }} filter={item => !item.deferred} />
  } history={history}>
    {getRoutes(store)}
  </Router>
);

ReactDOM.render(
  <Provider store={store} key="provider">
    {component}
  </Provider>,
  dest
);

if (process.env.NODE_ENV !== 'production') {
  window.React = React; // enable debugger

  if (!dest || !dest.firstChild || !dest.firstChild.attributes || !dest.firstChild.attributes['data-react-checksum']) {
    console.error('Server-side React render was discarded. Make sure that your initial render does not contain any client-side code.');
  }
}

// purpose: inject widget only on these conditions
if (window.location.search.includes('widgetInstalled=false')) {
  sessionStorage.removeItem('widgetInstalled');
} else if (window.location.search.includes('widgetInstalled=true')
  || sessionStorage.getItem('widgetInstalled') === 'true') {
  window.helppierDev = true;
  window.help_company_key = '07b272c75d4db593b5da3badcefe766d';
  const script = document.createElement('script');
  script.setAttribute('src',
    'http://localhost:3000/widget/js/start.js?help_company_key=07b272c75d4db593b5da3badcefe766d');
  script.setAttribute('id', 'helppierEmbed');
  script.setAttribute('defer', '');
  document.head.appendChild(script);

  // property can now be added on sessionStorage so widget can work on all pages
  sessionStorage.setItem('widgetInstalled', true);
}

if (__DEVTOOLS__ && !window.devToolsExtension) {
  const DevTools = require('./containers/DevTools/DevTools');
  ReactDOM.render(
    <Provider store={store} key="provider">
      <div>
        {component}
        <DevTools />
      </div>
    </Provider>,
    dest
  );
}
