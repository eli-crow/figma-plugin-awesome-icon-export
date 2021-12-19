import { CaseTransformKey, Format, IconReplacementToken } from "../../types";

export default {
    id: "$3",
    name: "Simple JSON",
    extension: "json",
    template: `
{
{#icon ,}  "${IconReplacementToken.NAME}_${CaseTransformKey.CAMEL}": {"l": ${IconReplacementToken.LEFT}, "t": ${IconReplacementToken.TOP}, "w": ${IconReplacementToken.WIDTH}, "h": ${IconReplacementToken.HEIGHT}, "title": "${IconReplacementToken.NAME}", "d": "${IconReplacementToken.PATH_DATA}"}{/icon}
}
`.trimStart(),
} as Format