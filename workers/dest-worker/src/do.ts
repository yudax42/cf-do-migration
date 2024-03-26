export interface KeyValue {
  [key: string]: any
}

export class DemoDO {
  constructor(public state: DurableObjectState) {}

  async dumpStorage(startAfter: string = '', limit: number = 100): Promise<{ data: Map<string, any>; lastKey: string | null }> {
    const entries: Map<string, any> = await this.state.storage.list({ startAfter, limit })
    const lastKey: string | null = Array.from(entries.keys()).pop() || null
    return { data: entries, lastKey }
  }

  async bulkWrite(data: KeyValue): Promise<void> {
    await this.state.storage.transaction(async (txn) => {
      for (const [key, value] of Object.entries(data)) await txn.put(key, value)
    })
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.startsWith('/dump')) {
      const startAfter: string = url.searchParams.get('startAfter') || ''
      const limit: number = Number.parseInt(url.searchParams.get('limit')!, 10) || 100
      const { data, lastKey } = await this.dumpStorage(startAfter, limit)
      return new Response(JSON.stringify({ data: Object.fromEntries(data), lastKey }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    else if (url.pathname.startsWith('/write')) {
      const data: KeyValue = await request.json()

      if (!data)
        return new Response('data not found', { status: 400 })

      await this.bulkWrite(data)
      return new Response('Data written successfully', { status: 200 })
    }
    return new Response('Not found', { status: 404 })
  }
}
