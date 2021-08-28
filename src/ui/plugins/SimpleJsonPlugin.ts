import { PluginData, FormatPlugin } from '../../types';

import { camelCase } from 'lodash';

export default class SimpleJsonPlugin implements FormatPlugin {
    getFormatName() {
        return 'Simple JSON Format'
    }

    getFileExtension() {
        return 'json'
    }

    generateFileText(data: PluginData): string {
        return `{
    ${data.icons.map(icon => `"${camelCase(icon.name)}": {"title": "${icon.name}", "w": ${data.pluginSettings.preserveMargins ? icon.width : icon.iconWidth}, "h": ${data.pluginSettings.preserveMargins ? icon.height : icon.iconHeight}, "d": "${icon.data}"}`).join(",\n")}
}`;
    }
}