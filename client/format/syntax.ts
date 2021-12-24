import { IconReplacementToken, DocumentReplacementToken, ColorReplacementToken, FolderReplacementToken } from '../../types'

type SyntaxContext =
    'start' |
    'icon' |
    'color' |
    'color-child' |
    'color-flat' |
    'color-folder' |
    'color-style'

const DOC_T = { token: "document-replacement-token", regex: new RegExp(`(?:${Object.keys(DocumentReplacementToken).join('|')})`) }
const FOLDER_T = { token: "folder-replacement-token", regex: new RegExp(`(?:${Object.keys(FolderReplacementToken).join('|')})`) }
const ICON_T = { token: "icon-replacement-token", regex: new RegExp(`(?:${Object.keys(IconReplacementToken).join('|')})`) }
const COLOR_T = { token: "color-replacement-token", regex: new RegExp(`(?:${Object.keys(ColorReplacementToken).join('|')})`) }
const RECURSE = { token: "color-recurse", regex: /\{#recurse\}/ }

const CONTEXT_START = (context: SyntaxContext | string, { args = 0, tag = context.toString() } = {}) => {
    const argsPattern = "(?:\\s+?(.+?))?".repeat(args)
    const regex = RegExp(`\\{#${tag}${argsPattern}\\}`)
    return {
        token: `${context}-start`,
        regex: regex,
        next: context,
    }
}
const CONTEXT_END = (context: SyntaxContext | string, next: SyntaxContext, { tag = context.toString() } = {}) => {
    const regex = RegExp(`\\{/${tag}\\}`)
    return {
        token: `${context}-end`,
        regex: regex,
        next: next,
    }
}
function getContextRegex(context: SyntaxContext | string, { args = 0, tag = context.toString(), from = 'start' as SyntaxContext } = {}) {
    const start = CONTEXT_START(context, { args, tag }).regex.source
    const end = CONTEXT_END(context, from, { tag }).regex.source
    return new RegExp(`${start}([\\s\\S]*?)${end}`, 'gm')
}

const syntax: Record<SyntaxContext, unknown[]> = {
    'start': [
        DOC_T,
        CONTEXT_START('start', { args: 1 }),
        CONTEXT_START('color', { args: 1 }),
    ],
    'icon': [
        CONTEXT_END('icon', 'start'),
        DOC_T,
        ICON_T,
    ],
    'color': [
        CONTEXT_END('color', 'start'),
        DOC_T,
        COLOR_T,
        CONTEXT_START('color-folder', { tag: 'folder' }),
        CONTEXT_START('color-style', { tag: 'style' }),
        CONTEXT_START('color-flat', { tag: 'flat' }),
    ],
    'color-folder': [
        CONTEXT_END('color-folder', 'color', { tag: 'folder' }),
        DOC_T,
        FOLDER_T,
        CONTEXT_START('color-child', { args: 1, tag: 'child' })
    ],
    'color-child': [
        CONTEXT_END('color-child', 'color-folder', { tag: 'child' }),
        FOLDER_T,
        RECURSE,
    ],
    'color-style': [
        CONTEXT_END('color-style', 'color', { tag: 'style' }),
        DOC_T,
        COLOR_T,
    ],
    'color-flat': [
        CONTEXT_END('color-flat', 'color', { tag: 'flat' }),
        DOC_T,
        COLOR_T,
    ],
}

export {
    syntax,
    CONTEXT_START,
    CONTEXT_END,
    getContextRegex,
    RECURSE
}