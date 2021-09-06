import { ClientEvent, Command, IconData, PluginData, PluginSettings, Response, ServerEvent } from './types';

const storage = figma.root

function getPluginSettings(): PluginSettings {
  return JSON.parse(storage.getPluginData("pluginSettings")) ?? null;
}

function setPluginSettings(settings: PluginSettings): void {
  storage.setPluginData("pluginSettings", JSON.stringify(settings));
}

function matchesPrefix(string: string): boolean {
  const settings = getPluginSettings();
  const prefixRegex = new RegExp(`^\\s*${settings.framePrefix}\\s*/\\s*`, 'g')
  return Boolean(string.match(prefixRegex))
}

function toIconName(string: string): string {
  const settings = getPluginSettings();
  const prefixRegex = new RegExp(`^\\s*${settings.framePrefix}\\s*/\\s*`, 'g')
  return string.trim().replace(prefixRegex, '')
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

function getIconData(): IconData[] {
  const iconFrames: Array<FrameNode> = figma.root.findAll(n =>
    (n.type === 'FRAME' || n.type === 'COMPONENT')
    && n.visible
    && n.opacity > 0
    && matchesPrefix(n.name)
  ) as Array<FrameNode>

  const results: IconData[] = [];
  iconFrames.forEach(frame => {

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
      if (frame.rotation !== 0) {
        clone.rotation -= frame.rotation;
      }

      try {
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

    const iconData: IconData = {
      name: toIconName(frame.name),
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

function getPluginData(): PluginData {
  return {
    pluginSettings: getPluginSettings(),
    figmaDocumentName: figma.root.name,
    icons: getIconData()
  }
}

function respond(type: Response, payload: unknown) {
  const event: ServerEvent = {type, payload}
  figma.ui.postMessage(event)
}

figma.ui.onmessage = (msg) => {
  const { type, payload } = msg as ClientEvent

  switch (type) {
    case Command.UPDATE_SETTINGS: {
      setPluginSettings(payload as PluginSettings)
      break;
    }

    case Command.PREVIEW: {
      respond(Response.DATA_UPDATED, getPluginData())
      break;
    }

    case Command.DOWNLOAD: {
      const data = getPluginData()
      respond(Response.DATA_UPDATED, data)
      respond(Response.DOWNLOAD_SUCCESS, data)
      break;
    }
    
    case Command.COPY: {
      const data = getPluginData()
      respond(Response.DATA_UPDATED, data)
      respond(Response.COPY_SUCCESS, data)
      break;
    }

    case Command.RESIZE: {
      const {width, height} = payload as {width: number, height: number}
      figma.ui.resize(Math.ceil(width), Math.ceil(height))
      break;
    }

    case Command.NOTIFY: {
      const message = payload as string
      figma.notify(message)
      break;
    }
  }
};

function init() {
  figma.showUI(__html__, { width: 320, height: 332 });

  const existing = getPluginSettings()
  
  const framePrefix = existing.framePrefix ?? 'icon'
  const fileName = existing.fileName ?? 'icons'
  const sizing = existing.sizing ?? 'frame'
  const customFormats = existing.customFormats ?? []
  const selectedFormatId = customFormats.find(f => f.id === existing.selectedFormatId)?.id ?? '$1'

  const settings = {selectedFormatId, framePrefix, fileName, sizing, customFormats}
  setPluginSettings(settings);

  respond(Response.INIT, settings)
}

init();