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
    sizing?: 'frame' | 'contents';
    fileName?: string;
    framePrefix?: string;
    selectedFormatId?: string;
    customFormats: Format[],
}

export interface Format {
    id: string;
    name: string;
    extension: string;
    template: string;
    custom?: boolean;
}

export interface ClientEvent {
    type: Command;
    payload?: unknown;
}

export interface ServerEvent {
    type: Response;
    payload?: unknown;
}

export enum Command {
    UPDATE_SETTINGS = 'UPDATE_SETTINGS',
    DOWNLOAD = 'DOWNLOAD',
    COPY = 'COPY',
    PREVIEW = 'PREVIEW',
    RESIZE = 'RESIZE',
}

export enum Response {
    INIT = 'INIT',
    DATA_UPDATED = 'DATA_UPDATED',
    DOWNLOAD_SUCCESS = 'DOWNLOAD_SUCCESS',
    COPY_SUCCESS = 'COPY_SUCCESS',
}

export enum DocumentReplacementToken {
    DOC_NAME = "DOC_NAME",
    PLUGIN_NAME = "PLUGIN_NAME",
}

export enum IconReplacementToken {
    I_NAME = "I_NAME",
    I_WIDTH = "I_WIDTH",
    I_HEIGHT = "I_HEIGHT",
    I_LEFT = "I_LEFT",
    I_TOP = "I_TOP",
    I_PATH = "I_PATH",
    I_INDEX = "I_INDEX",
    I_HUNDREDS_INDEX = "I_HUNDREDS_INDEX",
    I_CAMEL = "I_CAMEL",
    I_PASCAL = "I_PASCAL",
    I_CONSTANT = "I_CONSTANT",
    I_KEBAB = "I_KEBAB",
    I_SNAKE = "I_SNAKE",
}