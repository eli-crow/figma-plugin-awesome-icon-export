import { camelCase, snakeCase, kebabCase, toUpper, toLower, upperFirst, startCase } from "lodash-es";
import paper from "paper/dist/paper-core";
import manifset from "../manifest.json";
import { ExportData, Format as ExportFormat, IconReplacementDictionary, ColorReplacementDictionary, ColorData, DocumentReplacementDictionary, IconData, DocumentReplacementToken, ColorReplacementToken, IconReplacementToken, CaseTransformDictionary, Context, ReplacementDictionary, ReplacementDictionaryGettter, Folder, FolderReplacementDictionary, FolderReplacementToken } from "../types";
import { getContextRegex, RECURSE } from "./format/syntax";

interface Export {
    fileName: string,
    fileText: string,
}

// TODO: flat, error handling

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
function getColorStyleReplacements(color: ColorData, _index: number, isChild = false): ColorReplacementDictionary {
    // TODO: full name vs contextual name
    const FULL_NAME = color.name
    const NAME = isChild ? color.name : color.name

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
    m.set(ColorReplacementToken.FULL_NAME, FULL_NAME)
    m.set(ColorReplacementToken.NAME, NAME)
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
    // TODO: FULL_NAME
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

function replaceDictionaryFlat<TItem>(toReplace: string, contextTag: Context | string, items: TItem[], dictionaryFunc: ReplacementDictionaryGettter<TItem>): string {
    const regex = getContextRegex(contextTag, { args: 1 })

    let match
    while ((match = regex.exec(toReplace))) {
        const wholeMatch = match[0]
        const separator = match[1]
        const template = match[2]

        const lines = []

        items.forEach((item, i, a) => {
            let iconLine = template

            iconLine = replaceDictionary(iconLine, dictionaryFunc(item, i, false))

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

function replaceDictionaryFolder<TItem>(folderOrItem: TItem | Folder<TItem>, parentIndex: number, folderTemplate: string, styleTemplate: string, dictionaryFunc: ReplacementDictionaryGettter<TItem>): string {
    const recurse = (folderOrItem: Folder<TItem> | TItem, childIndex = parentIndex) => {
        if (isFolder(folderOrItem)) {
            let result = folderTemplate
            const folder = folderOrItem as Folder<TItem>

            // TODO, get child context, replace match start and end, and recurse where you find the RECURSE token.
            const childRegex = getContextRegex('child', { args: 1 })
            const childMatch = childRegex.exec(folderTemplate)
            const childWholeMatch = childMatch?.[0]
            const childSeparator = childMatch?.[1]
            const childTemplate = childMatch?.[2]

            if (!childMatch) throw new Error(`"{#folder}" templates must contain a "#{child} tag"`)

            const childText = folder.children.map((item, i, a) => {
                const childReplacement = recurse(item, i)
                const line = childTemplate.replace(new RegExp(RECURSE.regex), childReplacement)
                const separator = childSeparator && i !== a.length - 1 ? childSeparator : ''
                return `${line}${separator}`
            }).join('\n')

            // replace start and end of child matchmatch
            const start = childMatch.index
            const end = start + childWholeMatch.length
            result = result.slice(0, start) + childText + result.slice(end)

            const d: FolderReplacementDictionary = new Map()
            d.set(FolderReplacementToken.NAME, folder.name.trim())
            result = replaceDictionary(result, d)

            return result
        } else {
            const item = folderOrItem as TItem

            return replaceDictionary(styleTemplate, dictionaryFunc(item, childIndex, true))
        }
    }

    return recurse(folderOrItem)
}

function unnest<TItem extends { name: string }>(items: TItem[]): (TItem | Folder<TItem>)[] {
    const parsed = items.map(({ name, ...rest }) => {
        const path = name.trim().split(/\b\s*\/+\s*\b/g)
        const item = { ...rest, name: path[path.length - 1] } as TItem
        return { path, item }
    })

    const result: (TItem | Folder<TItem>)[] = []

    parsed.forEach(({ path, item }) => {
        if (path.length === 1) {
            result.push(item)
        } else {
            const root = result.find(item => isFolder(item) && item.name === path[0]) as Folder<TItem>

            let parent: Folder<TItem>
            if (root) {
                parent = root
            } else {
                const newFolder: Folder<TItem> = { name: path[0], children: [] }
                result.push(newFolder)
                parent = newFolder
            }

            // create intermediate folders
            for (let i = 1; i < path.length - 1; i++) {
                const part = path[i]
                const existingFolder = parent.children.find(i => isFolder(i) && i.name === part) as Folder<TItem>
                if (existingFolder) {
                    parent = existingFolder
                } else {
                    const newFolder: Folder<TItem> = { name: part, children: [] }
                    parent.children.push(newFolder)
                    parent = newFolder
                }
            }

            parent.children.push(item)
        }
    })

    return result
}

function isFolder<TItem>(item: Folder<TItem> | TItem) {
    return (item as Folder<TItem>).children?.length > 0
}

function replaceDictionaryFolders<TItem extends { name: string }>(toReplace: string, context: Context, items: TItem[], dictionaryFunc: ReplacementDictionaryGettter<TItem>): string {
    const contextRegex = getContextRegex(context, { args: 1 })

    const itemsNested = unnest(items)

    let match
    while ((match = contextRegex.exec(toReplace))) {
        const contextWholeMatch = match[0]
        const contextSeparator = match[1]
        const contextTemplate = match[2]

        const folderRegex = getContextRegex('folder')
        const folderMatch = folderRegex.exec(contextTemplate)
        const folderTemplate = folderMatch?.[1]

        const styleRegex = getContextRegex('style')
        const styleMatch = styleRegex.exec(contextTemplate)
        const styleTemplate = styleMatch?.[1]

        const flatRegex = getContextRegex('flat')
        const flatMatch = flatRegex.exec(contextTemplate)
        const flatTemplate = flatMatch?.[1]

        if (folderMatch && styleMatch && flatMatch) throw new Error(`Cannot use "{#folder}" or "{#style}" tags with "{#flat}" tag`)
        if (!(folderMatch && styleMatch)) throw new Error(`Both "{#folder}" and "{#style}" are needed for nested colors. Otherwise, use the "{#flat}" tag`)

        const lines = flatMatch
            ? items.map((item, i, a) => {
                const line = replaceDictionary(flatTemplate, dictionaryFunc(item, i, false))
                const separator = contextSeparator && i !== a.length - 1 ? contextSeparator : ''
                return `${line}${separator}`
            })
            : itemsNested.map((itemOrFolder, i, a) => {
                const line = replaceDictionaryFolder(itemOrFolder, i, folderTemplate, styleTemplate, dictionaryFunc)
                const separator = contextSeparator && i !== a.length - 1 ? contextSeparator : ''
                return `${line}${separator}`
            })

        const start = match.index
        const end = start + contextWholeMatch.length
        toReplace = toReplace.slice(0, start) + lines.join('\n') + toReplace.slice(end)
    }

    return toReplace
}

function parseTemplate(template: string, data: ExportData): string {
    let fileText = template

    fileText = replaceDictionary(fileText, getDocumentReplacements(data))
    fileText = replaceDictionaryFlat(fileText, Context.Icon, data.icons, getIconReplacements)
    fileText = replaceDictionaryFolders(fileText, Context.Color, data.colors, getColorStyleReplacements)

    return fileText
}

export default getFileInfo