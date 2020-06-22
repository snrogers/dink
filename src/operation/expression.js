import { inspect } from 'util'
import Maybe from 'crocks/Maybe'
import {
  __, always, both, compose, complement, cond, equals,
  ifElse, is, isEmpty, isNil, join,
  length, keys, lensProp, lift, map, mergeAll,
  mergeRight, not, omit, over, pickBy, pipe,
  pluck, prop, reduce, toPairs,
} from 'ramda'

import { isAnyOf, safe } from '../utils'


// ----------------------------------------------------------------- //
// Helpers and Constants
// ----------------------------------------------------------------- //
const LIT = Symbol.for('DINK.TOKEN.LIT')
const PROP = Symbol.for('DINK.TOKEN.PROP')
const VAL = Symbol.for('DINK.TOKEN.VAL')

const flow = (...vals) => (...fns) => pipe(...fns)(...vals)
const isNotArray = compose(not, is(Array))
const isNotNil = compose(not, isNil)
const isNotObject = compose(not, is(Object))
const isPlainObject = both(is(Object), complement(is)(Array))
const safeNotNil = safe(isNotNil)

export function getOp (fragment) {
  const [ op, _arg ] = toPairs(fragment)[0]
  return op
}

export function getArgs (fragment) {
  const [ _op, arg ] = toPairs(fragment)[0]
  return arg
}


// ----------------------------------------------------------------- //
// Private API
// ----------------------------------------------------------------- //
export function tokenize$add(fragment) {
  const actions = getArgs(fragment)

  const tokenizedActions = actions
    .map(action => {
      const [ left, right ] = action

      const tokenizedLeft = is(Object, left)
        ? tokenize(left)
        : [ [ VAL, left ] ]

      const tokenizedRight = is(Object, right)
        ? tokenize(right)
        : [ [ VAL, right ] ]

      return [
        ...tokenizedLeft,
        [ LIT, ' ' ],
        ...tokenizedRight ]
    })

  const combinedTokenizedActions =
    tokenizedActions.reduce((acc, tokens) =>
      [ ...acc, [ LIT, ', ' ], ...tokens ])

  return [
    [ LIT, 'ADD ' ],
    ...combinedTokenizedActions ]
}

export function tokenize$and(fragment) {
  const subFragments = getArgs(fragment)

  if (isNotArray(subFragments))
    throw new TypeError('$and operator must have array as argument')

  const tokenizedSubFragments =
      subFragments.map(
        subFragment => tokenize(subFragment))

  const combinedTokenizedSubFragments =
    tokenizedSubFragments.reduce((acc, tokens) => {
      return [ ...acc, [ LIT, ') AND (' ], ...tokens ]
    })

  return [
    [ LIT, '(' ],
    ...combinedTokenizedSubFragments,
    [ LIT, ')' ] ]
}

export function tokenize$attributeType(fragment) {
  const [ fieldPath, type ] = getArgs(fragment)

  // TODO: safety checks

  const fieldPathTokens = tokenize(fieldPath)
  const typeTokens = is(Object, type)
    ? tokenize(type)
    : [ [ VAL, type ] ]

  return [
    [ LIT, 'attribute_type(' ],
    ...fieldPathTokens,
    [ LIT, ', ' ],
    ...typeTokens,
    [ LIT, ')' ] ]
}

export function tokenize$beginsWith(fragment) {
  const [ fieldPath, criterion ] = getArgs(fragment)

  // TODO: safety checks?

  const fieldPathTokens = tokenize(fieldPath)
  const criterionTokens = is(Object, criterion)
    ? tokenize(criterion)
    : [ [ VAL, criterion ] ]

  return [
    [ LIT, 'begins_with(' ],
    ...fieldPathTokens,
    [ LIT, ', ' ],
    ...criterionTokens,
    [ LIT, ')' ] ]
}

export function tokenize$contains(fragment) {
  const [ fieldPath, criterion ] = getArgs(fragment)

  const fieldPathTokens = tokenize(fieldPath)
  const criterionTokens = is(Object, criterion) && !is(Array, criterion)
    ? tokenize(criterion)
    : [ [ VAL, criterion ] ]

  return [
    [ LIT, 'contains(' ],
    ...fieldPathTokens,
    [ LIT, ', ' ],
    ...criterionTokens,
    [ LIT, ')' ] ]
}

