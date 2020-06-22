import retry from 'p-retry'
import { identity, mergeDeepLeft, mergeDeepRight } from 'ramda'

import { parse } from './expression'
import { flow } from '../utils'
import { retryErrorHandler, configureRetryOptions } from './method-utils'


const DEFAULT_OPTIONS = {
  computations: [],
  params: {},
}

export function Scan(args) {
  return new ScanOperation(args)
}

export class ScanOperation {
  constructor(args) {
    Object.assign(this, DEFAULT_OPTIONS, args)
  }

  buildRawScan() {
    const limit = this.params.Limit

    const result = {
      ...this.params,
      TableName: this.table.name,
    }

    // NOTE: Why no filter expression if limit === 1 ?
    //       I think it's because Limit applies to Items
    //       scanned, not Items returned
    if (limit === 1 && result.FilterExpression) {
      delete result.Limit
    }

    return result
  }

  /**
	 * Execute the scan.
	 */
  async exec() {
    const db = this.db.documentClient

    if (!db) throw new Error('Call .connect() before executing queries.')

    const limit = this.params.Limit
    const query = this.buildRawScan()

    return this.runScan(() => db.scan(query).promise())
      .then(data =>
        ({
          ...data,
          Items: data.Items.map(this.hooks.afterGetItem || identity),
        }))
      .then(data => {
        if (query.Select === 'COUNT') return data.Count || 0
        if (!data.Items) return []

        if (limit === 1) {
          // If the limit is specifically set to 1,
          // we should return the object instead of the array.
          if (this.rawResult === true) {
            data.Items = [ data.Items[0] ]
            return data
          }

          return data.Items[0]
        }

        // Resolve all the items
        return this.rawResult === true ? data : data.Items
      })
  }

  async runScan (operation) {
    const retries = this.retries || this.db.retries
    const retryOptions = configureRetryOptions(retries)

    return retries
      ? retry(() => operation().catch(retryErrorHandler), retryOptions)
      : operation()
  }

  limit(Limit) { return Scan(mergeDeepRight(this, { params: { Limit } })) }

  raw() { return Scan({ ...this, rawResult: true }) }

  retry(numRetriesOrOptions) {
    return Scan({ ...this, retries: numRetriesOrOptions })
  }

  startFrom(ExclusiveStartKey) {
    return Scan(mergeDeepRight(this, { params: { ExclusiveStartKey } }))
  }

  count() {
    return Scan(mergeDeepRight(this, { params: { Select: 'COUNT' } }))
  }

  /**	@desc Select a subset of the result. */
  select(projection /* : string | undefined */) {
    throw new Error('Select expressions are not yet implemented!')
    if (!projection) return this

    // Convert space separated or comma separated lists to a single comma
    projection = projection.replace(/,? +/g, ',')

    // Split the projection by space
    const splittedProjection = projection.split(',')

    // Reconstruct the expression
    const expression = splittedProjection.map(p => `#k_${p}`).join(', ')

    // Construct the names object
    const names = {}
    for (const token of splittedProjection) {
      names[`#k_${token}`] = token
    }

    // Add the projection expression and add the list of names to the attribute names list
    this._params.ProjectionExpression = expression
    this._params.ExpressionAttributeNames = {
      ...this._params.ExpressionAttributeNames,
      ...names,
    }

    // Return the query so that it can be chained
    return this
  }

  /** The order in which to return the scan results - either
   * ascending (1) or descending (-1).
	 * @param	order		The order in which to return the scan results. */
  sort(order /* : 1 | -1 */) {
    if (order !== 1 && order !== -1) {
      return Scan({
        ...this,
        error: new Error('Provided sort argument is incorrect. Use 1 for ascending and -1 for descending order.'),
      })
    }

    const ScanIndexForward = order === 1

    return Scan(mergeDeepRight(this,
      { params: { ScanIndexForward } }))
  }

  /**
	 * Filter the records more fine grained.
	 *
	 * @param	query			The query to filter the records on.
	 */
  where(filter) {
    const parsedFilter = parse(filter)

    const {
      Expression: FilterExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    } = parsedFilter


    return flow(this)(
      mergeDeepLeft({ params: {
        FilterExpression,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      } }),
      a => console.log('scan w/new filter', a) || a,
      Scan,
    )
  }
}

export default Scan
