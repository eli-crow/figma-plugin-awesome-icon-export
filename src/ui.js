import "./figma-plugin-ds.min.css";
import "./figma-plugin-ds.min.js";
import "./ui.css";

import copyToClipboard from 'copy-to-clipboard';

const downloadEl = document.getElementById("download")
const copyAsTextEl = document.getElementById("copyAsText");
const filenameLabelEl = document.getElementById("filenameLabel");
const settingsEl = document.getElementById("settings");
const framePrefixEl = document.getElementById("framePrefix");
const filenameEl = document.getElementById("filename");

function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function updateView() {
  filenameLabelEl.innerHTML = filenameEl.value + ".js";
}

onmessage = (e) => {
  const { type, payload } = e.data.pluginMessage;
  switch (type) {
    case "INIT":
      const settings = payload;
      framePrefixEl.value = settings.framePrefix;
      filenameEl.value = settings.filename;
      updateView();
      break;

    case "DOWNLOAD_SUCCESS":
      const {filename, text} = payload
      download(filename, text)
      break;

    case "COPY_AS_TEXT_SUCCESS":
      copyToClipboard(payload.text)
      break;
  }
};

function emit(type, payload) {
  if (!type) return;
  const message = {
    type: type,
  };
  if (payload) message.payload = payload;
  parent.postMessage({ pluginMessage: message }, "*");
}

downloadEl.addEventListener("click", e => {
  emit("DOWNLOAD")
})

copyAsTextEl.addEventListener("click", e => {
  emit("COPY_AS_TEXT")
})

settingsEl.addEventListener("change", (e) => {
  const newSettings = {};
  for (var el of settingsEl.elements) {
    newSettings[el.id] = el.value;
  }
  emit("UPDATE_SETTINGS", newSettings);
  updateView();
});