export function tokenize$between(fragment) {
  const args = getArgs(fragment)
  const [ target, boundL, boundR ] = args

  const targetTokens = is(Object, target)
    ? tokenize(target)
    : [ [ VAL, target ] ]

  const boundLTokens = is(Object, boundL)
    ? tokenize(boundL)
    : [ [ VAL, boundL ] ]

  const boundRTokens = is(Object, boundR)
    ? tokenize(boundR)
    : [ [ VAL, boundR ] ]

  return [
    ...targetTokens,
    [ LIT, ' BETWEEN ' ],
    ...boundLTokens,
    [ LIT, ' AND ' ],
    ...boundRTokens ]
}

export function tokenize$delete(fragment) {
  const actions = getArgs(fragment)

  const tokenizedActions = actions
    .map(action => {
      const [ left, right ] = action

      const tokenizedLeft = is(Object, left)
        ? tokenize(left)
        : [ [ VAL, left ] ]

      const tokenizedRight = is(Array, right)
        ? [ [ VAL, right ] ]
        : [ [ VAL, [ right ] ] ]

      return [
        ...tokenizedLeft,
        [ LIT, ' ' ],
        ...tokenizedRight ]
    })

  const combinedTokenizedActions =
    tokenizedActions.reduce((acc, tokens) =>
      [ ...acc, [ LIT, ', ' ], ...tokens ])

  return [
    [ LIT, 'DELETE ' ],
    ...combinedTokenizedActions ]
}

// TODO: Maybe rename $propExists so it doesn't feel
//       weird to nto use $prop?
// TODO: Figure out if this should use an AttributeExpressionName
//       or an AttributeExpressionValue
export function tokenize$exists(fragment) {
  const arg = getArgs(fragment)

  // const propTokens = tokenize(arg)
  const propTokens = tokenize(arg)

  return [
    [ LIT, 'attribute_exists(' ],
    ...propTokens,
    [ LIT, ')' ] ]
}

export function tokenize$equals(fragment) {
  const [ left, right ] = getArgs(fragment)

  const tokensLeft = is(Object, left)
    ? tokenize(left)
    : [ [ VAL, left ] ]

  const tokensRight = is(Object, right)
    ? tokenize(right)
    : [ [ VAL, right ] ]

  return [
    ...tokensLeft,
    [ LIT, ' = ' ],
    ...tokensRight ]
}

export function tokenize$gt(fragment) {
  const [ left, right ] = getArgs(fragment)

  const tokensLeft = is(Object, left)
    ? tokenize(left)
    : [ [ VAL, left ] ]

  const tokensRight = is(Object, right)
    ? tokenize(right)
    : [ [ VAL, right ] ]

  return [
    ...tokensLeft,
    [ LIT, ' > ' ],
    ...tokensRight ]
}

export function tokenize$gte(fragment) {
  const [ left, right ] = getArgs(fragment)


  const tokensLeft = is(Object, left)
    ? tokenize(left)
    : [ [ VAL, left ] ]

  const tokensRight = is(Object, right)
    ? tokenize(right)
    : [ [ VAL, right ] ]

  return [
    ...tokensLeft,
    [ LIT, ' >= ' ],
    ...tokensRight ]
}

export function tokenize$ifNotExists(fragment) {
  const args = getArgs(fragment)
  const [ path, val ] = args

  const tokenizedPath = is(Object, path) && !is(Array, path)
    ? tokenize(path)
    : [ [ VAL, path ] ]

  const tokenizedVal = is(Object, val) && !is(Array, val)
    ? tokenize(val)
    : [ [ VAL, val ] ]

  return [
    [ LIT, 'if_not_exists(' ],
    ...tokenizedPath,
    [ LIT, ', ' ],
    ...tokenizedVal,
    [ LIT, ')' ],
  ]
}

