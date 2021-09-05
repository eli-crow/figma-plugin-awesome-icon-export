import copyToClipboard from "copy-to-clipboard";
import { camelCase, snakeCase, kebabCase, startCase, toUpper } from "lodash";
import paper from "paper/dist/paper-core";
import manifset from "../../manifest.json";
import type { PluginData, Format } from "../types";

const ICON_TEMPLATE_PATTERN = /\{#icon(?:\s+?(.+?))?\}(.+?){\/icon\}/gm

export default class FileGenerator {
    private _formats: Format[] = [];
    public get formats(): ReadonlyArray<Format> { return this._formats }

    private canvas: HTMLCanvasElement = document.createElement("canvas");

    constructor(formats?: Format[]) {
        paper.setup(this.canvas);
        formats && this.addFormats(formats);
    }

    private generate(data: PluginData) {
        //corrects winding order and some other things. Couldn't figure out how to do this in code.ts.
        data.icons.forEach(icon => {
            const p = new paper.CompoundPath(icon.data);
            p.reorient(false, true);
            if (data.pluginSettings.preserveMargins) {
                p.translate(new paper.Point(icon.offsetX, icon.offsetY));
            }
            icon.data = p.pathData;
        })

        const format = this._formats.find(f => f.name === data.pluginSettings.format);
        const fileText = this.parseTemplate(format.template, data)
        const fileName = `${data.pluginSettings.fileName ?? "Icons"}.${format.extension}`;
        return { fileName, fileText };
    }

    private parseTemplate(template: string, data: PluginData) {
        let fileText = template
        const globalReplacements = {
            DOC_NAME: data.figmaDocumentName,
            PLUGIN_NAME: manifset.name,
        }
        Object.entries(globalReplacements).forEach(([token, replacement]) => {
            fileText = fileText.replace(token, replacement)
        })

        const regex = new RegExp(ICON_TEMPLATE_PATTERN)
        let match
        while ((match = regex.exec(fileText))) {
            const wholeMatch = match[0]
            const separator = match[1]
            const iconTemplate = match[2]

            const iconLines = []

            data.icons.forEach((icon, i, a) => {
                let iconLine = iconTemplate
                // for now, no token can be a subset of another token, due to matching order
                const name = icon.name.trim()
                const iconReplacements: {[key: string]: string | number} = {
                    I_NAME: name,
                    I_WIDTH: icon.width,
                    I_HEIGHT: icon.height,
                    I_LEFT: icon.offsetX,
                    I_TOP: icon.offsetX,
                    I_PATH: icon.data,
                    I_INDEX: i,
                    I_HUNDREDS_INDEX: i.toString().padStart(3, '0'),

                    I_CAMEL: camelCase(name),
                    I_PASCAL: startCase(name),
                    I_CONSTANT: toUpper(snakeCase(name)),
                    I_KEBAB: kebabCase(name),
                    I_SNAKE: snakeCase(name),
                }
                Object.entries(iconReplacements).forEach(([token, replacement]) => {
                    replacement = replacement.toString()
                    iconLine = iconLine.replace(token, replacement)
                })
                if (separator && i !== a.length - 1) {
                    iconLine += separator
                }
                iconLines.push(iconLine)
            })
            
            const start = match.index
            const end = start + wholeMatch.length
            fileText = fileText.slice(0, start) + iconLines.join('\n') + fileText.slice(end)
        }

        return fileText
    }

    public copyToClipboard(data: PluginData): void {
        const { fileText } = this.generate(data);
        copyToClipboard(fileText);
    }

    public download(data: PluginData): void {
        const { fileName, fileText } = this.generate(data);

        const a = document.createElement("a");
        a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(fileText));
        a.setAttribute("download", fileName);
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    public addFormat(format: Format): void {
        this._formats.push(format)
    }

    public addFormats(formats: Format[]): void {
        formats.forEach(f => this.addFormat(f))
    }
}