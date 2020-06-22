import { curry } from 'ramda'

import DB from './db'


// ----------------------------------------------------------------- //
// PointFree Functions
// ----------------------------------------------------------------- //
export const exec = query => query.exec()
export const sort = curry((direction, query) => query.sort(direction))


// ----------------------------------------------------------------- //
// Library
// ----------------------------------------------------------------- //
export default new DB()
