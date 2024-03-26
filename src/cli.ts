#!/usr/bin/env node
import fs from 'node:fs'
import { URL } from 'node:url'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { version } from '../package.json'
import { migrate } from './migrate'

// eslint-disable-next-line no-unused-expressions
yargs(hideBin(process.argv))
  .scriptName('mido')
  .usage('$0 [args]')
  .command(
    'migrate',
    'Migrate durable objects between environments',
    (args) => {
      return args
        .option('source', {
          alias: 's',
          type: 'string',
          describe: 'Source DO Worker dump URL, e.g., https://source-worker.example.com/dump',
          demandOption: true,
          requiresArg: true,
          coerce: (arg) => {
            try {
              const sourceUrl = new URL(arg)
              if (sourceUrl.pathname.endsWith('/dump'))
                return sourceUrl.toString()
              throw new Error('Source URL must end with /dump')
            }
            catch (error: any) {
              throw new Error(`Invalid source URL: ${error.message}`)
            }
          },
        })
        .option('dest', {
          alias: 'd',
          type: 'string',
          describe: 'Destination DO Worker write URL, e.g., https://target-worker.example.com/write',
          demandOption: true,
          requiresArg: true,
          coerce: (arg) => {
            try {
              const destUrl = new URL(arg)
              if (destUrl.pathname.endsWith('/write'))
                return destUrl.toString()
              throw new Error('Destination URL must end with /write')
            }
            catch (error: any) {
              throw new Error(`Invalid destination URL: ${error.message}`)
            }
          },
        })
        .option('batchSize', {
          alias: 'b',
          type: 'number',
          describe: 'Batch size for writes, must be an integer less than or equal to 128',
          demandOption: true,
          requiresArg: true,
          coerce: (arg) => {
            const batchSize = Number.parseInt(arg, 10)

            if (Number.isNaN(batchSize) || batchSize < 1 || batchSize > 128)
              return 128

            return batchSize
          },
        })
        .option('input', {
          alias: 'i',
          type: 'string',
          describe: 'File path containing a list of durable object IDs to process, formatted as a JSON array of strings',
          demandOption: true,
          requiresArg: true,
          coerce: (arg: string) => {
            try {
              const fileContents = fs.readFileSync(arg, 'utf8')
              const input = JSON.parse(fileContents)

              if (!Array.isArray(input) || !input.every(id => typeof id === 'string'))
                throw new Error('input must be a JSON array of strings')

              return arg as string
            }
            catch (error: any) {
              throw new Error(`Failed to read or parse input file: ${error.message}`)
            }
          },
        })
        .help()
    },
    async (args) => {
      await migrate(args.source, args.dest, args.batchSize, args.input)
      process.exit()
    },
  )
  .showHelpOnFail(false)
  .alias('h', 'help')
  .version('version', version)
  .alias('v', 'version')
  .help()
  .argv
