import Maybe, { Just, Nothing } from 'crocks/Maybe'

import { curry, flip, ifElse, includes, pipe } from 'ramda'

export const flow = (...vals) => (...fns) => pipe(...fns)(...vals)
export const safe = pred => ifElse(pred, Just, Nothing)
export const isAnyOf = flip(includes)
