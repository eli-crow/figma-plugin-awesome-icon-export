import React, { ReactElement, useCallback, useContext, useEffect, useLayoutEffect, useState, Fragment } from "react";
import TemplateEditor from "../components/TemplateEditor";
import {PluginContext} from "../store";
import {useDebouncedCallback} from 'use-debounce'
import getFileInfo from "../generate";
import { CaseTransformKey, DocumentReplacementToken, IconReplacementToken } from "../../types";

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
        app.editUpdateFormat({template})
        requestData()
    }
    
    function handleSave() {
        app.editSaveFormat()
    }
    
    useLayoutEffect(() => {
        const {height} = document.getElementById('react-app').getBoundingClientRect()
        app.resize(640, height);
    }, [tab])
    
    useEffect(requestData, [])

    const previewText = app.data 
        ? getFileInfo(app.data, app.editingFormat).fileText 
        : 'Loading...';

    return (
        <>
            <header className="EditorView_header">
                <label className="EditorView_field">
                    <div className="label EditorView_label">Name</div>
                    <input id="name" type="input" className="input input__field EditorView_input" value={app.editingFormat.name} onChange={e => app.editUpdateFormat({name: e.target.value})} />
                </label>

                <label className="EditorView_field">
                    <div className="label EditorView_label">Extension</div>
                    <input id="extension" type="input" className="input input__field EditorView_input" value={app.editingFormat.extension} onChange={e => app.editUpdateFormat({extension: e.target.value})} />
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
                    <div className="SyntaxHelp">
                        <div className="SyntaxHelp-column">
                            <code className="SyntaxHelp-code">
                                {Object.keys(DocumentReplacementToken).map((t, i, a) => (<Fragment key={t}><span className="cm-document-replacement-token">{t}</span>{i !== a.length - 1 && ", "}</Fragment>))}
                            </code>
                            <p className="SyntaxHelp-description">
                                Inject details of this Figma document
                            </p>
                        </div>
                        <div className="SyntaxHelp-column">
                            <code className="SyntaxHelp-code">
                                <span className="cm-icon-replacement-token">{"{#icon"}</span> ,<span className="cm-icon-replacement-token">{"}"}</span>...<span className="cm-icon-replacement-token">{"{/icon}"}</span>
                            </code>
                            <p className="SyntaxHelp-description">
                                Text between these tags is generated for each icon. Optionally specify a separator (such as a comma) to insert between lines.
                            </p>
                        </div>
                        <div className="SyntaxHelp-column">
                            <code className="SyntaxHelp-code">
                                {Object.values(IconReplacementToken).map(
                                    (t, i, a) => (<Fragment key={t}><span className="cm-icon-replacement-token">{t}</span>{i !== a.length - 1 && ", "}</Fragment>)
                                )}
                            </code>
                            <p className="SyntaxHelp-description">
                                When used inside <span className="cm-icon-replacement-token">{"{#icon}"}</span>, injects details of each icon 
                            </p>
                        </div>
                        <div className="SyntaxHelp-column">
                            <code className="SyntaxHelp-code">
                                {Object.values(CaseTransformKey).map(
                                    (t, i, a) => (<Fragment key={t}><span className="cm-icon-replacement-token">_{t}</span>{i !== a.length - 1 && ", "}</Fragment>)
                                )}
                            </code>
                            <p className="SyntaxHelp-description">
                            These suffixes transform the replacement into common cases
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default EditorView;