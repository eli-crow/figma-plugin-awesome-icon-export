import React, {ReactElement, useEffect, useRef} from 'react'
import CodeMirror from 'codemirror'
import 'codemirror/addon/mode/simple'
import 'codemirror/lib/codemirror.css'
import { IconReplacementToken, DocumentReplacementToken, ColorReplacementToken } from '../../types'

CodeMirror.defineSimpleMode("formatTemplate", {
    start: [
        {token: "control-statement", regex: /\{#icon(\s+?.+?)?\}|\{\/icon\}/},
        {token: "document-replacement-token", regex: new RegExp(`(?:${Object.keys(DocumentReplacementToken).join('|')})`)},
        {token: "icon-replacement-token", regex: new RegExp(`(?:${Object.keys(IconReplacementToken).join('|')})`)},
        {token: "color-replacement-token", regex: new RegExp(`(?:${Object.keys(ColorReplacementToken).join('|')})`)},
    ]
});

interface Props {
    defaultValue?: string,
    onChange?: (text: string) => void,
    onInput?: (text: string) => void,
}

function TemplateEditor ({defaultValue, onChange, onInput}: Props): ReactElement {
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
        <div className="TemplateEditor" ref={root}/>
    )
}

export default TemplateEditor