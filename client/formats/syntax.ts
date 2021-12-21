import { IconReplacementToken, DocumentReplacementToken, ColorReplacementToken } from '../../types'

type SyntaxContext =
    'start' |
    'icon' |
    'color' |
    'color-nested' |
    'color-nested-child' |
    'color-nested-no-child'

const DOC_T = { token: "document-replacement-token", regex: new RegExp(`(?:${Object.keys(DocumentReplacementToken).join('|')})`) }
const ICON_T = { token: "icon-replacement-token", regex: new RegExp(`(?:${Object.keys(IconReplacementToken).join('|')})`) }
const COLOR_T = { token: "color-replacement-token", regex: new RegExp(`(?:${Object.keys(ColorReplacementToken).join('|')})`) }
const CONTEXT_START = (context: SyntaxContext, nArgs = 0, tagname: string = context.toString()) => {
    const args = "(?:\\s+?(.+?))?".repeat(nArgs)
    const regex = RegExp(`\\{#${tagname}${args}\\}`)
    return {
        token: `${context}-start`,
        regex: regex,
        next: context,
    }
}
const CONTEXT_END = (context: string, next: SyntaxContext, tagname: string = context.toString()) => {
    const regex = RegExp(`\\{/${tagname}\\}`)
    return {
        token: `${context}-end`,
        regex: regex,
        next: next,
    }
}

const syntax: Record<SyntaxContext, unknown[]> = {
    'start': [
        DOC_T,
        CONTEXT_START('start', 1),
        CONTEXT_START('color', 1)
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
        CONTEXT_START('color-nested', 1, 'nested'),
    ],
    'color-nested': [
        CONTEXT_END('color-nested', 'color', 'nested'),
        CONTEXT_START('color-nested-child', 0, 'child'),
        CONTEXT_START('color-nested-no-child', 0, 'nochild'),
    ],
    'color-nested-child': [
        DOC_T,
        COLOR_T,
        { token: "color-recuse", regex: /RECURSE/ },
        CONTEXT_END('color-nested-child', 'color-nested', 'child'),
    ],
    'color-nested-no-child': [
        DOC_T,
        COLOR_T,
        CONTEXT_END('color-nested-no-child', 'color-nested', 'nochild'),
    ]
}

export default syntax