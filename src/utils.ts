import type { KeyValue, RetryOptions } from './types'

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  for (let attempt = 0; attempt < options.retries; attempt++) {
    try {
      return await operation()
    }
    catch (error) {
      if (attempt < options.retries - 1) {
        const jitter = Math.random() * options.delay
        await new Promise(resolve => setTimeout(resolve, options.delay + jitter))
      }
      else {
        throw error
      }
    }
  }
  throw new Error('Max retries reached')
}

export function splitIntoBatches(data: KeyValue, batchSize: number): KeyValue[] {
  const entries = Object.entries(data)
  const batches: KeyValue[] = []
  for (let i = 0; i < entries.length; i += batchSize) {
    const batchEntries = entries.slice(i, i + batchSize)
    batches.push(Object.fromEntries(batchEntries))
  }
  return batches
}
