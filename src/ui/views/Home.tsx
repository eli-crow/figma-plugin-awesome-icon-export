import React, { ReactElement, useContext, useEffect } from 'react'
import {PluginContext} from '../store';

function HomeView(): ReactElement  {
    const app = useContext(PluginContext);

    useEffect(() => {
        app.resize(320, 336)
    }, [])

    function handleSelectFormat(e) {
        const format = e.target.value
        if (format === 'CREATE_CUSTOM') {
            app.editNewFormat()
        } else {
            app.patchSettings({format})
        }
    }

    return (
        <>
          <div className="file">
            <div className="file__header">
              <div className="file__icon icon icon--draft"></div>
              <span className="file__name type type--large type--bold">{app.settings.fileName}.{app.getActiveFormat().extension}</span>
            </div>
            <div className="file__action-group">
              <button className="button button--primary file__action" onClick={app.download}>
                <div className="type type--medium">Download</div>
              </button>
              <button className="button button--secondary file__action" onClick={app.copy}>
                <div className="type type--medium">Copy as text</div>
              </button>
            </div>
          </div>

          <form className="settings">
            <label className="horizontal-input">
              <div className="label horizontal-input__label">Format</div>
              <select 
                className="horizontal-input__input" 
                onChange={handleSelectFormat}
                value={app.getActiveFormat().name}
              >
                {app.getDefaultFormats().map(({name}) => <option value={name} key={name}>{name}</option>)}
                <option disabled>───── Custom ─────</option>
                {app.getCustomFormats().map(({name}) => <option value={name} key={name}>{name}</option>)}
                <option value="CREATE_CUSTOM">New Custom Format...</option>
              </select>
            </label>

            <label className="horizontal-input">
              <div className="label horizontal-input__label">Frame Prefix</div>
              <input
                type="input"
                className="input input__field horizontal-input__input"
                placeholder="prefix"
                value={app.settings.framePrefix} 
                onChange={e => app.patchSettings({framePrefix: e.target.value})}/>
              <div className="horizontal-input__text type type--small">
                &nbsp;/&nbsp;icon-name
              </div>
            </label>

            <label className="horizontal-input">
              <div className="label horizontal-input__label">Filename</div>
              <input
                type="input"
                className="input input__field horizontal-input__input"
                placeholder="file-name"
                value={app.settings.fileName}
                onChange={e => app.patchSettings({fileName: e.target.value})} />
              <div id="fileExtension" className="horizontal-input__text type type--small">.{app.getActiveFormat().extension}</div>
            </label>

            <label className="horizontal-input">
              <div className="label horizontal-input__label">Preserve Margins?</div>
              <div className="horizontal-input__input checkbox">
                <input type="checkbox" className="checkbox__box" />
                <span className="checkbox__label"></span>
              </div>
            </label>
          </form>

          <div className="onboarding-tip" style={{backgroundColor: "#F1F9FF", padding: '8px'}}>
            <div className="icon icon--smiley"></div>
            <div className="onboarding-tip__msg">Need a different format? Just want to say hi? <a
              href="https://github.com/eli-crow/figma-plugin-font-awesome-export/issues/new?title=Hello%20There!&body=If%20you%27re%20requesting%20a%20format,%20please%20include%20a%20sample%20of%20the%20format%20and%20let%20me%20know%20how%20it%20will%20be%20used!"
              target="top">Leave a comment on the plugin page</a>! If it's a text-based format, I can probably support it!</div>
          </div>
        </>
    )
}

export default HomeView