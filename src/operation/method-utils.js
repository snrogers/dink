import { AbortError, Options as RetryOptions } from 'p-retry'

const whitelistedErrors = new Set([
  'ThrottlingException',
  'ServiceUnavailable',
  'ItemCollectionSizeLimitExceededException',
  'LimitExceededException',
  'ProvisionedThroughputExceededException',
  'RequestLimitExceeded',
  'InternalServerError',
  'ResourceInUseException',
])

export const retryErrorHandler = err => {
  if (whitelistedErrors.has(err.code)) {
    throw err
  }

  throw new AbortError(err)
}


const defaultRetryOptions /* : RetryOptions */ = {
  retries: 5,
  factor: 1,
  minTimeout: 300,
  maxTimeout: 2000,
  randomize: true,
}

/**
 * Configures the retry policy
 *
 * @param retries - Retry configuration.
 */
// export const configureRetryOptions = (retries /* : number | RetryOptions | undefined */) => {
export const configureRetryOptions = retries => {
  if (retries === undefined) {
    return
  }

  return typeof retries === 'number'
    ? { ...defaultRetryOptions, retries }
    : { ...defaultRetryOptions, ...retries }
}

