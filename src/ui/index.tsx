import React from 'react'
import * as ReactDOM from 'react-dom'
import "./ui.css";

import Home from './views/Home'

import useStore from './useStore'

/** Manages view changes and creates the store */
function App() {
  const {Provider, store} = useStore()
  
  const loading = !store.activeFormat || !store.settings

  function buildView() {
    if (loading) return <p>Loading...</p>
    return <Home/>
  }

  return (
    <Provider>
      {buildView()}
    </Provider>
  );
}

ReactDOM.render(<App/>, document.getElementById('react-app'))