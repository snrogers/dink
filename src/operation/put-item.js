import retry from 'p-retry'
import {
  assoc, assocPath, complement, compose, dissoc, dissocPath,
  filter, ifElse, isEmpty, mergeDeepLeft,
  mergeDeepRight, path, prop, when,
} from 'ramda'

import DbOperation from './db-operation'
import { flow } from '../utils'
import { retryErrorHandler, configureRetryOptions } from './method-utils'
import * as Expression from './expression'


const isNotEmpty = complement(isEmpty)

export function PutItem(args) {
  return new PutItemOperation(args)
}

const DEFAULT_VALUES = {
  error: null,
  params: {
    ReturnValues: 'NONE', // ALL_OLD or NONE
  },
  rawResult: false,
  retries: null,
}

export class PutItemOperation extends DbOperation {
  constructor(args) {
    super()
    Object.assign(this, DEFAULT_VALUES, args)
  }

  /** Initialize the PutItem object.
	 * @param	{string} indexName The name of the global secondary index.
	 * @param	{{}} putItem    The PutItem for the index to filter on.
	 */
  initialize(Item) {
    return PutItem(mergeDeepRight(this, { params: { Item } }))
  }

  /**
	 * Create a conditional update item object where the condition should be satisfied in order for the item to be
	 * updated. This should be used if you want to update a record but not insert one if the index does not exist.
	 *
	 * @param	condition           A condition that must be satisfied in order for a conditional PutItem to succeed.
	 */
  condition(condition) {
    if (this.params.filter)
      throw new Error('Multiple ConditionExpressions not yet implemented')

    return flow(this)(
      mergeDeepLeft({ params: { condition } }),
      PutItem,
    )
  }

  /**
   * TODO: Wording
	 * Builds and returns the raw DynamoDB PutItem object.
	 */
  buildRawPutItem() {
    const TableName = this.table.name

    const { Item, condition } = this.params

    console.log('THIS.PARAMS', JSON.stringify(this.params, null, 2))

    const expressions = filter(isNotEmpty,
      Expression.parseMany(
        { ConditionExpression: condition }))

    const result = {
      ...expressions,
      Item: this.table.hooks.beforePutItem(Item),
      TableName,
    }

    console.log('put params', result)

    return result
  }

  async exec() {
    const db = this.db.documentClient

    if (!db)
      return Promise.reject(
        new Error('Call .connect() before executing queries.'))

    return this.runPutItem(
      () => db.put(this.buildRawPutItem()).promise())
      .then(
        data =>
          this.rawResult === true
            ? data
            : data.Attributes)
  }

  raw() {
    return PutItem({ ...this, rawResult: true })
  }

  async runPutItem (operation) {
    const retries = this.retries || this.db.retries
    const retryOptions = configureRetryOptions(retries)

    return retries
      ? retry(() => operation().catch(retryErrorHandler), retryOptions)
      : operation()
  }
}


export default PutItem
