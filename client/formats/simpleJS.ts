import { CaseTransformKey, DocumentReplacementToken, Format, IconReplacementToken } from "../../types";

export default {
    id: "$2",
    name: "Simple JavaScript",
    extension: "js",
    template: `
// generated from "${DocumentReplacementToken.DOC_NAME}" using the "${DocumentReplacementToken.PLUGIN_NAME}" Figma Plugin
{#icon}export const ${IconReplacementToken.NAME}_${CaseTransformKey.CAMEL} = {l: ${IconReplacementToken.LEFT}, t: ${IconReplacementToken.TOP}, w: ${IconReplacementToken.WIDTH}, h: ${IconReplacementToken.HEIGHT}, title: "${IconReplacementToken.NAME}", d: "${IconReplacementToken.PATH_DATA}"};{/icon}
`.trimStart(),
} as Format