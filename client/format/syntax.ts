import { IconReplacementToken, DocumentReplacementToken, ColorReplacementToken } from '../../types'

type SyntaxContext =
    'start' |
    'icon' |
    'color' |
    'color-flat' |
    'color-child' |
    'color-no-child'

const DOC_T = { token: "document-replacement-token", regex: new RegExp(`(?:${Object.keys(DocumentReplacementToken).join('|')})`) }
const ICON_T = { token: "icon-replacement-token", regex: new RegExp(`(?:${Object.keys(IconReplacementToken).join('|')})`) }
const COLOR_T = { token: "color-replacement-token", regex: new RegExp(`(?:${Object.keys(ColorReplacementToken).join('|')})`) }
const CONTEXT_START = (context: SyntaxContext, { args = 0, tag = context.toString() } = {}) => {
    const argsPattern = "(?:\\s+?(.+?))?".repeat(args)
    const regex = RegExp(`\\{#${tag}${argsPattern}\\}`)
    return {
        token: `${context}-start`,
        regex: regex,
        next: context,
    }
}
const CONTEXT_END = (context: SyntaxContext, next: SyntaxContext, { tag = context.toString() } = {}) => {
    const regex = RegExp(`\\{/${tag}\\}`)
    return {
        token: `${context}-end`,
        regex: regex,
        next: next,
    }
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
        CONTEXT_START('color-child', { args: 1, tag: 'child' }),
        CONTEXT_START('color-no-child', { tag: 'nochild' }),
        CONTEXT_START('color-flat', { tag: 'flat' }),
    ],
    'color-child': [
        CONTEXT_END('color-child', 'color', { tag: 'child' }),
        DOC_T,
        COLOR_T,
        { token: "color-grandchild", regex: /\{#grandchild\}/ },
    ],
    'color-no-child': [
        CONTEXT_END('color-no-child', 'color', { tag: 'nochild' }),
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
    syntax
}