export interface ColorData {
    name: string;
    r: number;
    g: number;
    b: number;
    a: number;
}

export interface Folder<TData> {
    name: string;
    children: (TData | Folder<TData>)[]
}

export interface IconData {
    name: string;
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    iconWidth: number;
    iconHeight: number;
    data: string;
}

export interface VariantIconData extends IconData {
    isVariant: true;
    properties: { [property: string]: string };
}

export interface ExportData {
    pluginSettings: PluginSettings;
    figmaDocumentName: string;
    icons: IconData[];
    colors: ColorData[];
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

export interface Message {
    source: 'client' | 'server',
    type: 'command' | 'response',
    payload?: unknown;
}

export interface CommandMessage extends Message {
    type: 'command';
    command: string
}

export interface ResponseMessage extends Message {
    type: 'response';
    response: string;
}

export interface ClientCommandMessage extends CommandMessage {
    source: 'client';
    command: ClientCommand;
    payload?: unknown;
}

export interface ServerResponseMessage extends ResponseMessage {
    source: 'server';
    response: ServerResponse;
    payload?: unknown;
}

export enum ClientCommand {
    UPDATE_SETTINGS = 'UPDATE_SETTINGS',
    DOWNLOAD = 'DOWNLOAD',
    COPY = 'COPY',
    PREVIEW = 'PREVIEW',
    RESIZE = 'RESIZE',
    NOTIFY = 'NOTIFY',
}

export enum ServerResponse {
    INIT = 'INIT',
    DATA_UPDATED = 'DATA_UPDATED',
    DOWNLOAD_SUCCESS = 'DOWNLOAD_SUCCESS',
    COPY_SUCCESS = 'COPY_SUCCESS',
}

export enum Context {
    Color = 'color',
    Icon = 'icon',
}

export type ReplacementDictionaryGettter<TItem> = (item: TItem, index: number, isChild: boolean) => ReplacementDictionary

export enum DocumentReplacementToken {
    DOC_NAME = "DOC_NAME",
    PLUGIN_NAME = "PLUGIN_NAME",
}
export type DocumentReplacementDictionary = Map<DocumentReplacementToken, string>

export enum IconReplacementToken {
    NAME = "NAME",
    WIDTH = "WIDTH",
    HEIGHT = "HEIGHT",
    LEFT = "LEFT",
    TOP = "TOP",
    PATH_DATA = "PATH_DATA",
    INDEX = "INDEX",
    HUNDREDS_INDEX = "HUNDREDS_INDEX",
}
export type IconReplacementDictionary = Map<IconReplacementToken, string>

export enum FolderReplacementToken {
    NAME = "NAME"
}
export type FolderReplacementDictionary = Map<FolderReplacementToken, string>

export enum FolderChildReplacementToken {
    NAME = "NAME"
}
export type FolderChildReplacementDictionary = Map<FolderChildReplacementToken, string>

export enum ColorReplacementToken {
    NAME = "NAME",
    FULL_NAME = "FULL_NAME",
    R_01 = "R_01",
    R_256 = "R_256",
    R_HEX = "R_HEX",
    G_01 = "G_01",
    G_256 = "G_256",
    G_HEX = "G_HEX",
    B_01 = "B_01",
    B_256 = "B_256",
    B_HEX = "B_HEX",
    A_01 = "A_01",
    A_HEX = "A_HEX",
    RGBA_CSS = "RGBA_CSS",
    RGBA_HEX = "RGBA_HEX",
    RGB_HEX = "RGB_HEX",
    ARGB_HEX = "ARGB_HEX",
}
export type ColorReplacementDictionary = Map<ColorReplacementToken, string>

export type ReplacementToken = DocumentReplacementToken | IconReplacementToken | ColorReplacementToken | FolderReplacementToken | FolderChildReplacementToken
export type ReplacementDictionary = DocumentReplacementDictionary | IconReplacementDictionary | ColorReplacementDictionary | FolderReplacementDictionary | FolderChildReplacementDictionary

export enum CaseTransformKey {
    CAMEL = "CAMEL",
    PASCAL = "PASCAL",
    SNAKE = "SNAKE",
    CONSTANT = "CONSTANT",
    KEBAB = "KEBAB",
    UPPER = "UPPER",
    LOWER = "LOWER",
    TITLE = "TITLE",
}
export type CaseTransformDictionary = Record<CaseTransformKey, (t: string) => string>
