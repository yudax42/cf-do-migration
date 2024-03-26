# Mido CLI

## Introduction

`mido` is a simple CLI tool for migration and seeding of Cloudflare Durable Objects across zones or accounts. It helps with transferring data from source to target Durable Objects and for seeding new data.

## Installation

Install `mido` globally with npm:

```bash
npm install mido -g
```

## Configuration

Set up your source and target Workers with `/dump` and `/write` endpoints for migration:

- Source Worker: Implements `/dump` for data retrieval.
- Target Worker: Offers `/write` for writing data.

See examples in the `/workers` directory for [source](./workers/source-worker) and [target](./workers/target-worker) workers.

## Usage

### Migrating Durable Objects

Migrate data using:

```bash
mido migrate --source [SOURCE_URL] --dest [DEST_URL] --batchSize [BATCH_SIZE] --input [INPUT_FILE]
```

**Options:**
- `--source, -s`: Source DO Worker dump endpoint URL.
- `--dest, -d`: Destination DO Worker write endpoint URL.
- `--batchSize, -b`: Records per batch (≤ 1000).
- `--input, -i`: JSON file with Durable Object IDs.

### Seeding Durable Objects

Seed data with:

```bash
mido seed --doId [DO_ID] --target [TARGET_URL] --data [DATA_FILE] --batchSize [BATCH_SIZE]
```

**Options:**
- `--doId, -id`: Durable Object ID for seeding.
- `--target, -t`: Target DO endpoint URL.
- `--data, -d`: JSON file with seed data.
- `--batchSize, -b`: Batch size (max 1000).

## Best Practices

- Secure `/dump` and `/write` endpoints.
- Test migration and seeding in staging before production.
