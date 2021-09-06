import React, { ReactElement } from 'react'

import Home from './formats/views/Home'
import Editor from './formats/views/Editor'

import useStore from './store'

/** Manages view changes and creates the store */
function App(): ReactElement {
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

export default App