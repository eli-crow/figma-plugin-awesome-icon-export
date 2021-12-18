import { ClientCommand, ClientCommandMessage, ColorData, ExportData, IconData, PluginSettings, ServerResponse, ServerResponseMessage } from '../types';

figma.ui.onmessage = (message: ClientCommandMessage) => {
  switch (message.command) {
    case ClientCommand.UPDATE_SETTINGS: {
      setPluginSettings(message.payload as PluginSettings)
      break;
    }

    case ClientCommand.PREVIEW: {
      respond(ServerResponse.DATA_UPDATED, getExportData())
      break;
    }

    case ClientCommand.DOWNLOAD: {
      const data = getExportData()
      respond(ServerResponse.DATA_UPDATED, data)
      respond(ServerResponse.DOWNLOAD_SUCCESS, data)
      break;
    }

    case ClientCommand.COPY: {
      const data = getExportData()
      respond(ServerResponse.DATA_UPDATED, data)
      respond(ServerResponse.COPY_SUCCESS, data)
      break;
    }

    case ClientCommand.RESIZE: {
      const { width, height } = message.payload as { width: number, height: number }
      figma.ui.resize(Math.ceil(width), Math.ceil(height))
      break;
    }

    case ClientCommand.NOTIFY: {
      const text = message.payload as string
      figma.notify(text)
      break;
    }
  }
};

init();

function getPluginSettings(): PluginSettings {
  const existing = figma.root.getPluginData("pluginSettings")
  return JSON.parse(existing || null)
}

function setPluginSettings(settings: PluginSettings): void {
  figma.root.setPluginData("pluginSettings", JSON.stringify(settings));
}

function matchesPrefix(string: string): boolean {
  const settings = getPluginSettings();
  const prefixRegex = new RegExp(`^\\s*${settings.framePrefix}\\s*/\\s*`, 'g')
  return Boolean(string.match(prefixRegex))
}

function getFrameNormalizedName(frame: FrameNode): string {
  const settings = getPluginSettings();
  const iconVariantKeysRegex = /\b\S+?=/g
  const prefixRegex = new RegExp(`^\\s*${settings.framePrefix}\\s*/\\s*`, 'g')
  return frame.name.trim().replaceAll(iconVariantKeysRegex, '').replace(prefixRegex, '')
}

function isCompletelyTransparent(node: GeometryMixin): boolean {
  if (node.fillStyleId) {
    const style = figma.getStyleById(node.fillStyleId.toString())
    if (style.type === 'PAINT') {
      const paintStyle = style as PaintStyle;
      if (paintStyle.paints.some(p => p.visible && p.opacity > 0)) {
        return false
      }
    }
  } else {
    const fills = node.fills as Paint[]
    if (fills.some(p => p.visible && p.opacity > 0)) {
      return false
    }
  }

  if (node.strokeStyleId) {
    const style = figma.getStyleById(node.strokeStyleId.toString())
    if (style.type === 'PAINT') {
      const paintStyle = style as PaintStyle;
      if (paintStyle.paints.some(p => p.visible && p.opacity > 0)) {
        return false
      }
    }
  } else {
    if (node.strokes.some(p => p.visible && p.opacity > 0)) {
      return false
    }
  }

  return true
}

function getColorData(): ColorData[] {
  return figma.getLocalPaintStyles().map(style => {
    const color = style.paints[0]
    if (color.type === 'SOLID') {
      return {
        name: style.name,
        r: color.color.r,
        g: color.color.g,
        b: color.color.b,
        a: color.opacity
      }
    }
  }).filter(s => s !== undefined)
}

function getIconFrames(): FrameNode[] {
  const settings = getPluginSettings()

  const nodes = [
    ...figma.root.findAll(n =>
      (n.type === 'FRAME' || n.type === 'COMPONENT')
      && n.visible
      && n.opacity > 0
      && matchesPrefix(n.name)
    ) as FrameNode[]
  ]

  const componentSets = figma.root.findAll(n => n.type === 'COMPONENT_SET' && n.name.trim() === settings.framePrefix.trim()) as ComponentSetNode[]
  componentSets.forEach(set => {
    nodes.push(...set.children as FrameNode[])
  })

  return nodes
}

