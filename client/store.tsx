/* eslint-disable @typescript-eslint/no-empty-function */
import copyToClipboard from "copy-to-clipboard";
import getFileInfo from "./generate";
import { defaultFormats } from './format'
import { useState, createContext } from "react";
import { ExportData, PluginSettings, Format, ClientCommand, ServerResponse, ServerResponseMessage, ClientCommandMessage } from "../types";
import { v4 as uuid } from 'uuid'

interface PluginStore {
  readonly settings: PluginSettings;
  readonly data: ExportData;
  readonly isLoaded: boolean;
  readonly patchSettings: (patch: Partial<PluginSettings>) => void;
  readonly activeFormat: Format;
  readonly editingFormat: Format;
  readonly formats: ReadonlyArray<Format>;
  readonly defaultFormats: ReadonlyArray<Format>;
  readonly customFormats: ReadonlyArray<Format>;
  readonly editUpdateFormat: (patch: Partial<Format>) => void;
  readonly editNewFormat: () => void;
  readonly editFormat: (id: string) => void;
  readonly editDeleteFormat: () => void;
  readonly editSaveFormat: () => void;
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
  patchSettings: () => { },
  activeFormat: null,
  formats: [],
  defaultFormats: [],
  customFormats: [],

  editingFormat: null,
  editUpdateFormat: () => { },
  editNewFormat: () => { },
  editFormat: () => { },
  editDeleteFormat: () => { },
  editCancel: () => { },
  editSaveFormat: () => { },

  download: () => { },
  copy: () => { },
  requestData: () => { },
  resize: () => { }
})

function command(command: ClientCommand, payload?: unknown) {
  const pluginMessage: ClientCommandMessage = {
    source: "client",
    type: "command",
    command,
    payload
  };
  parent.postMessage({ pluginMessage }, "*");
}

function useStore(): PluginStore {

  const [settings, setSettings] = useState<PluginSettings>(null)
  const [data, setData] = useState<ExportData>(null)
  const [editingFormat, setEditingFormat] = useState<Format>(null)

  const formats = settings
    ? [...defaultFormats, ...settings.customFormats]
    : defaultFormats
  const activeFormat = formats.find(f => f.id === settings?.selectedFormatId) ?? formats[0]
  const customFormats = settings?.customFormats;
  const isLoaded = settings !== null;

  function editUpdateFormat(patch: Partial<Format>) {
    const { id, ...newFormat } = patch
    setEditingFormat(oldFormat => ({ ...oldFormat, ...newFormat }))
  }

  function getFormat(id: string) {
    return formats.find(f => f.id === id)
  }

  function patchSettings(patch: Partial<PluginSettings>) {
    const newSettings = { ...settings, ...patch }
    setSettings(newSettings)
    command(ClientCommand.UPDATE_SETTINGS, newSettings)
  }

  onmessage = (e) => {
    const { response: type, payload } = e.data.pluginMessage as ServerResponseMessage;

    switch (type) {
      case ServerResponse.INIT: {
        const settings = payload as PluginSettings
        setSettings(settings)
        break
      }

      case ServerResponse.DATA_UPDATED: {
        const data = payload as ExportData
        setData(data)
        break
      }

      case ServerResponse.DOWNLOAD_SUCCESS: {
        const data = payload as ExportData
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

      case ServerResponse.COPY_SUCCESS: {
        const data = payload as ExportData
        const { fileText } = getFileInfo(data, editingFormat ?? activeFormat)
        copyToClipboard(fileText)
        command(ClientCommand.NOTIFY, "📋 Copied to clipboard!")
        break
      }
    }
  };

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
    editUpdateFormat,
    editNewFormat() {
      setEditingFormat({
        id: uuid(),
        name: "Custom Format",
        extension: activeFormat?.extension ?? "",
        template: activeFormat?.template ?? "",
        custom: true,
      })
    },
    editFormat(id) {
      setEditingFormat({ ...getFormat(id) })
    },
    editSaveFormat() {
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
      const proceed = confirm(`Are you sure you want to permanently delete "${editingFormat.name}"?`)
      if (!proceed) return;
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

    download() { command(ClientCommand.DOWNLOAD) },
    copy() { command(ClientCommand.COPY) },
    requestData() { command(ClientCommand.PREVIEW) },
    resize(width, height) { command(ClientCommand.RESIZE, { width, height }) }
  }
}

export default useStore
export {
  PluginContext,
  PluginStore
}