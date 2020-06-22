import retry from 'p-retry'
import {
  and, assoc, assocPath, complement, compose, dissoc, dissocPath, ifElse,
  isEmpty, isNil, mergeDeepLeft,
  mergeDeepRight, path, prop, when,
} from 'ramda'

import DbOperation from './db-operation'
import { flow } from '../utils'
import { retryErrorHandler, configureRetryOptions } from './method-utils'

const isNotNilOrEmpty = and(complement(isNil), complement(isEmpty))

export function BatchGetItem(args) {
  return new BatchGetItemOperation(args)
}

const DEFAULT_VALUES = {
  // error: null, NOTE: Look at dynongo source
  params: {
    RequestItems: { // — (map<map>)
      AttributesToGet: null, //  — (Array<String>)
      ConsistentRead: false, //  — (Boolean)
      ExpressionAttributeNames: null, //  — (map<String>)
      Keys: null, //  — required — (Array<map<map>>)
      // ProjectionExpression: null, // NOTE: Use AttributesToGet instead
    },
    ReturnConsumedCapacity: 'NONE', // — ("INDEXES" | "TOTAL" | "NONE")
  },
  rawResult: false,
  retries: null,
}

export class BatchGetItemOperation extends DbOperation {
  constructor(args) {
    super()
    Object.assign(this, DEFAULT_VALUES, args)
  }

  /** @param	{ Array<{}> } Keys
    * @return { BatchGetItemOperation } */
  keys(Keys) {
    return flow(this)(
      mergeDeepLeft(
        { params: { RequestItems:  { Keys } } }),
      BatchGetItem,
    )
  }

  /** @param { boolean } ConsistentRead
    * @return { BatchGetItemOperation } */
  consistentRead(ConsistentRead = true) {
    return flow(this)(
      mergeDeepLeft(
        { params: { RequestItems: { ConsistentRead } } }),
      BatchGetItem,
    )
  }

  /** @param { string[] } AttributesToGet
    * @return { BatchGetItemOperation } */
  projection(AttributesToGet) {
    return flow(this)(
      mergeDeepLeft(
        { params: { RequestItems: { AttributesToGet } } }),
      BatchGetItem,
    )
  }

  /** @desc get DocumentClient.get(...) params.	 */
  buildRawBatchGetItem() {
    const TableName = this.table.tableName
    const { RequestItems } = this.params

    // TODO: Param validations
    // const result = { RequestItems: { [TableName]: RequestItems } }
    const result =
      { RequestItems:
        { [TableName]:
          { ...RequestItems,
            AttributesToGet: [ 'left', 'right' ],
          } } }
    console.log('PARAMS', result)
    return result
  }

  async exec() {
    const db = this.db.documentClient

    if (!db)
      return Promise.reject(
        new Error('Call .connect() before executing queries.'))

    return this.runBatchGetItem(
      () => db.batchGet(this.buildRawBatchGetItem()).promise())
      .then(
        data =>
          this.rawResult === true
            ? data
            : data.Responses)
  }

  raw() {
    return BatchGetItem({ ...this, rawResult: true })
  }

  async runBatchGetItem(operation) {
    const retries = this.retries || this.db.retries
    const retryOptions = configureRetryOptions(retries)

    return retries
      ? retry(() => operation().catch(retryErrorHandler), retryOptions)
      : operation()
  }
}


export default BatchGetItem
