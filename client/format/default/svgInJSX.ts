import { CaseTransformKey, DocumentReplacementToken, Format, IconReplacementToken } from "../../../types";

export const svgInJSX = {
    id: "$4",
    name: "SVG in JSX",
    extension: "jsx",
    template: `
// generated from “${DocumentReplacementToken.DOC_NAME}” using the ${DocumentReplacementToken.PLUGIN_NAME} Figma Plugin
{#icon}export const icon${IconReplacementToken.NAME}_${CaseTransformKey.PASCAL} = <svg class="Icon" width="${IconReplacementToken.WIDTH}" height="${IconReplacementToken.HEIGHT}" viewBox="${IconReplacementToken.LEFT} ${IconReplacementToken.TOP} ${IconReplacementToken.WIDTH} ${IconReplacementToken.HEIGHT}"><title>${IconReplacementToken.NAME}_${CaseTransformKey.PASCAL}</title><path d="${IconReplacementToken.PATH_DATA}" fill="currentcolor"/></svg>{/icon}
`.trimStart(),
} as Format