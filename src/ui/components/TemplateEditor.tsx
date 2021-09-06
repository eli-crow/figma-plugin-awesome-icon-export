import React, {Dispatch, ReactElement, useEffect, useRef} from 'react'
import CodeMirror from 'codemirror'
import 'codemirror/addon/mode/simple'
import 'codemirror/lib/codemirror.css'
import { IconReplacementToken, DocumentReplacementToken } from '../../types'

CodeMirror.defineSimpleMode("formatTemplate", {
    start: [
        {token: "control-statement", regex: /\{#icon(\s+?.+?)?\}|\{\/icon\}/},
        {token: "document-replacement-token", regex: new RegExp(`(?:${Object.keys(DocumentReplacementToken).join('|')})\\b`)},
        {token: "icon-replacement-token", regex: new RegExp(`(?:${Object.keys(IconReplacementToken).join('|')})\\b`)},
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
        editor.current = CodeMirror(root.current, {
            value: defaultValue,
            mode: 'formatTemplate',
        })
    }, [])

    return (
        <div className="TemplateEditor" ref={root}/>
    )
}

export default TemplateEditor