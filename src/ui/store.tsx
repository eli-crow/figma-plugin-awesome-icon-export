/* eslint-disable @typescript-eslint/no-empty-function */
import copyToClipboard from "copy-to-clipboard";
import getFileInfo from "./generate";
import defaultFormats from './formats'
import { useEffect, useState, createContext } from "react";
import { PluginData, PluginSettings, Format, Command, Response, ServerEvent } from "../types";
import { uniqueId } from "lodash";

interface PluginStore {
    readonly settings: PluginSettings;
    readonly data: PluginData;
    readonly isLoaded: boolean;
    readonly patchSettings: (patch: Partial<PluginSettings>) => void;
    readonly activeFormat: Format;
    readonly editingFormat: Format;
    readonly patchEditingFormat: (patch: Partial<Format>) => void;
    readonly formats: ReadonlyArray<Format>;
    readonly defaultFormats: ReadonlyArray<Format>;
    readonly customFormats: ReadonlyArray<Format>;
    readonly editNewFormat: () => void;
    readonly editFormat: (id: string) => void;
    readonly editDeleteFormat: () => void;
    readonly editCreateOrUpdateFormat: () => void;
    readonly editCancel: () => void;
    readonly download: () => void;
    readonly copy: () => void;
    readonly requestData: () => void,
    readonly resize: (width: number, height: number) => void;
}

const PluginContext = createContext<PluginStore>({
    settings: null,
    data: null,
    isLoaded: false,
    patchSettings: () => {},
    activeFormat: null,
    formats: [],
    defaultFormats: [],
    customFormats: [],

    editingFormat: null,
    patchEditingFormat: () => {},
    editNewFormat: () => {},
    editFormat: () => {},
    editDeleteFormat: () => {},
    editCancel: () => {},
    editCreateOrUpdateFormat: () => {},

    download: () => {},
    copy: () => {},
    requestData: () => {},
    resize: () => {}
})

function command(type: Command, payload?: unknown) {
  const pluginMessage: { type: string, payload?: unknown; } = { type };
  if (payload) pluginMessage.payload = payload;
  parent.postMessage({ pluginMessage }, "*");
}

function useStore(): PluginStore {
  
  const [settings, setSettings] = useState<PluginSettings>(null)
  const [data, setData] = useState<PluginData>(null)
  const [editingFormat, setEditingFormat] = useState<Format>(null)
  
  const formats = settings 
    ? [...defaultFormats, ...settings.customFormats]
    : defaultFormats
  const activeFormat = formats.find(f => f.id === settings?.selectedFormatId)
  const customFormats = settings?.customFormats;
  const isLoaded = settings !== null;
  
  function patchEditingFormat(patch: Partial<Format>) {
    const {id, ...rest} = patch
    setEditingFormat(f => ({...f, ...rest}))
  }
  
  function getFormat(id: string) {
    return formats.find(f => f.id === id)
  }
  
  function patchSettings (patch: Partial<PluginSettings>) {
    const newSettings = {...settings, ...patch}
    setSettings(newSettings)
    command(Command.UPDATE_SETTINGS, newSettings)
  }

  useEffect(() => {
    onmessage = (e) => {
      const {type, payload} = e.data.pluginMessage as ServerEvent;
  
      switch (type) {
        case Response.INIT: {
          const settings = payload as PluginSettings
          setSettings(settings)
          break
        }
  
        case Response.DATA_UPDATED: {
          const data = payload as PluginData
          setData(data)
          break
        }
  
        case Response.DOWNLOAD_SUCCESS: {
          const data = payload as PluginData
          const { fileName, fileText } = getFileInfo(data, activeFormat);
          const a = document.createElement("a");
          a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileText));
          a.setAttribute("download", fileName);
          a.style.display = "none";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          break
        }
  
        case Response.COPY_SUCCESS: {
          const data = payload as PluginData
          const {fileText} = getFileInfo(data, editingFormat ?? activeFormat)
          copyToClipboard(fileText)
          break
        }
      }
    };
  }, [editingFormat, settings])

  return {
    settings,
    patchSettings,
    data,
    isLoaded,
    formats,
    defaultFormats,
    customFormats,
    activeFormat,
    
    editingFormat,
    patchEditingFormat, 
    editNewFormat() {
      setEditingFormat({
        id: uniqueId(),
        name: "Custom Format",
        extension: activeFormat?.extension ?? "",
        template: activeFormat?.template ?? "",
        custom: true,
      })
    },
    editFormat(id) {
      setEditingFormat({...getFormat(id)})
    },
    editCreateOrUpdateFormat() {
      const formats = [...settings.customFormats]
      const existing = formats.find(f => f.id === editingFormat.id)
      if (existing) {
        Object.assign(existing, editingFormat)
      } else {
        formats.push(editingFormat)
      }
      patchSettings({
        customFormats: formats,
        selectedFormatId: editingFormat.id,
      })
      setEditingFormat(null)
    },
    editDeleteFormat() {
      const formatsWithoutDeleted = settings.customFormats.filter(f => f.id !== editingFormat.id)
      patchSettings({
        customFormats: formatsWithoutDeleted,
        selectedFormatId: formats[0].id,
      })
      setEditingFormat(null)
    },
    editCancel() {
      setEditingFormat(null)
    },

    download() { command(Command.DOWNLOAD) },
    copy() { command(Command.COPY) },
    requestData() { command(Command.PREVIEW) },
    resize(width, height) { command(Command.RESIZE, {width, height})}
  }
}

export default useStore
export {
  PluginContext,
  PluginStore
}