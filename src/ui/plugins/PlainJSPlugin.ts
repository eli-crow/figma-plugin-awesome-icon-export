import { PluginData, FormatPlugin } from '../../types';

import { camelCase, upperFirst } from 'lodash';

export default class FontAwesomeJSPlugin implements FormatPlugin {
    getFormatName() {
        return 'Simple JS Exports'
    }

    getFileExtension() {
        return 'js'
    }

    generateFileText(data: PluginData): string {
        const iconLines = data.icons.map((icon, index) => {
            const varName = camelCase(icon.name)
            return `export const ${varName} = {title: '${icon.name}', w: ${data.pluginSettings.preserveMargins ? icon.width : icon.iconWidth}, h: ${data.pluginSettings.preserveMargins ? icon.height : icon.iconHeight}, d: '${icon.data}'};`;
        }).join("\n");

        return `// generated from Figma document "${data.figmaDocumentName}" using the "Awesome Icon Export" plugin
${iconLines}`;
    }
}