function getIconData(): IconData[] {

  const results: IconData[] = [];

  getIconFrames().forEach(frame => {

    // TODO: support nested frames
    // TODO: support variants
    // TODO: remove support for instances

    const descendents = frame.findAll(n =>
      (
        n.type === 'BOOLEAN_OPERATION' ||
        n.type === 'ELLIPSE' ||
        n.type === 'LINE' ||
        n.type === 'POLYGON' ||
        n.type === 'RECTANGLE' ||
        n.type === 'STAR' ||
        n.type === 'TEXT' ||
        n.type === 'VECTOR'
      )
      && n.parent.type !== 'BOOLEAN_OPERATION'
      && n.opacity > 0
      && n.visible
      && !isCompletelyTransparent(n)
    )

    if (descendents.length === 0) return

    //hacky hack hack.
    const clonedDescendents = descendents.map(n => {
      const clone = n.clone()
      if (frame.rotation !== 0 && 'rotation' in clone) {
        clone.rotation -= frame.rotation;
      }

      try {
        // TODO: investigate how transforms affect items in groups
        const outlinable = clone as GeometryMixin
        if (outlinable.outlineStroke) {
          const strokes = outlinable.outlineStroke()
          if (strokes != null) {
            const union = figma.union([strokes, clone], figma.currentPage)
            const flat = figma.flatten([union], figma.currentPage)
            return flat
          }
          else {
            const flat = figma.flatten([clone], figma.currentPage)
            return flat
          }
        }
        else {
          const flat = figma.flatten([clone], figma.currentPage)
          return flat
        }
      }
      catch (e) {
        return null;
      }
    }).filter(n => n !== null)

    if (clonedDescendents.length <= 0) {
      return;
    }

    const finalUnion = figma.union(clonedDescendents, figma.currentPage);
    const flattened = figma.flatten([finalUnion], figma.currentPage);

    //TODO: isVariant, properties
    const iconData: IconData = {
      name: getFrameNormalizedName(frame),
      width: frame.width,
      height: frame.height,
      offsetX: flattened.x,
      offsetY: flattened.y,
      iconWidth: flattened.width,
      iconHeight: flattened.height,
      data: flattened.vectorPaths.map(p => p.data).join(' '),
    };
    // Don't add duplicates
    if (!results.some(existingIcon => existingIcon.name === iconData.name)) {
      results.push(iconData);
    }

    flattened.remove()
  })

  return results.reverse()
}

function getExportData(): ExportData {
  return {
    pluginSettings: getPluginSettings(),
    figmaDocumentName: figma.root.name,
    icons: getIconData(),
    colors: getColorData(),
  }
}

function respond(response: ServerResponse, payload: unknown) {
  const event: ServerResponseMessage = {
    response,
    payload,
    source: 'server',
    type: 'response'
  }
  figma.ui.postMessage(event)
}

function init() {
  figma.showUI(__html__, { width: 320, height: 305 });

  const existing = getPluginSettings()

  const framePrefix = existing?.framePrefix ?? 'icon'
  const fileName = existing?.fileName ?? 'icons'
  const sizing = existing?.sizing ?? 'frame'
  const customFormats = existing?.customFormats ?? []

  function getDefaultSelectedFormatId() {
    const id = existing?.selectedFormatId

    if (!id) return "$1"

    if (
      existing.selectedFormatId.startsWith("$") ||
      customFormats.some(f => f.id === existing.selectedFormatId)
    ) {
      return existing.selectedFormatId
    }

    return "$1"
  }
  const selectedFormatId = getDefaultSelectedFormatId()

  const settings = { selectedFormatId, framePrefix, fileName, sizing, customFormats }
  setPluginSettings(settings);

  respond(ServerResponse.INIT, settings)
}
