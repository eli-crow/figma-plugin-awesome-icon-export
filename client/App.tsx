import React, { ReactElement } from 'react'

import Home from './views/Home'
import Editor from './views/Editor'

import useStore, {PluginContext} from './store'

/** Manages view changes and creates the store */
function App(): ReactElement {
  const store = useStore()

  function buildView() {
    if (!store.isLoaded){
      return <p className="Loading">Loading...</p> 
    } 
    else if (store.editingFormat) {
      return <Editor/>
    }
    else if (store.activeFormat) {
      return <Home/>
    }
    else {
      return <pre>{JSON.stringify(store, null, '\t')}</pre>
    }
  }
  
  return (
    <PluginContext.Provider value={store}>
      {buildView()}
    </PluginContext.Provider>
  );
}

export default App