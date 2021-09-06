import React from 'react'
import * as ReactDOM from 'react-dom'
import "./ui.css";

import Home from './views/Home'
import Editor from './views/Editor'

import useStore from './store'

/** Manages view changes and creates the store */
function App() {
  const {Provider, store} = useStore()
  
  const loading = !store.settings

  function buildView() {
    if (loading) return <p className="Loading">Loading...</p>
    if (store.getEditingFormat() !== null) return <Editor/>
    return <Home/>
  }

  return (
    <Provider>
      {buildView()}
    </Provider>
  );
}

ReactDOM.render(<App/>, document.getElementById('react-app'))