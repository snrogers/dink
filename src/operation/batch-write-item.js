import retry from 'p-retry'
import { inspect } from 'util'
import {
  and, append, assoc, assocPath, complement,
  compose, dissoc, dissocPath, identity, ifElse,
  isEmpty, is, isNil, lensPath, map, mergeDeepLeft,
  mergeDeepRight, over, path, prop, reduce, when,
} from 'ramda'

import DbOperation from './db-operation'
import { DeleteItemOperation } from './delete-item'
import { PutItemOperation } from './put-item'
import { flow } from '../utils'
import { retryErrorHandler, configureRetryOptions } from './method-utils'

const isNotNilOrEmpty = and(complement(isNil), complement(isEmpty))
const RequestItemsLens = lensPath([ 'params', 'RequestItems' ])

const DEFAULT_VALUES = {
  // error: null, NOTE: Look at dynongo source
  operations: [],
  params: {
    RequestItems: [],
    ReturnConsumedCapacity: 'NONE', // — ("INDEXES" | "TOTAL" | "NONE")
  },
  rawResult: false,
  retries: null,
}

export function BatchWriteItem(args) {
  return new BatchWriteItemOperation(args)
}

export class BatchWriteItemOperation extends DbOperation {
  constructor(args) {
    super()
    Object.assign(this, DEFAULT_VALUES, args)
  }

  operations(operations) {
    return flow(operations)(
      map(identity), // TODO: Transform operation to params
      reduce((batchWrite, operation) => {
        if (is(DeleteItemOperation)) return this.deleteItem(operation)
        if (is(PutItemOperation)) return this.putItem(operation)
        throw new TypeError(`Unrecognized Operation: ${inspect(operation)}`)
      }, this),
      BatchWriteItem,
    )
  }

  deleteItem(operation) {
    return flow(this)(
      over(RequestItemsLens, append(operation)),
      BatchWriteItem,
    )
  }

  /** @param { boolean } ConsistentRead
    * @return { BatchWriteItemOperation } */
  consistentRead(ConsistentRead = true) {
    return flow(this)(
      mergeDeepLeft(
        { params: { RequestItems: { ConsistentRead } } }),
      BatchWriteItem,
    )
  }

  /** @param { string[] } AttributesToGet
    * @return { BatchWriteItemOperation } */
  projection(AttributesToGet) {
    return flow(this)(
      mergeDeepLeft(
        { params: { RequestItems: { AttributesToGet } } }),
      BatchWriteItem,
    )
  }

  /** @desc get DocumentClient.get(...) params.	 */
  buildRawBatchWriteItem() {
    const TableName = this.table.name
    const { RequestItems } = this.params

    // TODO: Param validations
    // const result = { RequestItems: { [TableName]: RequestItems } }
    const result =
      { RequestItems:
        { [TableName]:
          { ...RequestItems,
            AttributesToGet: [ 'left', 'right' ] } } }

    return result
  }

  async exec() {
    const db = this.db.documentClient

    if (!db)
      return Promise.reject(
        new Error('Call .connect() before executing queries.'))

    return this.runBatchWriteItem(
      () => db.batchWrite(this.buildRawBatchWriteItem()).promise())
      .then(
        data =>
          this.rawResult === true
            ? data
            : data.Responses)
  }

  raw() {
    return BatchWriteItem({ ...this, rawResult: true })
  }

  async runBatchWriteItem(operation) {
    const retries = this.retries || this.db.retries
    const retryOptions = configureRetryOptions(retries)

    return retries
      ? retry(() => operation().catch(retryErrorHandler), retryOptions)
      : operation()
  }
}


export default BatchWriteItem
