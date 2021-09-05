export interface IconData {
    name: string;
    width: number;
    height: number;
    offsetX?: number;
    offsetY?: number;
    iconWidth: number;
    iconHeight: number;
    data: string;
}

export interface PluginData {
    pluginSettings: PluginSettings;
    figmaDocumentName: string;
    icons: IconData[];
}

export interface PluginSettings {
    preserveMargins?: boolean;
    fileName?: string;
    framePrefix?: string;
    format?: string;
}

export interface Format {
    name: string,
    extension: string,
    template: string,
}