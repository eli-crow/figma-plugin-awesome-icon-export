import React, {Dispatch, ReactElement, useEffect, useRef} from 'react'
import CodeMirror from 'codemirror'
import 'codemirror/addon/mode/simple'
import 'codemirror/lib/codemirror.css'
import { IconReplacementToken, DocumentReplacementToken } from '../../types'

CodeMirror.defineSimpleMode("formatTemplate", {
    start: [
        {token: "control-statement", regex: /\{#icon(\s+?.+?)?\}|\{\/icon\}/},
        {token: "document-replacement-token", regex: new RegExp(`(?:${Object.keys(DocumentReplacementToken).join('|')})`)},
        {token: "icon-replacement-token", regex: new RegExp(`(?:${Object.keys(IconReplacementToken).join('|')})`)},
    ]
});

interface Props {
    defaultValue: string,
    onChange: Dispatch<string>
}

function TemplateEditor ({defaultValue, onChange}: Props): ReactElement {
    const root = useRef()
    const editor = useRef()

    useEffect(() => {
        const cm = CodeMirror(root.current, {
            value: defaultValue,
            mode: 'formatTemplate',
        })
        cm.on('blur', (cm) => {
            onChange(cm.getValue())
        })
        editor.current = cm
    }, [])

    return (
        <div className="TemplateEditor" ref={root}/>
    )
}

export default TemplateEditor