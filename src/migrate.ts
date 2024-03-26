import { promises as fs } from 'node:fs'
import fetch from 'node-fetch'
import type { FetchDataResponse, KeyValue } from './types'
import { logBatch, logError, logInfo, logProcess, splitIntoBatches, withRetry } from './utils'

let sourceBaseUrl: string
let targetBaseUrl: string
let batchSize: number
let durableObjectIds: string[]

async function initGlobals(source: string, dest: string, size: number, inputFile: string): Promise<void> {
  sourceBaseUrl = source
  targetBaseUrl = dest
  batchSize = size
  const idsData = await fs.readFile(inputFile, { encoding: 'utf8' })
  durableObjectIds = JSON.parse(idsData)
}

async function fetchData(doId: string): Promise<void> {
  logInfo(`Fetching data for DO ID: ${doId}`)
  const url = `${sourceBaseUrl}?doId=${doId}`
  await withRetry<void>(async () => {
    let lastKey: string | undefined
    let allData: KeyValue = {}
    do {
      const queryParams = lastKey ? `&startAfter=${lastKey}` : ''
      logProcess(`Fetching data from source with lastKey: ${lastKey}`)
      const response = await fetch(`${url}${queryParams}`)
      if (!response.ok)
        throw new Error(`Failed to fetch data for DO ID ${doId}: ${response.statusText}`)
      const { data, lastKey: newLastKey } = await response.json() as FetchDataResponse
      allData = { ...allData, ...data }
      lastKey = newLastKey
    } while (lastKey)
    await fs.writeFile(`${doId}.json`, JSON.stringify(allData))
    logInfo(`Data fetched and written to file for DO ID: ${doId}`)
  }, { retries: 3, delay: 1000 })
}

async function uploadBatch(doId: string, batch: KeyValue): Promise<void> {
  const url = `${targetBaseUrl}?doId=${doId}`
  await withRetry<void>(async () => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
    if (!response.ok)
      throw new Error(`Failed to upload batch for DO ID ${doId}: ${response.statusText}`)
  }, { retries: 3, delay: 1000 })
}

async function readDataFromFile(doId: string): Promise<KeyValue[]> {
  const data = await fs.readFile(`${doId}.json`, { encoding: 'utf8' })
  return JSON.parse(data)
}

async function migrateDataForDoId(doId: string): Promise<void> {
  logInfo(`Starting migration for DO ID: ${doId}`)
  await fetchData(doId)
  const data = await readDataFromFile(doId)
  const batches = splitIntoBatches(data, batchSize)
  for (const batch of batches) {
    logBatch(`Uploading batch for DO ID: ${doId}`)
    await uploadBatch(doId, batch)
  }
  logInfo(`Migration completed for DO ID: ${doId}`)
}

export async function migrate(source: string, dest: string, size: number, inputFile: string): Promise<void> {
  try {
    logInfo('Migration process started.')
    await initGlobals(source, dest, size, inputFile)
    const migrationPromises = durableObjectIds.map(migrateDataForDoId)
    const results = await Promise.allSettled(migrationPromises)

    results.forEach((result, index) => {
      if (result.status === 'fulfilled')
        logInfo(`Migration succeeded for DO ID: ${durableObjectIds[index]}`)
      else
        logError(`Migration failed for DO ID: ${durableObjectIds[index]}: ${result.reason}`)
    })
    logInfo('Migration process completed.')
  }
  catch (error: any) {
    logError(`An unexpected error occurred during migration: ${error}`)
  }
}
