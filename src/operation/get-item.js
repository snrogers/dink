import retry from 'p-retry'
import {
  assoc, assocPath, compose, dissoc, dissocPath, ifElse, isEmpty, mergeDeepLeft,
  mergeDeepRight, path, prop, when,
} from 'ramda'

import DbOperation from './db-operation'
import { flow } from '../utils'
import { retryErrorHandler, configureRetryOptions } from './method-utils'


const DEFAULT_VALUES = {
  error: null,
  params: {
    ConsistentRead: false,
    ReturnValues: 'NONE', // ALL_OLD or NONE
  },
  rawResult: false,
  retries: null,
}

export function GetItem(args) {
  return new GetItemOperation(args)
}

export class GetItemOperation extends DbOperation {
  constructor(args) {
    super()
    Object.assign(this, DEFAULT_VALUES, args)
  }

  /** Initialize the GetItem object.
	 * @param	{string} indexName The name of the global secondary index.
	 * @param	{{}} getItem    The GetItem for the index to filter on.
	 */
  key(Key) {
    return GetItem(mergeDeepRight(this, { params: { Key } }))
  }

  item(Item) {
    return GetItem(mergeDeepRight(this, { params: { Item } }))
  }

  /**
	 * Create a conditional update item object where the condition should be satisfied in order for the item to be
	 * updated. This should be used if you want to update a record but not insert one if the index does not exist.
	 *
	 * @param	condition           A condition that must be satisfied in order for a conditional GetItem to succeed.
	 */
  condition(keyCondition) {
    if (this.params.keyCondition)
      throw new Error('Multiple ConditionExpressions not yet implemented')

    return flow(this)(
      mergeDeepLeft({ params: { keyCondition } }),
      GetItem,
    )
  }

  consistentRead(ConsistentRead = true) {
    return flow(this)(
      mergeDeepLeft({ params: { ConsistentRead } }),
      GetItem,
    )
  }

  /** get DocumentClient.get(...) params.
	 */
  buildRawGetItem() {
    const TableName = this.table.name
    const { ConsistentRead, Key } = this.params
    const result = { ConsistentRead, Key, TableName }
    return result
  }

  async exec() {
    const db = this.db.documentClient

    if (!db)
      return Promise.reject(
        new Error('Call .connect() before executing queries.'))

    return this.runGetItem(
      () => db.get(this.buildRawGetItem()).promise())
      .then(
        data =>
          this.rawResult === true
            ? data
            : data.Item)
  }

  raw() {
    return GetItem({ ...this, rawResult: true })
  }

  async runGetItem(operation) {
    const retries = this.retries || this.db.retries
    const retryOptions = configureRetryOptions(retries)

    return retries
      ? retry(() => operation().catch(retryErrorHandler), retryOptions)
      : operation()
  }
}


export default GetItem