export function tokenize$in(fragment) {
  const args = getArgs(fragment)
  const [ target, ...possibilities ] = args

  const targetTokens = is(Object, target)
    ? tokenize(target)
    : [ [ VAL, target ] ]


  const tokenizedPossibilities = possibilities.map(
    p => is(Object, p)
      ? tokenize(p)
      : [ [ VAL, p ] ])

  const combinedTokenizedPossibilities =
    tokenizedPossibilities.reduce((acc, tokens) => {
      return [ ...acc, [ LIT, ', ' ], ...tokens ]
    })

  return [
    ...targetTokens,
    [ LIT, ' IN (' ],
    ...combinedTokenizedPossibilities,
    [ LIT, ')' ] ]
}

export function tokenize$listAppend(fragment) {
  const args = getArgs(fragment)
  const [ left, right ] = args

  const tokenizedLeft = is(Object, left) && !is(Array, left)
    ? tokenize(left)
    : [ [ VAL, left ] ]

  const tokenizedRight = is(Object, right) && !is(Array, right)
    ? tokenize(right)
    : [ [ VAL, right ] ]

  return [
    [ LIT, 'list_append(' ],
    ...tokenizedLeft,
    [ LIT, ', ' ],
    ...tokenizedRight,
    [ LIT, ')' ],
  ]
}

export function tokenize$lt(fragment) {
  const [ left, right ] = getArgs(fragment)

  const tokensLeft = is(Object, left)
    ? tokenize(left)
    : [ [ VAL, left ] ]

  const tokensRight = is(Object, right)
    ? tokenize(right)
    : [ [ VAL, right ] ]

  return [
    ...tokensLeft,
    [ LIT, ' < ' ],
    ...tokensRight ]
}

export function tokenize$lte(fragment) {
  const [ left, right ] = getArgs(fragment)

  const tokensLeft = is(Object, left)
    ? tokenize(left)
    : [ [ VAL, left ] ]

  const tokensRight = is(Object, right)
    ? tokenize(right)
    : [ [ VAL, right ] ]


  return [
    ...tokensLeft,
    [ LIT, ' <= ' ],
    ...tokensRight ]
}

export function tokenize$not(fragment) {
  const arg = getArgs(fragment)

  if (is(Array, arg) || isNotObject(arg))
    throw new TypeError('$not operator must have expression as argument')

  const subExpressionTokens =
    tokenize(arg)

  return [
    [ LIT, 'NOT (' ],
    ...subExpressionTokens,
    [ LIT, ')' ] ]
}

// TODO: Maybe rename $propNotExists so it doesn't feel
//       weird to nto use $prop?
// TODO: Figure out if this should use an AttributeExpressionName
//       or an AttributeExpressionValue
export function tokenize$attributeNotExists(fragment) {
  const arg = getArgs(fragment)

  const propTokens = tokenize(arg)

  return [
    [ LIT, 'attribute_not_exists(' ],
    ...propTokens,
    [ LIT, ')' ] ]
}

export function tokenize$or(fragment) {
  const subFragments = getArgs(fragment)

  if (isNotArray(subFragments))
    throw new TypeError('$or operator must have array as argument')

  const tokenizedSubFragments =
      subFragments.map(
        subFragment => tokenize(subFragment))

  const combinedTokenizedSubFragments =
    tokenizedSubFragments.reduce((acc, tokens) => {
      return [ ...acc, [ LIT, ') OR (' ], ...tokens ]
    })

  return [
    [ LIT, '(' ],
    ...combinedTokenizedSubFragments,
    [ LIT, ')' ] ]
}

export function tokenize$prop(fragment) {
  const attrName = getArgs(fragment)
  return [ [ PROP, attrName ] ]
}

export function tokenize$remove(fragment) {
  const actions = getArgs(fragment)

  const tokenizedActions = actions
    .map(action => {
      const [ path ] = action

      const tokenizedPath = is(Object, path)
        ? tokenize(path)
        : [ [ VAL, path ] ]

      return tokenizedPath
    })

  const combinedTokenizedActions =
    tokenizedActions.reduce((acc, tokens) =>
      [ ...acc, [ LIT, ', ' ], ...tokens ])

  return [
    [ LIT, 'REMOVE ' ],
    ...combinedTokenizedActions ]
}

