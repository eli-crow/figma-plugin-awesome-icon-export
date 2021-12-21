import React, { ReactElement, useEffect, useRef } from 'react'
import CodeMirror from 'codemirror'
import 'codemirror/addon/mode/simple'
import 'codemirror/lib/codemirror.css'
import { IconReplacementToken, DocumentReplacementToken, ColorReplacementToken } from '../../types'

const DOCUMENT_REPLACEMENT_TOKEN = { token: "document-replacement-token", regex: new RegExp(`(?:${Object.keys(DocumentReplacementToken).join('|')})`) }
const ICON_REPLACEMENT_TOKEN = { token: "icon-replacement-token", regex: new RegExp(`(?:${Object.keys(IconReplacementToken).join('|')})`) }
const COLOR_REPLACEMENT_TOKEN = { token: "color-replacement-token", regex: new RegExp(`(?:${Object.keys(ColorReplacementToken).join('|')})`) }
const CONTEXT_START = (context: keyof typeof syntax, nArgs = 0, tagname: string = context.toString()) => {
    const args = "(?:\\s+?(.+?))?".repeat(nArgs)
    const regex = RegExp(`\\{#${tagname}${args}\\}`)
    return {
        token: `${context}-start`,
        regex: regex,
        next: context,
    }
}
const CONTEXT_END = (context: string, next: keyof typeof syntax, tagname: string = context.toString()) => {
    const regex = RegExp(`\\{/${tagname}\\}`)
    return {
        token: `${context}-end`,
        regex: regex,
        next: next,
    }
}
const syntax: {[key: string]: unknown[]} = {
    'start': [
        DOCUMENT_REPLACEMENT_TOKEN,
        CONTEXT_START('icon', 1),
        CONTEXT_START('color', 1)
    ],
    'icon': [
        CONTEXT_END('icon', 'start'),
        DOCUMENT_REPLACEMENT_TOKEN,
        ICON_REPLACEMENT_TOKEN,
    ],
    'color': [
        CONTEXT_END('color', 'start'),
        DOCUMENT_REPLACEMENT_TOKEN,
        COLOR_REPLACEMENT_TOKEN,
        CONTEXT_START('color-nested', 1, 'nested'),
    ],
    'color-nested': [
        CONTEXT_END('color-nested', 'color', 'nested'),
        CONTEXT_START('color-nested-child', 0, 'child'),
        CONTEXT_START('color-nested-no-child', 0, 'nochild'),
    ],
    'color-nested-child': [
        DOCUMENT_REPLACEMENT_TOKEN,
        COLOR_REPLACEMENT_TOKEN,
        { token: "color-recuse", regex: /RECURSE/ },
        CONTEXT_END('color-nested-child', 'color-nested', 'child'),
    ],
    'color-nested-no-child': [
        DOCUMENT_REPLACEMENT_TOKEN,
        COLOR_REPLACEMENT_TOKEN,
        CONTEXT_END('color-nested-no-child', 'color-nested', 'nochild'),
    ]
}
CodeMirror.defineSimpleMode("formatTemplate", syntax);

interface Props {
    defaultValue?: string,
    onChange?: (text: string) => void,
    onInput?: (text: string) => void,
}

function TemplateEditor({ defaultValue, onChange, onInput }: Props): ReactElement {
    const root = useRef()
    const editor = useRef()

    useEffect(() => {
        const cm = CodeMirror(root.current, {
            value: defaultValue,
            mode: 'formatTemplate',
        })
        onInput && cm.on('change', (cm) => {
            onInput(cm.getValue())
        })
        onChange && cm.on('blur', (cm) => {
            onChange(cm.getValue())
        })
        editor.current = cm
    }, [])

    return (
        <div className="TemplateEditor" ref={root} />
    )
}

export default TemplateEditor