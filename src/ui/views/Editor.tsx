import React, { ReactElement, useContext, useEffect, useState, } from "react";
import TemplateEditor from "../components/TemplateEditor";
import {PluginContext} from "../store";

enum Tab {
    Preview,
    Syntax,
}

function EditorView(): ReactElement {
    const app = useContext(PluginContext)

    const editing = app.getEditingFormat()
    const [name, setName] = useState(editing.name)
    const [extension, setExtension] = useState(editing.extension)
    const [template, setTemplate] = useState(editing.template)

    const [tab, setTab] = useState(Tab.Preview);

    useEffect(() => {
        app.resize(640, 380);
    }, [])

    function handleChange(text) {
        console.log(text)
        setTemplate(text)
    }

    function buildTabContent() {
        if (tab === Tab.Preview) {
            return (
                <pre className="EditorView_preview">
                    <code>
                        PREVIEW STUFF GOES HERE
                    </code>
                </pre>
            )
        } 
        if (tab === Tab.Syntax) {
            return (
                <>
                    Help!
                </>
            )
        }
        throw new Error("Unknown Tab Set")
    }

    return (
        <>
            <header className="EditorView_header">
                <label className="EditorView_field">
                    <div className="label EditorView_label">Name</div>
                    <input id="name" type="input" className="input input__field EditorView_input" value={name} onChange={e => setName(e.target.value)} />
                </label>

                <label className="EditorView_field">
                    <div className="label EditorView_label">Extension</div>
                    <input id="extension" type="input" className="input input__field EditorView_input" value={extension} onChange={e => setExtension(e.target.value)} />
                </label>

                <div className="EditorView_space"/>

                <div className="EditorView_buttons">
                    <button className="button button--secondary" onClick={() => app.cancelEditingFormat()}>
                        Cancel
                    </button>
                    <button className="button button--primary" onClick={() => app.saveEditingFormat({name, extension, template})}>
                        Save Format
                    </button>
                </div>
            </header>

            <TemplateEditor defaultValue={template} onChange={handleChange} />

            <div className="EditorView_tabs">
                <button className="EditorView_tab" data-active={tab === Tab.Preview} onClick={() => setTab(Tab.Preview)}>
                    Preview
                </button>
                <button className="EditorView_tab" data-active={tab === Tab.Syntax} onClick={() => setTab(Tab.Syntax)}>
                    Syntax Help
                </button>
            </div>

            <div className="EditorView_tab-content">
                {buildTabContent()}
            </div>
        </>
    )
}

export default EditorView;