export function tokenize$set(fragment) {
  const actions = getArgs(fragment)

  const tokenizedActions = actions
    .map(action => {
      const [ a, b, c ] = action

      const tokenizedA = flow(a)(
        safeNotNil,
        lift(ifElse(
          isPlainObject,
          tokenize,
          a => [ [ VAL, a ] ])))
        .option([])

      const tokenizedB = flow(b)(
        safeNotNil,
        lift(cond([
          [ isPlainObject, tokenize ],
          [ isAnyOf([ '-', '+', '=' ]), b => [ [ LIT, ` ${b} ` ] ] ],
          [ always(true),
            b => { throw new Error(`Invalid fragment: ${inspect(b)}`) } ],
        ])))
        .option([])

      const tokenizedC = flow(c)(
        safeNotNil,
        lift(ifElse(
          isPlainObject,
          tokenize,
          c => [ [ VAL, c ] ])))
        .option([])

      return [
        ...tokenizedA,
        ...tokenizedB,
        ...tokenizedC ]
    })

  const combinedTokenizedActions =
    tokenizedActions.reduce((acc, tokens) =>
      [ ...acc, [ LIT, ', ' ], ...tokens ])

  return [
    [ LIT, 'SET ' ],
    ...combinedTokenizedActions ]
}

export function tokenize$size(fragment) {
  const arg = getArgs(fragment)

  const propTokens = tokenize(arg)

  return [
    [ LIT, 'size(' ],
    ...propTokens,
    [ LIT, ')' ] ]
}

// ----------------------------------------------------------------- //
// Parsing Functions
// ----------------------------------------------------------------- //
export function parseLitToken(value, acc) {
  const { expression, names, nameIdx, values, valueIdx } = acc

  return {
    expression: expression + value,
    names,
    nameIdx,
    values,
    valueIdx }
}

export function parsePropToken(value, acc) {
  const { expression, names, nameIdx, values, valueIdx } = acc
  const expName = `#n_${nameIdx}`
  const name = value
  return {
    expression: expression + expName,
    names: { ...names, [expName]: name },
    nameIdx: nameIdx + 1,
    values,
    valueIdx }
}

export function parseValToken(value, acc) {
  const { expression, names, nameIdx, values, valueIdx } = acc
  const expValue = `:v_${valueIdx}`

  return {
    expression: expression + expValue,
    names,
    nameIdx,
    values: { ...values, [expValue]: value },
    valueIdx: valueIdx + 1 }
}

export function parseTokens(nameIdx, valueIdx) {
  return tokens => {
    return flow(tokens)(
      reduce((acc, token) => {
        const [ type, value ] = token

        switch (type) {
        case PROP:
          return parsePropToken(value, acc)
        case VAL:
          return parseValToken(value, acc)
        case LIT:
          return parseLitToken(value, acc)
        default:
          throw new Error(
            `Unrecognized token type in Expression: ${inspect(token)}`)
        }
      },
      { expression: '', names: {}, nameIdx, values: {}, valueIdx }))
  }
}


