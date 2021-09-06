import React, { ReactElement, useCallback, useContext, useEffect, useLayoutEffect, useState, } from "react";
import TemplateEditor from "../components/TemplateEditor";
import {PluginContext} from "../store";
import {useDebouncedCallback} from 'use-debounce'
import getFileInfo from "../generate";

enum Tab {
    Preview,
    Syntax,
}

function EditorView(): ReactElement {

    const app = useContext(PluginContext)
    const [tab, setTab] = useState(Tab.Preview);

    const requestData = useDebouncedCallback(useCallback(() => {
        app.requestData()
    }, []), 1000)
    
    function handleInput(template) {
        app.patchEditingFormat({template})
        requestData()
    }
    
    function handleSave() {
        app.editCreateOrUpdateFormat()
    }
    
    useLayoutEffect(() => {
        const {height} = document.getElementById('react-app').getBoundingClientRect()
        app.resize(640, height);
    }, [tab])
    
    useEffect(() => {
        requestData();
    }, [])

    const previewText = app.data 
    ? getFileInfo(app.data, app.editingFormat).fileText 
    : 'Loading...';

    return (
        <>
            <header className="EditorView_header">
                <label className="EditorView_field">
                    <div className="label EditorView_label">Name</div>
                    <input id="name" type="input" className="input input__field EditorView_input" value={app.editingFormat.name} onChange={e => app.patchEditingFormat({name: e.target.value})} />
                </label>

                <label className="EditorView_field">
                    <div className="label EditorView_label">Extension</div>
                    <input id="extension" type="input" className="input input__field EditorView_input" value={app.editingFormat.extension} onChange={e => app.patchEditingFormat({extension: e.target.value})} />
                </label>

                <div className="EditorView_space"/>

                <div className="EditorView_buttons">
                    <button className="button button--tertiary button--tertiary-destructive" style={{marginRight: '0.25rem'}} onClick={() => app.editDeleteFormat()}>
                        Delete
                    </button>
                    <button className="button button--secondary" onClick={() => app.editCancel()}>
                        Cancel
                    </button>
                    <button className="button button--primary" onClick={handleSave}>
                        Save Format
                    </button>
                </div>
            </header>

            <TemplateEditor defaultValue={app.editingFormat.template} onInput={handleInput}/>

            <div className="EditorView_tabs">
                <button className="EditorView_tab" data-active={tab === Tab.Preview} onClick={() => setTab(Tab.Preview)}>
                    Preview
                </button>
                <button className="EditorView_tab" data-active={tab === Tab.Syntax} onClick={() => setTab(Tab.Syntax)}>
                    Syntax Help
                </button>

                {tab === Tab.Preview && (
                    <>
                        <div style={{flex: '1 0 0'}} />
                        <button className="button button--tertiary" onClick={() => app.copy()} style={{height: 'auto'}}>
                            Copy as Text
                        </button>
                    </>
                )}
            </div>

            <div className="EditorView_tab-content">
                {tab === Tab.Preview && (
                    <pre className="EditorView_preview">
                        <code>
                            {previewText}
                        </code>
                    </pre>
                )}
                {tab === Tab.Syntax && (
                    <>
                        Help!
                    </>
                )}
            </div>
        </>
    )
}

export default EditorView;