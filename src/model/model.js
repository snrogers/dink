import {
  curry, filter, forEach, identity, is, mergeDeepRight,
  omit, toPairs,
} from 'ramda'
import Table from '../table'
import { flow } from '../utils'

const DEFAULTS = {
  hooks: {
    beforePutItem: identity,
    afterPutItem: identity,
    beforeGetItem: identity,
    afterGetItem: identity,
  },
}

const Model = function(args) {
  return new ModelClass(args)
}

// TODO: Implement `$$rand(n,m)` key generator
class ModelClass {
  constructor(args) {
    Object.assign(this, DEFAULTS, args)

    const { accessPatterns, table, hooks } = args

    this.__type__ = args.name.toUpperCase()

    // TODO: a `validate` hook


    // TODO: Define hooks by iterating over indexes
    //       options from table
    // TODO: Throw an error for indexes in hooks that don't
    //       exist on the table?


    const tableWithHooks = Table({ ...table, hooks })
    this.tableWithHooks = tableWithHooks

    // Define functions for all accessPatterns
    toPairs(accessPatterns).forEach(([ patternName, accessPattern ]) => {
      const { access, afterAccess = identity } = accessPattern

      this[patternName] = async function(...args) {
        return access(tableWithHooks, ...args)
          .exec()
          .then(afterAccess)
      }
    })

    // // Bind all `this` for all methods
    // flow(this)(
    //   Object.values,
    //   filter(is(Function)),
    //   forEach(fn => fn.bind(this)),
    // )
  }

  /** Define an access pattern
   *  TODO: Determine if after-construction definition
   *        of access patterns is a good idea or not
   * @param {string}                      patternName
   * @param {{}}                          args
   * @param {(table, ...args) => Promise} args.access
   * @param {(res) => any}                [args.afterAccess]
   * @returns {ModelClass}
   */
  pattern(patternName, args) {
    const {
      access,
      afterAccess = identity,
    } = args

    return Model(mergeDeepRight(
      this,
      { accessPatterns: { [patternName]: { access, afterAccess } } }))
  }

  // ----------------------------------------------------------------- //
  // Default Access Patterns
  // ----------------------------------------------------------------- //
  async create(item) {
    return this.tableWithHooks
      .putItem(item)
      .condition(
        { $not:
          { $and: [
            { $exists: { $prop: 'PartitionKey' } },
            { $exists: { $prop: 'SortKey' } } ] } })
      .exec()
  }


  async destroy(item) {
    const getPrimaryKey = this.indexes.primaryKey
    const key = getPrimaryKey(item)
    return this.tableWithHooks
      .deleteItem(key)
      .exec()
  }

  // async findOne(key) {
  //   return this.tableWithHooks
  //     .getItem(key)
  //     .exec()
  // }

  async findAll() {
    const scan = this.tableWithHooks
      .scan()
      .where({ __type__: this.__type__ })
    return scan.exec()
  }

  async findMany(items) {
    console.log('ITEMS', items)
    const keys = items.map(this.indexes.primaryKey)
    const batchGet = this.tableWithHooks
      .batchGetItem(keys)

    return batchGet.exec()
  }
}


export default Model
