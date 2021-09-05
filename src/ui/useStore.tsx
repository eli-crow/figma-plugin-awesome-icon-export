import FileGenerator from "./FileGenerator";
import formats from './formats'
import PluginContext, { PluginStore } from './context';
import React, {FC, useEffect, useRef, useState } from "react";
import { PluginData, PluginSettings } from "types";

interface Returns {
  Provider: FC,
  store: PluginStore,
}

function useStore(): Returns {
  const generator = useRef(new FileGenerator(formats));
  const [settings, setSettings] = useState<PluginSettings>(null)

  useEffect(() => {
    if (!settings) return
    emit("UPDATE_SETTINGS", settings)
  }, [settings])

  function emit(type: string, payload?: unknown) {
    const pluginMessage: { type: string, payload?: unknown; } = { type };
    if (payload) pluginMessage.payload = payload;
    parent.postMessage({ pluginMessage }, "*");
  }

  useEffect(() => {
    onmessage = (e) => {
      const { type, payload } = e.data.pluginMessage;
      if (type === "INIT") {
        setSettings(payload as PluginSettings)
      }
      else if (type === "SETTINGS_UPDATED") {
        setSettings(payload as PluginSettings)
      }
      else if (type === "DOWNLOAD_SUCCESS") {
        generator.current.download(payload as PluginData);
      }
      else if (type === "COPY_SUCCESS") {
        generator.current.copyToClipboard(payload as PluginData);
      }
    };
  }, [])


  const store: PluginStore = {
    settings,
    patchSettings(patch) {
      setSettings(s => ({...s, ...patch}))
    },
    get activeFormat() {
      return generator.current.formats.find(f => f.name === settings?.format)
    },
    get formats() {
      return generator.current.formats
    },
    download() {
      emit("DOWNLOAD")
    },
    copy() {
      emit("COPY")
    }
  }

  return {
    Provider: ({children}) => (
        <PluginContext.Provider value={store}>
          {children}
        </PluginContext.Provider>
    ),
    store
  }
}

export default useStore
