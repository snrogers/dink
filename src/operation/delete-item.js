import retry from 'p-retry'
import {
  assoc, assocPath, complement, compose, dissoc, dissocPath,
  filter, ifElse, isEmpty, mergeLeft, mergeDeepLeft,
  mergeDeepRight, path, prop, when,
} from 'ramda'

import DbOperation from './db-operation'
import * as Expression from './expression'
import { flow } from '../utils'
import { retryErrorHandler, configureRetryOptions } from './method-utils'


const isNotEmpty = complement(isEmpty)

export function DeleteItem(args) {
  return new DeleteItemOperation(args)
}

// TODO: move `condition` to root level
const DEFAULT_VALUES = {
  error: null,
  params: {
    Key: null,
    TableName: null,
    ConditionExpression: null,
    ExpressionAttributeNames: {},
    ExpressionAttributeValues: {},
    ReturnConsumedCapacity: 'NONE', // — ("INDEXES" | "TOTAL" | "NONE")
    ReturnItemCollectionMetrics: 'NONE', // ('SIZE' | 'NONE')
    condition: {},
    ReturnValues: 'ALL_OLD', // ('NONE' | 'ALL_OLD')
  },
  rawResult: false,
  retries: null,
}

export class DeleteItemOperation extends DbOperation {
  constructor(args) {
    super()
    Object.assign(this, DEFAULT_VALUES, args)
  }

  /** Initialize the DeleteItem object.
	 * @param	{string} indexName The name of the global secondary index.
	 * @param	{{}} deleteItem    The DeleteItem for the index to filter on.
	 */
  key(Key) {
    return DeleteItem(mergeDeepRight(this, { params: { Key } }))
  }

  /**
	 * Create a conditional update item object where the condition should be satisfied in order for the item to be
	 * updated. This should be used if you want to update a record but not insert one if the index does not exist.
	 * @param	condition           A condition that must be satisfied in order for a conditional DeleteItem to succeed.
	 */
  condition(condition) {
    if (this.params.condition)
      throw new Error('Multiple ConditionExpressions not yet implemented')

    return flow(this)(
      mergeDeepLeft({ params: { condition } }),
      DeleteItem,
    )
  }

  /** get DocumentClient.get(...) params.
	 */
  buildRawDeleteItem() {
    console.log('this.table', this.table)
    const TableName = this.table.name
    const { Key, ReturnValues, condition } = this.params
    console.log('THIS.PARAMS', this.params)

    const result = isEmpty(condition)
      ? { Key, ReturnValues, TableName }
      : mergeLeft(
        filter(isNotEmpty,
          Expression.parseMany(
            { ConditionExpression: condition })),
        { Key, TableName })

    return result
  }

  async exec() {
    const db = this.db.documentClient

    if (!db)
      return Promise.reject(
        new Error('Call .connect() before executing queries.'))

    return this.runDeleteItem(
      () => db.delete(this.buildRawDeleteItem()).promise())
      .then(
        data =>
          this.rawResult === true
            ? data
            : data.Attributes)
  }

  raw() {
    return DeleteItem({ ...this, rawResult: true })
  }

  async runDeleteItem(operation) {
    const retries = this.retries || this.db.retries
    const retryOptions = configureRetryOptions(retries)

    return retries
      ? retry(() => operation().catch(retryErrorHandler), retryOptions)
      : operation()
  }
}


export default DeleteItem
