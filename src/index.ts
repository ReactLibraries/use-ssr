import { useGlobalState, getCache, setCache } from '@react-libraries/use-global-state'
import { ReactElement } from 'react'
import ReactDOMServer from 'react-dom/server'

const IS_SERVER = !process.browser
const GlobalKey = '@react-libraries/use-ssr'

export type CachesType<T = unknown> = {
  [key: string]: T
}

type EventType = 'end'
const isValidating = () => validating.size !== 0
let event: [string, () => void][] = []
const validating = new Set<string>()
const validatingEvent = () =>
  validating.size === 0 && event.forEach(([name, listener]) => name === 'end' && listener())

const addEvent = (name: EventType, listener: () => void) => (event = [...event, [name, listener]])

const removeEvent = (name: EventType, listener: () => void) =>
  (event = event.filter((item) => item[0] !== name || item[1] !== listener))

export const createCache = (data?: CachesType) => !IS_SERVER && data && setCache(data)

export const useSSR: {
  <T>(
    key: string | string[],
    handle: (state: T, set: (data: T | ((data: T) => T)) => void) => Promise<void>,
    initialData: T | (() => T)
  ): readonly [T, (data: T | ((data: T) => T)) => void]
  <K, T = K | undefined>(
    key: string | string[],
    handle: (state: T, set: (data: T | ((data: T) => T)) => void) => Promise<void>
  ): readonly [T, (data: T | ((data: T) => T)) => void]
} = <T>(
  key: string | string[],
  handle: (state: T | undefined, set: (data: T | ((data: T) => T)) => void) => Promise<void>,
  initialData?: T | (() => T)
) => {
  const keys = Array.isArray(key) ? key : [key]
  const [state, setState] = useGlobalState<T>([GlobalKey, ...keys], initialData)
  const keyName = keys.join('-')
  if (!validating.has(keyName)) {
    validating.add(keyName)
    handle(state, setState).then(() => {
      validating.delete(keys.join('-'))
      validatingEvent()
    })
  }

  return [state, setState] as const
}

export const getDataFromTree = async (element: ReactElement): Promise<CachesType> => {
  if (!IS_SERVER) return Promise.resolve({})
  return new Promise<CachesType>((resolve) => {
    const appStream = ReactDOMServer.renderToStaticNodeStream(element)
    appStream.read()
    if (!isValidating()) {
      resolve(getCache([GlobalKey]))
    } else {
      const listener = () => {
        resolve(getCache([GlobalKey]))
        removeEvent('end', listener)
      }
      addEvent('end', listener)
    }
  })
}
