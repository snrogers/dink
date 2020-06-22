import retry from 'p-retry'
import {
  assocPath, ifElse, mergeDeepLeft, mergeDeepRight, path,
} from 'ramda'

import { flow } from '../utils'
import { retryErrorHandler, configureRetryOptions } from './method-utils'
import * as Expression from './expression'


const DEFAULT_VALUES = {
  db: null, // AWS SDK DynamoDB instance
  conditionObj: null, // Object, will be parsed into ConditionExpression
  updateObj: null, // Object, will be parsed into UpdateExpression
  error: null,
  params: {
    TableName: null, // String
    Key: null, // Object
    ConditionExpression: null, // String
    ExpressionAttributeNames: null, // Object,=
    ExpressionAttributeValues: null, // Object
    ReturnConsumedCapacity: 'NONE', // INDEXES | TOTAL | NONE,
    ReturnItemCollectionMetrics: 'NONE', // SIZE | NONE,
    ReturnValues: 'ALL_NEW', // NONE | ALL_OLD | UPDATED_OLD | ALL_NEW | UPDATED_NEW,
    UpdateExpression: null, // String
  },
  rawResult: false,
  retries: null,
  table: null, // Dink Table instance
}

export function UpdateItem(args) {
  return new UpdateItemOperation(args)
}

export class UpdateItemOperation {
  constructor(args) {
    Object.assign(this, DEFAULT_VALUES, args)
  }

  key(Key) {
    return UpdateItem(mergeDeepRight(this, { params: { Key } }))
  }

  condition(condition) {
    if (this.condition)
      throw new Error('Multiple ConditionExpressions not yet implemented')

    return flow(this)(
      mergeDeepLeft({ condition }),
      UpdateItem,
    )
  }

  buildRawUpdateItem() {
    const { conditionObj, updateObj } = this

    const expressions = Expression.parseMany({
      UpdateExpression: updateObj,
      ...(conditionObj ? { ConditionExpression: conditionObj } : {}),
    })

    return {
      ...this.params,
      ...expressions,
      TableName: this.table.name,
    }
  }

  async exec() {
    const db = this.db.documentClient

    if (!db)
      return Promise.reject(
        new Error('Call .connect() before executing queries.'))

    return this.runUpdateItem(
      () => db.update(this.buildRawUpdateItem()).promise())
      .then(data => {
        // Return the attributes
        return this.rawResult === true ? data : data.Attributes
      })
  }

  raw() {
    return UpdateItem({ ...this, rawResult: true })
  }

  async runUpdateItem (operation) {
    const retries = this.retries || this.db.retries
    const retryOptions = configureRetryOptions(retries)

    return retries
      ? retry(() => operation().catch(retryErrorHandler), retryOptions)
      : operation()
  }
}


export default UpdateItem
