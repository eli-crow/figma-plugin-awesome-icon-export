import React, {useEffect, useState} from 'react'
import * as ReactDOM from 'react-dom'
import "./ui.css";

import FileGenerator from "./FileGenerator";
import FontAwesomeJSPlugin from "./plugins/FontAwesomeJSPlugin";
import SimpleJsPlugin from "./plugins/SimpleJsPlugin";
import SimpleJsonPlugin from "./plugins/SimpleJsonPlugin";
import { PluginSettings, PluginData, FormatPlugin } from "types";

const errors = {
  UNKNOWN_FORMAT: 'unknown format'
};

const generator = new FileGenerator();
generator.use(FontAwesomeJSPlugin);
generator.use(SimpleJsPlugin);
generator.use(SimpleJsonPlugin);

ReactDOM.render(<App/>, document.getElementById('react-app'))

function App() {
  const [settings, setSettings] = useState<PluginSettings>(null)

  let activePlugin = generator.plugins[settings?.format];
  useEffect(() => {
    if (activePlugin === null && settings !== null) {
      setSettings(s => ({...s, format: generator.plugins[0].getFormatName() }))
    }
  }, [activePlugin])

  useEffect(() => {
    if (!settings) return
    emit("UPDATE_SETTINGS", settings)
  }, [settings])
 
  function emit(type: string, payload?: any) {
    const pluginMessage: { type: string, payload?: any; } = { type };
    if (payload) pluginMessage.payload = payload;
    parent.postMessage({ pluginMessage }, "*");
  }

  function download() {
    emit("DOWNLOAD")
  }

  function copy() {
    emit("COPY")
  }

  useEffect(() => {
    onmessage = (e) => {
      const { type, payload } = e.data.pluginMessage;
      if (type === "INIT") {
        setSettings(payload as PluginSettings)
      }
      else if (type === "SETTINGS_UPDATED") {
        setSettings(payload as PluginSettings)
      }
      else if (type === "DOWNLOAD_SUCCESS") {
        generator.download(payload as PluginData);
      }
      else if (type === "COPY_SUCCESS") {
        generator.copyToClipboard(payload as PluginData);
      }
    };
  }, [])

  const loading = !activePlugin

  return loading 
    ? <p>Loading...</p>
    : (
    <div>
      <div className="file">
        <div className="file__header">
          <div className="file__icon icon icon--draft"></div>
          <span className="file__name type type--large type--bold">{settings.fileName}.{activePlugin.getFileExtension()}</span>
        </div>
        <div className="file__action-group">
          <button className="button button--primary file__action" onClick={download}>
            <div className="type type--medium">Download</div>
          </button>
          <button className="button button--secondary file__action" onClick={copy}>
            <div className="type type--medium">Copy as text</div>
          </button>
        </div>
      </div>

      <form className="settings">
        <label className="horizontal-input">
          <div className="label horizontal-input__label">Format</div>
          <select 
            className="horizontal-input__input" 
            onChange={e => setSettings(s => ({...s, format: e.target.value}))}
            value={activePlugin.getFormatName()}
          >
            {Object.keys(generator.plugins).map(name => <option value={name} key={name}>{name}</option>)}
          </select>
        </label>

        <label className="horizontal-input">
          <div className="label horizontal-input__label">Frame Prefix</div>
          <input
            type="input"
            className="input input__field horizontal-input__input"
            placeholder="prefix"
            value={settings.framePrefix} 
            onChange={e => setSettings(s => ({...s, framePrefix: e.target.value}))}/>
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
            value={settings.fileName}
            onChange={e => setSettings(s => ({...s, fileName: e.target.value}))} />
          <div id="fileExtension" className="horizontal-input__text type type--small">.{activePlugin.getFileExtension()}</div>
        </label>

        <label className="horizontal-input">
          <div className="label horizontal-input__label">Preserve Margins?</div>
          <div className="horizontal-input__input checkbox">
            <input type="checkbox" className="checkbox__box" />
            <span className="checkbox__label"></span>
          </div>
        </label>
      </form>

      <div className="onboarding-tip">
        <div className="icon icon--smiley"></div>
        <div className="onboarding-tip__msg">Need a different format? Just want to say hi? <a
          href="https://github.com/eli-crow/figma-plugin-font-awesome-export/issues/new?title=Hello%20There!&body=If%20you%27re%20requesting%20a%20format,%20please%20include%20a%20sample%20of%20the%20format%20and%20let%20me%20know%20how%20it%20will%20be%20used!"
          target="top">Submit an issue on Github</a>! If it's a text-based format, I can probably support it!</div>
      </div>
    </div>
  ) 
}