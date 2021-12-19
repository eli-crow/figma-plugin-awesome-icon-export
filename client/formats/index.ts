import type {Format} from '../../types'

import fontAwesomeJSLibrary from './fontAwesomeJSLibrary'
import simpleJS from './simpleJS'
import simpleJSON from './simpleJSON'
import svgInJSX from './svgInJSX'

const defaultFormats: Format[] = [
    fontAwesomeJSLibrary,
    simpleJS,
    simpleJSON,
    svgInJSX,
]

export default defaultFormats
export {
    fontAwesomeJSLibrary,
    simpleJS,
    simpleJSON,
    svgInJSX
}