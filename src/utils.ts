import kleur from 'kleur'
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

export function generateRandomData(size: number): KeyValue {
  const data: KeyValue = {}
  for (let i = 0; i < size; i++) {
    const key = `key${i}`
    const value = Math.random()
    data[key] = value
  }
  return data
}

const stdout = console

export function logInfo(message: string) {
  stdout.log(kleur.green(message))
}

export function logWarning(message: string) {
  stdout.log(kleur.yellow(message))
}

export function logError(message: string) {
  stdout.error(kleur.red(message))
}

export function logData(message: string) {
  stdout.log(kleur.blue(message))
}

export function logProcess(message: string) {
  stdout.log(kleur.magenta(message))
}

export function logBatch(message: string) {
  stdout.log(kleur.cyan(message))
}