// ----------------------------------------------------------------- //
// Public API
// ----------------------------------------------------------------- //
export function parseMany(exprArr) {
  // TODO: Validations

  return flow(exprArr)(
    toPairs,
    reduce(
      (acc, [ exprName, exprObj ]) => {
        // NOTE Update Expressions support multiple operations per fragment,
        // so they have to be handled slightly differently from
        // the various ConditionExpression variants
        if (exprName === 'UpdateExpression') {
          return flow(exprObj)(
            toPairs,
            map(([ op, args ]) => ({ [op]: args })),
            reduce((acc, fragment) => {
              const result = parse(fragment, acc.nameIdx, acc.valueIdx)

              const ExpressionAttributeNames =
                mergeRight(
                  acc.ExpressionAttributeNames,
                  result.ExpressionAttributeNames)
              const ExpressionAttributeValues =
                mergeRight(
                  acc.ExpressionAttributeValues,
                  result.ExpressionAttributeValues)

              return {
                ...acc,
                UpdateExpression: [ ...acc.UpdateExpression, result.Expression ],
                ExpressionAttributeNames,
                ExpressionAttributeValues,
                nameIdx: length(keys(ExpressionAttributeNames)),
                valueIdx: length(keys(ExpressionAttributeValues)) }
            }, { ...acc, UpdateExpression: [] }),
            over(lensProp('UpdateExpression'), join('\n')),
          )
        }

        const result = parse(exprObj, acc.nameIdx, acc.valueIdx)

        const ExpressionAttributeNames =
          mergeRight(
            acc.ExpressionAttributeNames,
            result.ExpressionAttributeNames)
        const ExpressionAttributeValues =
          mergeRight(
            acc.ExpressionAttributeValues,
            result.ExpressionAttributeValues)

        return {
          ...acc,
          [exprName]: result.Expression,
          ExpressionAttributeNames,
          ExpressionAttributeValues,
          nameIdx: length(keys(ExpressionAttributeNames)),
          valueIdx: length(keys(ExpressionAttributeValues)) }
      },
      { nameIdx: 0, valueIdx: 0 }),
    omit([ 'nameIdx', 'valueIdx' ]),
  )
}

export function parse(conditionExpression, nameIdx = 0, valueIdx = 0) {
  const output = flow(conditionExpression)(
    tokenize,
    parseTokens(nameIdx, valueIdx))

  const {
    expression: Expression,
    names: ExpressionAttributeNames,
    values: ExpressionAttributeValues,
  } = output

  return pickBy(complement(isEmpty), {
    Expression,
    ExpressionAttributeValues,
    ExpressionAttributeNames,
  })
}

export function tokenize(fragment) {
  const op = getOp(fragment)

  switch (op) {
  case '$add':
    return tokenize$add(fragment)
  case '$attributeNotExists':
    return tokenize$attributeNotExists(fragment)
  case '$attributeType':
    return tokenize$attributeType(fragment)
  case '$and':
    return tokenize$and(fragment)
  case '$beginsWith':
    return tokenize$beginsWith(fragment)
  case '$between':
    return tokenize$between(fragment)
  case '$contains':
    return tokenize$contains(fragment)
  case '$delete':
    return tokenize$delete(fragment)
  case '$equals':
    return tokenize$equals(fragment)
  case '$exists':
    return tokenize$exists(fragment)
  case '$gt':
    return tokenize$gt(fragment)
  case '$gte':
    return tokenize$gte(fragment)
  case '$ifNotExists':
    return tokenize$ifNotExists(fragment)
  case '$in':
    return tokenize$in(fragment)
  case '$listAppend':
    return tokenize$listAppend(fragment)
  case '$lt':
    return tokenize$lt(fragment)
  case '$lte':
    return tokenize$lte(fragment)
  case '$not':
    return tokenize$not(fragment)
  case '$or':
    return tokenize$or(fragment)
  case '$prop':
    return tokenize$prop(fragment)
  case '$remove':
    return tokenize$remove(fragment)
  case '$set':
    return tokenize$set(fragment)
  case '$size':
    return tokenize$size(fragment)
  default:
    if (op[0] === '$')
      throw new Error(`Unknown operator: ${op}`)

    // NOTE: If it's just an Object, allow for a shorthand:
    //         { 'someField': someValue } =>
    //           { $equals: [{ $prop:'someField' }, someValue]] }
    if (is(Object, fragment) && !is(Array, fragment)) {
      // NOTE: The only reason single/multi-valued objects are
      //       broken into separate cases is to make the resulting
      //       Expression a little cleaner. It means we don't end up
      //       with extra parentheses on a single-valued object

      // Handle single-valued object literal
      if (keys(fragment).length === 1)
        return tokenize$equals({ $equals: [ { $prop: op }, fragment[op] ] })

      // Handle multi-valued object literal
      return flow(fragment)(
        toPairs,
        map(([ key, val ]) => ({ $equals: [ { $prop: key }, val ] })),
        fragments => ({ $and: fragments }),
        tokenize,
      )
    }

    throw new Error(`Non-parsable expression fragment: ${inspect(fragment)}`)
  }
}


export default parse
