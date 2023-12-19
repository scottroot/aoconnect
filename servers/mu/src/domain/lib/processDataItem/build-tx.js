import { of, fromPromise } from 'hyper-async'
import z from 'zod'
import { assoc, __, tap } from 'ramda'

const ctxSchema = z.object({
  tx: z.object({
    id: z.string(),
    data: z.any(),
    processId: z.string()
  })
}).passthrough()

export function buildTxWith ({ buildAndSign, logger }) {
  return (ctx) => {
    return of(ctx)
      .map(tap(() => ctx.tracer.trace('Building and signing message from outbox')))
      .chain(fromPromise(() => buildAndSign({
        processId: ctx.cachedMsg.msg.Target,
        tags: [
          ...ctx.cachedMsg.msg.Tags,
          { name: 'Data-Protocol', value: 'ao' },
          { name: 'Type', value: 'Message' },
          { name: 'Variant', value: 'ao.TN.1' }
        ],
        anchor: ctx.cachedMsg.msg.Anchor,
        data: ctx.cachedMsg.msg.Data
      })))
      .map(assoc('tx', __, ctx))
      .map(ctxSchema.parse)
      .map(logger.tap('Added tx to ctx'))
      .bimap(
        tap(() => ctx.tracer.trace('Failed to build and sign message from outbox')),
        tap(() => ctx.tracer.trace('Built and signed message from outbox'))
      )
  }
}
