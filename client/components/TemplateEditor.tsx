import React, { ReactElement, useEffect, useRef } from 'react'
import CodeMirror from 'codemirror'
import 'codemirror/addon/mode/simple'
import 'codemirror/lib/codemirror.css'
import syntax from '../formats/syntax'

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