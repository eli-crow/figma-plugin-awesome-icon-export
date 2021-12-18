import { camelCase, snakeCase, kebabCase, toUpper, toLower, upperFirst, startCase } from "lodash-es";
import paper from "paper/dist/paper-core";
import manifset from "../manifest.json";
import { ExportData, Format as ExportFormat, IconReplacementDictionary, ColorReplacementDictionary, ColorData, DocumentReplacementDictionary, IconData, DocumentReplacementToken, ColorReplacementToken, IconReplacementToken, CaseTransformDictionary } from "../types";

const ICON_TEMPLATE_PATTERN = /\{#icon(?:\s+?(.+?))?\}([\s\S]+?){\/icon\}/gm
const COLOR_TEMPLATE_PATTERN = /\{#color(?:\s+?(.+?))?\}([\s\S]+?){\/color\}/gm

interface Export {
    fileName: string,
    fileText: string,
}

const caseTransforms: CaseTransformDictionary = {
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
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    paper.setup(canvas);

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

function getDocumentReplacements(data: ExportData): DocumentReplacementDictionary {
    const m: DocumentReplacementDictionary = new Map()
    m[DocumentReplacementToken.DOC_NAME] = data.figmaDocumentName
    m[DocumentReplacementToken.PLUGIN_NAME] = manifset.name
    return m
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getColorStyleReplacements(color: ColorData, _index: number): ColorReplacementDictionary {
    const m = new Map()

    const R_01 = color.r
    const R_256 = Math.round(R_01 * 255)
    const R_HEX = R_256.toString(16).padStart(2, '0')

    const G_01 = color.g
    const G_256 = Math.round(G_01 * 255)
    const G_HEX = G_256.toString(16).padStart(2, '0')

    const B_01 = color.b
    const B_256 = Math.round(B_01 * 255)
    const B_HEX = B_256.toString(16).padStart(2, '0')

    const A_01 = color.a
    const A_256 = Math.round(A_01 * 255)
    const A_HEX = A_256.toString(16).padStart(2, '0')

    const RGBA_CSS = `rgba(${R_256}, ${G_256}, ${B_256}, ${A_01})`
    const RGBA_HEX = `${R_HEX}${G_HEX}${B_HEX}${A_HEX}`
    const RGB_HEX = `${R_HEX}${G_HEX}${B_HEX}`
    const ARGB_HEX = `${A_HEX}${R_HEX}${G_HEX}${B_HEX}`

    //order is important, make sure any tokens whose names are supersets of others are included before the subset
    m[ColorReplacementToken.RGBA_CSS] = RGBA_CSS
    m[ColorReplacementToken.RGBA_HEX] = RGBA_HEX
    m[ColorReplacementToken.RGB_HEX] = RGB_HEX
    m[ColorReplacementToken.ARGB_HEX] = ARGB_HEX
    m[ColorReplacementToken.NAME] = color.name
    m[ColorReplacementToken.R_01] = R_01
    m[ColorReplacementToken.R_256] = R_256
    m[ColorReplacementToken.R_HEX] = R_HEX
    m[ColorReplacementToken.G_01] = G_01
    m[ColorReplacementToken.G_256] = G_256
    m[ColorReplacementToken.G_HEX] = G_HEX
    m[ColorReplacementToken.B_01] = B_01
    m[ColorReplacementToken.B_256] = B_256
    m[ColorReplacementToken.B_HEX] = B_HEX
    m[ColorReplacementToken.A_01] = A_01
    m[ColorReplacementToken.A_HEX] = A_HEX

    return m
}

function getIconReplacements(icon: IconData, index: number): IconReplacementDictionary {
    const m = new Map()

    const name = icon.name.trim()

    //order is important, make sure any tokens whose names are supersets of others are included before the subset
    m[IconReplacementToken.NAME] = name
    m[IconReplacementToken.WIDTH] = icon.width
    m[IconReplacementToken.HEIGHT] = icon.height
    m[IconReplacementToken.LEFT] = icon.offsetX
    m[IconReplacementToken.TOP] = icon.offsetX
    m[IconReplacementToken.PATH_DATA] = icon.data
    m[IconReplacementToken.HUNDREDS_INDEX] = index.toString().padStart(3, '0')
    m[IconReplacementToken.INDEX] = index

    return m
}

function replaceDictionary(toReplace: string, dictionary: unknown, caseTransforms: CaseTransformDictionary): string {
    if (!dictionary) return toReplace

    Object.entries(dictionary).forEach(([token, replacement]) => {
        const regex = new RegExp(`${token}(?:_(${Object.keys(caseTransforms).join('|')}))?`, 'g')
        replacement = replacement.toString()
        toReplace = toReplace.replaceAll(regex, (_wholeMatch: string, caseTransform: string) => {
            if (caseTransform) return caseTransforms[caseTransform](replacement)
            else return replacement
        })
    })

    return toReplace
}

function replaceDictionaryIterator(toReplace: string, contextRegex: RegExp, items: unknown[], dictionaryFunc: (unknown, number) => unknown, caseTransforms: CaseTransformDictionary): string {
    contextRegex = new RegExp(contextRegex)

    let match
    while ((match = contextRegex.exec(toReplace))) {
        const wholeMatch = match[0]
        const separator = match[1]
        const iconTemplate = match[2]

        const lines = []

        items.forEach((item, i, a) => {
            let iconLine = iconTemplate

            iconLine = replaceDictionary(iconLine, dictionaryFunc(item, i), caseTransforms)

            if (separator && i !== a.length - 1) {
                iconLine += separator
            }
            lines.push(iconLine)
        })

        const start = match.index
        const end = start + wholeMatch.length

        toReplace = toReplace.slice(0, start) + lines.join('\n') + toReplace.slice(end)
    }

    return toReplace
}

function parseTemplate(template: string, data: ExportData): string {
    let fileText = template

    fileText = replaceDictionary(fileText, getDocumentReplacements(data), caseTransforms)
    fileText = replaceDictionaryIterator(fileText, ICON_TEMPLATE_PATTERN, data.icons, getIconReplacements, caseTransforms)
    fileText = replaceDictionaryIterator(fileText, COLOR_TEMPLATE_PATTERN, data.colors, getColorStyleReplacements, caseTransforms)

    return fileText
}

export default getFileInfo