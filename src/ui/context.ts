/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext } from 'react'
import { Format, PluginSettings } from 'types'

export interface PluginStore {
    settings?: PluginSettings;
    patchSettings: (patch: Partial<PluginSettings>) => void;
    readonly activeFormat: Format;
    formats: ReadonlyArray<Format>;
    download: () => void;
    copy: () => void;
}

const PluginContext = createContext<PluginStore>({
    patchSettings: () => {},
    get activeFormat() {return {name: "", extension: "", template: ""} },
    get formats() {return [{name: "", extension: "", template: ""}]},
    download: () => {},
    copy: () => {},
})

export default PluginContext