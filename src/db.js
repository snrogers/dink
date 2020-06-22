import AWS from 'aws-sdk'
import { pick } from 'ramda'
import Table from './table'


class DB {
  // public raw?: AWS.DynamoDB;

  /**
   * @param {DynamoDBOptions} options
   * @returns {DB}
   */
  connect(options) {
    this.options = {
      prefix: '',
      prefixDelimiter: '.',
      host: 'localhost',
      localPort: 8000,
      ...options,
    }

    // this._retries = configureRetryOptions(this.options.retries)

    AWS.config.update(
      pick(
        [ 'region', 'accessKeyId', 'secretAccessKey', 'sessionToken' ],
        this.options))

    if (this.options.local) {
      // Starts dynamodb in local mode
      this.raw = new AWS.DynamoDB({
        endpoint: `http://${this.options.host}:${this.options.localPort}`,
      })
    } else {
      // Starts dynamodb in remote mode
      this.raw = new AWS.DynamoDB()
    }

    this.documentClient = new AWS.DynamoDB.DocumentClient({
      service: this.raw,
    })
  }

  // get delimiter() {
  //   return this.options.prefixDelimiter
  // }

  // get prefix() {
  //   return this.options.prefix
  // }

  get retries() {
    return this._retries
  }

  /** Define a Table
   * @param {Object} args
   * @param {string} args.tableName
   * @param {Object} [args.options]
	 */
  table(args) {
    return Table({ ...args, db: this })
  }

  // ----------------------------------------------------------------- //
  // Table-modifying functions
  // ----------------------------------------------------------------- //

  createTable(opts) {
    throw new Error('Unimplemented')
  }

  dropTable(opts) {
    throw new Error('Unimplemented')
  }

  listTables(opts) {
    throw new Error('Unimplemented')
  }

  transactWrite(actions) {
    throw new Error('Unimplemented')
  }

  transactRead(actions) {
    throw new Error('Unimplmemented')
  }
}

export default DB

