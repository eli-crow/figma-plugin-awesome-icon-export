import { camelCase, snakeCase, kebabCase, toUpper, toLower, upperFirst, startCase } from "lodash-es";
import paper from "paper/dist/paper-core";
import manifset from "../manifest.json";
import type { ExportData, Format as ExportFormat, DocumentReplacementDictionary, IconReplacementDictionary } from "../types";

const ICON_TEMPLATE_PATTERN = /\{#icon(?:\s+?(.+?))?\}([\s\S]+?){\/icon\}/gm

const canvas: HTMLCanvasElement = document.createElement("canvas");
paper.setup(canvas);

interface Export {
    fileName: string,
    fileText: string,
}

const caseTransforms: {readonly [name: string]: (t:string) => string} = {
    CAMEL: camelCase,
    PASCAL: t => upperFirst(camelCase(t)),
    SNAKE: snakeCase,
    CONSTANT: t => toUpper(snakeCase(t)),
    KEBAB: kebabCase,
    UPPER: toUpper,
    LOWER: toLower,
    TITLE: startCase,
}

function getFileInfo(data: ExportData, format: ExportFormat): Export {
    //corrects winding order and some other things. Couldn't figure out how to do this in code.ts.
    data.icons.forEach(icon => {
        const p = new paper.CompoundPath(icon.data);
        p.reorient(false, true);
        if (data.pluginSettings.sizing === 'frame') {
            p.translate(new paper.Point(icon.offsetX, icon.offsetY));
        }
        icon.data = p.pathData;
    })

    const fileText = parseTemplate(format.template, data)
    const fileName = `${data.pluginSettings.fileName ?? "Icons"}.${format.extension}`;
    return { fileName, fileText };
}

function parseTemplate(template: string, data: ExportData): string {
    let fileText = template
    const globalReplacements: DocumentReplacementDictionary = {
        DOC_NAME: data.figmaDocumentName,
        PLUGIN_NAME: manifset.name,
    }
    Object.entries(globalReplacements).forEach(([token, replacement]) => {
        //TODO: use regex to search for any case suffixes and transform the strings if found
        // https://regexr.com/65681
        fileText = fileText.replaceAll(token, replacement.toString())
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
            const iconReplacements: IconReplacementDictionary = {
                I_NAME: name,
                I_WIDTH: icon.width,
                I_HEIGHT: icon.height,
                I_LEFT: icon.offsetX,
                I_TOP: icon.offsetX,
                I_PATH: icon.data,
                I_INDEX: i,
                I_HUNDREDS_INDEX: i.toString().padStart(3, '0'),

                //TODO: remove case tokens from this dictionary once case suffixes implemented
                I_CAMEL: caseTransforms.CAMEL(name),
                I_PASCAL: caseTransforms.PASCAL(name),
                I_CONSTANT: caseTransforms.CONSTANT(name),
                I_KEBAB: caseTransforms.KEBAB(name),
                I_SNAKE: caseTransforms.SNAKE(name),
            }

            //TODO: generate tokens for each variant property

            Object.entries(iconReplacements).forEach(([token, replacement]) => {
                replacement = replacement.toString()
                //TODO: use regex to search for any case suffixes and transform the strings if found
                // https://regexr.com/65681
                iconLine = iconLine.replaceAll(token, replacement)
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

export default getFileInfo