/* eslint-disable @typescript-eslint/no-empty-function */
import copyToClipboard from "copy-to-clipboard";
import getFileInfo from "./generate";
import defaultFormats from './formats'
import React, {FC, useEffect, useState, createContext } from "react";
import { PluginData, PluginSettings, Format } from "types";

interface PluginStoreHook {
  Provider: FC,
  readonly store: PluginStore,
}

interface PluginStore {
    readonly settings?: PluginSettings;
    patchSettings: (patch: Partial<PluginSettings>) => void;
    getActiveFormat: () => Format;
    getEditingFormat: () => Format | null;
    getFormats: () => ReadonlyArray<Format>;
    getDefaultFormats: () => ReadonlyArray<Format>;
    getCustomFormats: () => ReadonlyArray<Format>;
    editNewFormat: () => void;
    download: () => void;
    copy: () => void;
    saveEditingFormat: (format: Format) => void;
    cancelEditingFormat: () => void;
    resize: (width: number, height: number) => void;
}

const PluginContext = createContext<PluginStore>({
    patchSettings: () => {},
    getActiveFormat: () => null,
    getEditingFormat: () => null,
    getFormats: () => [],
    getDefaultFormats: () => [],
    getCustomFormats: () => [],
    editNewFormat: () => {},
    saveEditingFormat: () => {},
    cancelEditingFormat: () => {},
    download: () => {},
    copy: () => {},
    resize: () => {}
})

function useStore(): PluginStoreHook {
  const [settings, setSettings] = useState<PluginSettings>(null)
  const [editingFormat, setEditingFormat] = useState<Format>(null)

  const store: PluginStore = {
    settings,
    patchSettings(patch) {
      setSettings(s => ({...s, ...patch}))
    },
    getActiveFormat() {
      return store.getFormats().find(f => f.name === settings?.format)
    },
    getFormats() {
      if (settings) {
        return [...defaultFormats, ...settings.customFormats]
      } else {
        return defaultFormats
      }
    },
    getDefaultFormats() {
      return defaultFormats
    },
    getCustomFormats() {
      return settings?.customFormats
    },
    getEditingFormat() {
      return editingFormat
    },
    editNewFormat() {
      const active = store.getActiveFormat()
      setEditingFormat({
        name: "Custom Format",
        extension: active?.extension ?? "",
        template: active?.template ?? "",
      })
    },
    saveEditingFormat(format) {
      setSettings(s => ({...s, customFormats: [...s.customFormats, format]}))
    },
    cancelEditingFormat() {
      setEditingFormat(null)
    },
    download() {
      emit("DOWNLOAD")
    },
    copy() {
      emit("COPY")
    },
    resize(width, height) {
      emit("RESIZE", {width, height})
    }
  }

  useEffect(() => {
    if (!settings) return
    emit("UPDATE_SETTINGS", settings)
  }, [settings])

  useEffect(() => {
    if (store.settings && !store.getActiveFormat()) {
      store.patchSettings({format: store.getFormats()[0].name })
    }
  }, [store.settings])

  useEffect(() => {
    onmessage = (e) => {
      const { type, payload } = e.data.pluginMessage;
      if (type === "INIT") {
        setSettings(payload as PluginSettings)
      }

      else if (type === "DOWNLOAD_SUCCESS") {
        const data = payload as PluginData
        const { fileName, fileText } = getFileInfo(data, store.getActiveFormat());

        const a = document.createElement("a");
        a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileText));
        a.setAttribute("download", fileName);
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      else if (type === "COPY_SUCCESS") {
        const data = payload as PluginData
        const {fileText} = getFileInfo(data, store.getActiveFormat())
        copyToClipboard(fileText)
      }
    };
  }, [settings])

  function emit(type: string, payload?: unknown) {
    const pluginMessage: { type: string, payload?: unknown; } = { type };
    if (payload) pluginMessage.payload = payload;
    parent.postMessage({ pluginMessage }, "*");
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
export {
  PluginContext,
  PluginStore
}