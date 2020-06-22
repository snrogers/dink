import Model from '../model'
import {
  BatchGetItem,
  BatchWriteItem,
  DeleteItem,
  GetItem,
  PutItem,
  Query,
  Scan,
  UpdateItem,
} from '../operation'


const DEFAULTS = {
  // TODO: put nulled-out options here
}

/** Table Constructor
 * @param {Object} args
 * @param {string} args.tableName
 * @param {{}} args.db
 * @param {{}} args.options
 * @returns {TableClass}
 */
export function Table(args) {
  return new TableClass(args)
}

export class TableClass {
  /**
   * @param {Object} args
   * @param {string} args.tableName
   * @param {Object} args.db
   * @param {Object} [args.options]
   */
  constructor(args) {
    Object.assign(this, DEFAULTS, args)
    console.log('table constructor: ', this.hooks)
  }

  getItem(key) {
    const getItem = GetItem({ table: this, db: this.db })
    return getItem.key(key)
  }

  query(indexQuery, indexName) {
    // TODO: requires a (possibly incomplete) key? Could be GSI/LSI?
    //       think it really only needs a partitionKey
    if (!indexQuery) throw 'Queries require a primary key!'

    console.log('from table', indexQuery, indexName)
    const qry = Query({ table: this, db: this.db })
    return qry.initialize(indexQuery, indexName)
  }

  scan(index = 'primaryKey') {
    return Scan({ table: this, db: this.db, hooks: this.hooks || {}, index })
  }

  batchGetItem(keys) {
    const batchGet = BatchGetItem({ table: this, db: this.db })
    return batchGet.keys(keys)
  }

  batchWriteItem(writeBuilders) {
    throw new Error('Unimplemented')
  }

  deleteItem(key) {
    const del = DeleteItem({ table: this, db: this.db })
    return del.key(key)
  }

  putItem(item) {
    const put = PutItem({ table: this, db: this.db })
    return put.initialize(item)
  }

  model(options) {
    return Model({ table: this, ...options })
  }

  updateItem(key) {
    const update = UpdateItem({ table:this, db: this.db })
    return update.key(key)
  }
}

export default Table
