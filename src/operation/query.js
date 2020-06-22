import retry from 'p-retry'
import {
  always, complement, compose, isNil, mergeDeepLeft,
  mergeDeepRight, pick, when,
} from 'ramda'

import * as Expression from './expression'
import { flow } from '../utils'
import { retryErrorHandler, configureRetryOptions } from './method-utils'

// ----------------------------------------------------------------- //
// Constants and Helpers
// ----------------------------------------------------------------- //
const DEFAULT_VALUES = {
  error: null,
  params: {},
  rawResult: false,
  retries: null,
}

const isNotNil = complement(isNil)

// ----------------------------------------------------------------- //
// Public API
// ----------------------------------------------------------------- //
export function Query(args) {
  return new QueryOperation(args)
}


// ----------------------------------------------------------------- //
// Private API
// ----------------------------------------------------------------- //
export class QueryOperation {
  constructor(args) {
    Object.assign(this, DEFAULT_VALUES, args)
  }

  /** Initialize the query object.
	 * @param	query			The query for the index to filter on.
	 * @param	indexName		The name of the global secondary index.
	 */
  initialize(keyCondition, indexName) {
    console.log('IndexName', indexName)

    return flow(this)(
      mergeDeepLeft({ params: { keyCondition } }),
      when(
        compose(isNotNil, always(indexName)),
        mergeDeepLeft({ params: { indexName } })), // TODO: when(___, assoc)
      Query,
    )
  }

  where(filter) {
    if (this.params.filter)
      throw new Error('Multiple ConditionExpressions not yet implemented')

    return flow(this)(
      mergeDeepLeft({ params: { filter } }),
      Query,
    )
  }

  /** The order in which to return the query results - either
   * ascending (1) or descending (-1).
	 * @param	order		The order in which to return the query results. */
  sort(order /* : 1 | -1 */) {
    if (order !== 1 && order !== -1) {
      return Query({
        ...this,
        error : new Error('Provided sort argument is incorrect. Use 1 for ascending and -1 for descending order.'),
      })
    }

    const ScanIndexForward = order === 1

    return Query(mergeDeepRight(this,
      { params: { ScanIndexForward } }))
  }

  /**
	 * Builds and returns the raw DynamoDB query object.
	 */
  buildRawQuery() {
    const limit = this.params.Limit
    const TableName = this.table.name

    console.log('BUILDRAWQUERY', this.params)
    const {
      indexName,
      keyCondition,
      filter,
      selectExpression,
    } = this.params
    console.log('keyCondition', this.params.keyCondition)

    const expressions = Expression.parseMany({
      KeyConditionExpression: keyCondition,
      ...(filter ? { FilterExpression: filter } : {}),
    })

    const result = {
      ...expressions,
      IndexName: indexName,
      SelectExpression: selectExpression,
      TableName,
    }

    console.log('RESULT', result)

    // TODO: Figure out wtf this is about
    if (limit === 1 && result.FilterExpression) delete result.Limit

    return result
  }

  async exec() {
    if (this.error) return Promise.reject(this.error)

    const documentClient = this.db.documentClient

    if (!documentClient) {
      return Promise.reject(new Error('Call .connect() before executing queries.'))
    }

    const limit = this.params.Limit
    const query = this.buildRawQuery()

    return this.runQuery(() => documentClient.query(query).promise())
      .then(data => {
        if (query.Select === 'COUNT') return data.Count || 0
        if (!data.Items) return []

        // TODO: Does this mean it can get more than one in the response?
        // NOTE: It does! because this is not a Query, it's a Query
        if (limit === 1) {
          if (this.rawResult === true) return { ...data, Items : [ data.Items[0] ] }

          // If the limit is specifically set to 1, we should return the object instead of the array.
          return data.Items[0]
        }

        // Return all the items
        return this.rawResult === true
          ? data
          : data.Items
      })
  }

  raw() { return Query({ ...this, rawResult: true }) }

  retry(numRetriesOrOptions) {
    return Query({ ...this, retries: numRetriesOrOptions })
  }

  async runQuery (operation) {
    const retries = this.retries || this.db.retries
    const retryOptions = configureRetryOptions(retries)

    return retries
      ? retry(() => operation().catch(retryErrorHandler), retryOptions)
      : operation()
  }
}

export default Query
