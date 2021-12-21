import { CaseTransformKey, DocumentReplacementToken, Format, IconReplacementToken } from "../../../types";

export const fontAwesomeJSLibrary = {
    id: "$1",
    name: "Font Awesome JS Library",
    extension: "js",
    template: `
// generated from "${DocumentReplacementToken.DOC_NAME}" using the "${DocumentReplacementToken.PLUGIN_NAME}" Figma Plugin
{#icon}export const fa${IconReplacementToken.NAME}_${CaseTransformKey.PASCAL} = { prefix: "fas", iconName: "${IconReplacementToken.NAME}", icon: [${IconReplacementToken.WIDTH}, ${IconReplacementToken.HEIGHT}, [], "e${IconReplacementToken.HUNDREDS_INDEX}", "${IconReplacementToken.PATH_DATA}"]}{/icon}
`.trimStart(),
} as Format