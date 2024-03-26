import { promises as fs } from 'node:fs'
import fetch from 'node-fetch'
import type { KeyValue } from './types'
import { logBatch, logData, logError, logInfo, logProcess, logWarning, splitIntoBatches, withRetry } from './utils'

let targetBaseUrl: string

async function initGlobals(dest: string, size: number): Promise<void> {
  targetBaseUrl = dest
}

async function uploadBatch(doId: string, batch: KeyValue): Promise<void> {
  const url = `${targetBaseUrl}?doId=${doId}`
  logWarning(`Starting batch upload for DO ID ${doId}...`)
  await withRetry<void>(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
    if (!response.ok)
      throw new Error(`Failed to upload batch for DO ID ${doId}: ${response.statusText}`)
    logInfo(`Batch upload for DO ID ${doId} completed successfully.`)
  }, { retries: 3, delay: 1000 })
}

async function readDataFromFile(inputFile: string): Promise<KeyValue[]> {
  logData(`Reading data from file: ${inputFile}`)
  const data = await fs.readFile(inputFile, { encoding: 'utf8' })
  return JSON.parse(data)
}

export async function seed(doId: string, sourceDoUrl: string, inputFile: string, batchSize: number = 128): Promise<void> {
  try {
    logProcess(`Seeding process started for DO ID ${doId}...`)
    await initGlobals(sourceDoUrl, batchSize)
    const data = await readDataFromFile(inputFile)
    const batches = splitIntoBatches(data, batchSize)
    logBatch(`Data split into ${batches.length} batches.`)
    for (const batch of batches)
      await uploadBatch(doId, batch)
    logProcess(`Seeding process completed for DO ID ${doId}.`)
  }
  catch (error: any) {
    logError('An unexpected error occurred during seeding:')
    logError(error.message)
  }
}
