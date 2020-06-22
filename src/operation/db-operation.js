import { mergeDeepRight } from 'ramda'

export default class DbOperation {
  /**
   *  @param { 'INDEXES' | 'TOTAL' | 'NONE' } val
   *  @return { DbOperation }
   */
  returnConsumedCapacity(val = 'TOTAL') {
    return new this.constructor(
      mergeDeepRight(
        this,
        { params: { ReturnConsumedCapacity: val } },
      ))
  }

  /**
   *  @param { 'SIZE' | 'NONE' } val
   *  @return { DbOperation }
   */
  returnItemCollectionMetrics(val = 'SIZE') {
    return new this.constructor(
      mergeDeepRight(
        this,
        { params: { ReturnItemCollectionMetrics: val } },
      ))
  }
}
