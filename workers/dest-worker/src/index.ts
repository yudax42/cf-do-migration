/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export { DemoDO } from './do'

export interface Env {
  DEMO_DO: DurableObjectNamespace
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/dump') || url.pathname.startsWith('/write')) {
      const doId = url.searchParams.get('doId')

      if (!doId)
        return new Response('doID is required', { status: 400 })

      const id = env.DEMO_DO.idFromName(doId)
      const stub = env.DEMO_DO.get(id)
      const dump = await stub.fetch(request)

      return new Response(await dump.text(), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }
    else {
      return new Response('Method not allowed', { status: 405 })
    }
  },
}
