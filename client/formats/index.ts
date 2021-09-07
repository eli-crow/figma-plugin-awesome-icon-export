import type {Format} from '../../types'

import fontAwesomeJSLibrary from './fontAwesomeJSLibrary.json'
import simpleJS from './simpleJS.json'
import simpleJSON from './simpleJSON.json'
import svgInJSX from './svgInJSX.json'

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