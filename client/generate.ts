import { camelCase, snakeCase, kebabCase, toUpper, toLower, upperFirst, startCase } from "lodash-es";
import paper from "paper/dist/paper-core";
import manifset from "../manifest.json";
import { ExportData, Format as ExportFormat, IconReplacementDictionary, ColorReplacementDictionary, ColorData, DocumentReplacementDictionary, IconData, DocumentReplacementToken, ColorReplacementToken, IconReplacementToken, CaseTransformDictionary, Context, ReplacementDictionary } from "../types";

interface Export {
    fileName: string,
    fileText: string,
}

const CASE_TRANSFORMS: CaseTransformDictionary = {
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

    m.set(DocumentReplacementToken.DOC_NAME, data.figmaDocumentName)
    m.set(DocumentReplacementToken.PLUGIN_NAME, manifset.name)

    return m
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getColorStyleReplacements(color: ColorData, _index: number): ColorReplacementDictionary {
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

    const m: ColorReplacementDictionary = new Map()

    //order is important, make sure any tokens whose names are supersets of others are included before the subset
    m.set(ColorReplacementToken.RGBA_CSS, RGBA_CSS)
    m.set(ColorReplacementToken.RGBA_HEX, RGBA_HEX)
    m.set(ColorReplacementToken.RGB_HEX, RGB_HEX)
    m.set(ColorReplacementToken.ARGB_HEX, ARGB_HEX)
    m.set(ColorReplacementToken.NAME, color.name)
    m.set(ColorReplacementToken.R_01, R_01.toString())
    m.set(ColorReplacementToken.R_256, R_256.toString())
    m.set(ColorReplacementToken.R_HEX, R_HEX)
    m.set(ColorReplacementToken.G_01, G_01.toString())
    m.set(ColorReplacementToken.G_256, G_256.toString())
    m.set(ColorReplacementToken.G_HEX, G_HEX)
    m.set(ColorReplacementToken.B_01, B_01.toString())
    m.set(ColorReplacementToken.B_256, B_256.toString())
    m.set(ColorReplacementToken.B_HEX, B_HEX)
    m.set(ColorReplacementToken.A_01, A_01.toString())
    m.set(ColorReplacementToken.A_HEX, A_HEX)

    return m
}

function getIconReplacements(icon: IconData, index: number): IconReplacementDictionary {
    const NAME = icon.name.trim()

    const m: IconReplacementDictionary = new Map()

    //order is important, make sure any tokens whose names are supersets of others are included before the subset
    m.set(IconReplacementToken.NAME, NAME)
    m.set(IconReplacementToken.WIDTH, icon.width.toString())
    m.set(IconReplacementToken.HEIGHT, icon.height.toString())
    m.set(IconReplacementToken.LEFT, icon.offsetX.toString())
    m.set(IconReplacementToken.TOP, icon.offsetX.toString())
    m.set(IconReplacementToken.PATH_DATA, icon.data)
    m.set(IconReplacementToken.HUNDREDS_INDEX, index.toString().padStart(3, '0'))
    m.set(IconReplacementToken.INDEX, index.toString())

    return m
}

function replaceDictionary(toReplace: string, dictionary: ReplacementDictionary): string {
    if (!dictionary) return toReplace

    dictionary.forEach((replacement, token) => {
        const regex = new RegExp(`${token}(?:_(${Object.keys(CASE_TRANSFORMS).join('|')}))?`, 'g')
        replacement = replacement.toString()
        toReplace = toReplace.replaceAll(regex, (_wholeMatch: string, caseTransform: string) => {
            if (caseTransform) return CASE_TRANSFORMS[caseTransform](replacement)
            else return replacement
        })
    })

    return toReplace
}

function replaceDictionaryIterator<TItem>(
    toReplace: string,
    context: Context,
    items: TItem[],
    dictionaryFunc: (item: TItem, index: number) => ReplacementDictionary,
): string {
    const regex = new RegExp(`\\{#${context}(?:\\s+?(.+?))?\\}([\\s\\S]+?){\\/${context}\\}`, 'gm')

    let match
    while ((match = regex.exec(toReplace))) {
        const wholeMatch = match[0]
        const separator = match[1]
        const iconTemplate = match[2]

        const lines = []

        items.forEach((item, i, a) => {
            let iconLine = iconTemplate

            iconLine = replaceDictionary(iconLine, dictionaryFunc(item, i))

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

    fileText = replaceDictionary(fileText, getDocumentReplacements(data))
    fileText = replaceDictionaryIterator(fileText, Context.Icon, data.icons, getIconReplacements)
    fileText = replaceDictionaryIterator(fileText, Context.Color, data.colors, getColorStyleReplacements)

    return fileText
}

export default getFileInfo