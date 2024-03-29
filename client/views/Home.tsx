import React, { ReactElement, useContext, useEffect } from 'react'
import { PluginContext } from '../store';

function HomeView(): ReactElement {
  const app = useContext(PluginContext);

  useEffect(() => {
    app.resize(320, 305)
  }, [])

  function handleSelectFormat(e) {
    const value = e.target.value
    if (value === 'CREATE_CUSTOM') {
      app.editNewFormat()
    } else {
      app.patchSettings({ selectedFormatId: value })
    }
  }

  return (
    <>
      <div className="file-container">
        <div className="file">
          <div className="file__header">
            <div className="file__icon icon icon--draft"></div>
            <span className="file__name type type--large type--bold">{app.settings.fileName}.{app.activeFormat.extension}</span>
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
      </div>

      <form className="settings">
        <label className="horizontal-input">
          <div className="label horizontal-input__label">Format</div>
          <select
            className="horizontal-input__input"
            onChange={handleSelectFormat}
            value={app.settings.selectedFormatId}
          >
            {app.defaultFormats.map(({ name, id }) => <option value={id} key={id}>{name}</option>)}
            <option disabled>───── Custom ─────</option>
            {app.customFormats.map(({ name, id }) => <option value={id} key={id}>{name}</option>)}
            <option value="CREATE_CUSTOM">New Custom Format...</option>
          </select>
          {app.activeFormat.custom && (
            <button type="button" onClick={() => app.editFormat(app.activeFormat.id)} className="horizontal-input__action">
              Edit
            </button>
          )}
        </label>

        <label className="horizontal-input">
          <div className="label horizontal-input__label">Frame Prefix</div>
          <input
            type="input"
            className="input input__field horizontal-input__input"
            placeholder="prefix"
            value={app.settings.framePrefix}
            onChange={e => app.patchSettings({ framePrefix: e.target.value })} />
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
            onChange={e => app.patchSettings({ fileName: e.target.value })} />
          <div id="fileExtension" className="horizontal-input__text type type--small">&nbsp;.{app.activeFormat.extension}</div>
        </label>

        <label className="horizontal-input">
          <div className="label horizontal-input__label">Sizing</div>
          <select
            className="horizontal-input__input"
            onChange={e => app.patchSettings({ sizing: (e.target.value as "frame" | "contents") })}
            value={app.settings.sizing}
          >
            <option value="frame">Frame</option>
            <option value="contents">Contents</option>
          </select>
        </label>
      </form>

      <div className="onboarding-tip" style={{ backgroundColor: "#F9F9F9", padding: '8px' }}>
        <div className="icon icon--smiley"></div>
        <div className="onboarding-tip__msg">
          Bugs? Requests? <a href="https://github.com/eli-crow/figma-plugin-awesome-icon-export/issues/new/choose" target="top">Create a github issue</a>.
        </div>
      </div>
    </>
  )
}

export default HomeView