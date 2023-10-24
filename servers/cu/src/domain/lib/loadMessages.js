import { Rejected, Resolved, fromPromise, of } from 'hyper-async'
import { T, always, aperture, ascend, cond, equals, head, ifElse, last, length, mergeRight, pipe, prop, reduce } from 'ramda'
import { z } from 'zod'
import ms from 'ms'

import { messageSchema } from '../model.js'
import { loadMessagesSchema, loadTimestampSchema } from '../dal.js'

/**
 * - { name: 'Scheduled-Interval', value: 'interval' }
 * - { name: 'Scheduled-Message', value: 'JSON' }
 *
 * Interval Format: 'X-Y'
 *
 * Where X is the value
 * Where Y is the unit:
 * - 'blocks'
 * - 'cron' (X is cron string)
 * - time unit ie. 'seconds' 'minutes' 'hours' 'days' 'weeks' 'months' 'years'
 *
 * - '10-blocks'
 * - '10-seconds'
 * - '* * * * *-cron'
 */
export function parseSchedules ({ tags }) {
  function parseInterval (interval = '') {
    const [value, unit] = interval
      .split('-')
      .map(s => s.trim())

    return cond([
      [equals('blocks'), always({ interval, unit, value: parseInt(value) })],
      [equals('block'), always({ interval, unit, value: parseInt(value) })],
      [equals('cron'), always({ interval, unit, value })],
      /**
       * Assume it's a time, so convert to seconds
       *
       * TODO: harden
       */
      [T, pipe(
        always({ interval, unit: 'seconds', value: Math.floor(ms([value, unit].join(' ')) / 1000) }),
        (schedule) => {
          if (schedule.value <= 0) throw new Error('time-based interval cannot be less than 1 second')
          return schedule
        }
      )]
    ])(unit)
  }

  return of(tags)
    .chain(tags => {
      /**
       * Build schedules from tags.
       * interval is matched with message using a queue
       *
       * tags like:
       *
       * [
          { name: 'Foo', value: 'Bar' },
          { name: 'Scheduled-Interval', value: '10-blocks' },
          { name: 'Scheduled-Interval', value: ' 20-seconds ' },
          {
            name: 'Scheduled-Message',
            value: action1
          },
          { name: 'Random', value: 'Tag' },
          {
            name: 'Scheduled-Message',
            value: action2
          },
          { name: 'Scheduled-Interval', value: '* 1 * * *-cron' },
          { name: 'Another', value: 'Tag' },
          {
            name: 'Scheduled-Message',
            value: action3
          }
        ]
       */
      const [schedules, queue] = reduce(
        (acc, tag) => {
          /**
           * New interval found, so push to queue
           */
          if (tag.name === SCHEDULED_INTERVAL) acc[1].push(parseInterval(tag.value))
          /**
           * New message found, so combine with earliest found interval
           * and construct the schedule
           */
          if (tag.name === SCHEDULED_MESSAGE) {
            const { value, unit, interval } = acc[1].shift()
            acc[0].push({ value, unit, interval, message: JSON.parse(tag.value) })
          }
          return acc
        },
        [[], []],
        tags
      )

      if (queue.length) return Rejected(`Unmatched Schedules found: ${queue.join(', ')}`)

      if (!schedules.length) return Resolved([])
      return Resolved(schedules)
    })
}

export const SCHEDULED_INTERVAL = 'Scheduled-Interval'
export const SCHEDULED_MESSAGE = 'Scheduled-Message'

/**
 * Whether the block height, relative to the origin block height,
 * matches the provided schedule
 */
export function isBlockOnSchedule ({ height, originHeight, schedule }) {
  return (height - originHeight) % schedule.value === 0
}

/**
 * Whether the timstamp, relative to the origin timestamp,
 * matches the provided schedule
 */
export function isTimestampOnSchedule ({ timestamp, originTimestamp, schedule }) {
  /**
   * The smallest unit of time a schedule can be placed is in seconds,
   * and if we modulo milliseconds, it can return 0 for fractional overlaps
   * of the scedule
   *
   * So convert the times to seconds perform applying modulo
   */
  timestamp = Math.floor(timestamp / 1000)
  originTimestamp = Math.floor(originTimestamp / 1000)
  return (timestamp - originTimestamp) % schedule.value === 0
}

export function scheduleMessagesBetweenWith ({
  processId,
  owner: processOwner,
  originBlock,
  suTime,
  schedules,
  blockRange
}) {
  /**
   * This will be added to the CU clock to take into account
   * any difference between the SU (whose generated sortKeys depend on its clock)
   * and the CU determining where implicit messages need to be evaluated
   *
   * The number of seconds difference between the SU clock and the CU clock
   *
   * TODO: don't think we need this since CU never instantiates a date, and
   * were only adding seconds to the timestamp as part of the block
   */
  // eslint-disable-next-line
  const suSecondsCorrection = Math.floor(
    (suTime - new Date().getTime()) / 1000
  )

  const blockBased = schedules.filter(s => s.unit === 'block' || s.unit === 'blocks')
  /**
   * sort time based schedules from most granualar to least granular. This will ensure
   * time based messages are ordered consistently w.r.t each other.
   */
  const timeBased = schedules.filter(s => s.unit === 'seconds')
    .sort(ascend(prop('value')))

  /**
   * { sortKey, block }
   */
  function maybeScheduledMessages (left, right) {
    const scheduledMessages = []

    /**
     * {blockHeight},{timestampMillis},{txIdHash}
     */
    const leftHash = left.sortKey.split(',').pop()
    /**
     * { height, timestamp }
     */
    const leftBlock = left.block
    const rightBlock = right.block

    // No Schedules
    if (!blockBased.length && !timeBased.length) return scheduledMessages

    /**
     * This is the first time in a long time that
     * i've written a vanilla for-loop lol
     *
     * Start at left's block height, incrementing 1 block per iteration until we get to right's block height
     *  - for each block-based schedule, check if any illicits a scheduled message being produced
     *  - for each second between this block and the next,
     *    check if any time-based schedules illicit a scheduled message being produced
     *
     * We must iterate by block, in order to pass the correct block information to the process
     */
    for (let curHeight = leftBlock.height; curHeight < rightBlock.height; curHeight++) {
      const curBlock = blockRange.find((b) => b.height === curHeight)
      const nextBlock = blockRange.find((b) => b.height === curHeight + 1)
      /**
       * Block-based schedule messages
       *
       * Block-based messages will always be pushed onto the sequence of messages
       * before time-based messages, which is predictable and deterministic
       */
      scheduledMessages.push.apply(
        scheduledMessages,
        blockBased.reduce(
          (acc, schedule, idx) => {
            if (isBlockOnSchedule({ height: curBlock.height, originHeight: originBlock.height, schedule })) {
              acc.push({
                message: {
                  owner: processOwner,
                  target: processId,
                  tags: schedule.message
                },
                /**
                 * TODO: don't know if this is correct, but we need something unique for the sortKey
                 * for the scheduled message
                 *
                 * append ${schedule.interval}${idx} to sortKey to make unique within block/timestamp.
                 * It will also enable performing range queries to fetch all scheduled messages by simply
                 * appending a ',' to any sortKey
                 */
                sortKey: `${curBlock.height},${curBlock.timestamp},${leftHash},${idx}${schedule.interval}`,
                AoGlobal: {
                  process: { id: processId, owner: processOwner },
                  block: curBlock
                }
              })
            }
            return acc
          },
          []
        )
      )

      /**
       * If there are no time-based schedules, then there is no reason to tick
       * through epochs, so simply skip to the next block
       */
      if (!timeBased.length) continue

      /**
       * Time based scheduled messages.
       *
       * For each second between the current block and the next block, check if any time-based
       * schedules need to generate an implicit message
       */
      for (let curTimestamp = curBlock.timestamp; curTimestamp < nextBlock.timestamp; curTimestamp += 1000) {
        scheduledMessages.push.apply(
          scheduledMessages,
          timeBased.reduce(
            (acc, schedule, idx) => {
              if (isTimestampOnSchedule({ timestamp: curTimestamp, originTimestamp: originBlock.timestamp, schedule })) {
                acc.push({
                  message: {
                    target: processId,
                    owner: processOwner,
                    tags: schedule.message
                  },
                  /**
                   * TODO: don't know if this is correct, but we need something unique for the sortKey
                   * for the scheduled message
                   *
                   * append ${schedule.interval}${idx} to sortKey to make unique within block/timestamp.
                   * It will also enable performing range queries to fetch all scheduled messages by simply
                   * appending a ',' to any sortKey
                   */
                  sortKey: `${curHeight},${curTimestamp},${leftHash},${idx}${schedule.interval}`,
                  AoGlobal: {
                    process: { id: processId, owner: processOwner },
                    block: curBlock
                  }
                })
              }
              return acc
            },
            []
          )
        )
      }

      // TODO implement CRON based schedules
    }

    return scheduledMessages
  }

  return (left, right) => {
    const messages = []
    messages.push.apply(messages, maybeScheduledMessages(left, right))
    /**
     * Sandwich the scheduled messages between the two actual messages
     */
    messages.unshift(left)
    messages.push(right)
    return messages
  }
}

function loadSequencedMessagesWith ({ loadMessages, loadBlocksMeta, logger }) {
  loadMessages = fromPromise(loadMessagesSchema.implement(loadMessages))

  return (ctx) =>
    of(ctx)
      .chain(args => loadMessages({
        processId: args.id,
        owner: args.owner,
        from: args.from, // could be undefined
        to: args.to // could be undefined
      }))
      .bimap(
        logger.tap('Error occurred when loading sequenced messages from "%s" to "%s"...', ctx.from || 'initial', ctx.to || 'latest'),
        ifElse(
          length,
          logger.tap('Successfully loaded sequenced messages from "%s" to "%s"...', ctx.from || 'initial', ctx.to || 'latest'),
          logger.tap('No sequenced messages found from "%s" to "%s"...', ctx.from || 'initial', ctx.to || 'latest')
        )
      )
      .chain((sequenced) => {
        if (!sequenced.length) return of({ sequenced, blockRange: [] })

        /**
       * We have to load the metadata for all the blocks between
       * the earliest and latest message being evaluated, so that we
       * can generate the scheduled messages that occur on each block
       */
        return of({ min: head(sequenced), max: last(sequenced) })
          .map(logger.tap('loading blocks meta for sequenced messages in range: %j'))
          .chain(({ min, max }) => loadBlocksMeta({ min: min.block.height, max: max.block.height }))
          .map(blockRange => ({ sequenced, blockRange }))
      })
}

function loadScheduledMessagesWith ({ loadTimestamp, logger }) {
  loadTimestamp = fromPromise(loadTimestampSchema.implement(loadTimestamp))

  /**
   * - find all schedule tags on the process
   * - if schedules exist:
   *   - for each pair of messages
   *     - determine date range and block range
   *     - generate X number of scheduled messages
   *     - place in between messages
   * - else noop
   */
  return (ctx) => of(ctx)
    .chain(parseSchedules)
    .bimap(
      logger.tap('Failed to parse schedules:'),
      ifElse(
        length,
        logger.tap('Schedules found'),
        logger.tap('No schedules found. No scheduled messages to generate')
      )
    )
    .chain(
      (schedules) => {
        if (!schedules.length) return of(ctx.sequenced)

        /**
         * Some schedules were found, so potentially generate messages from them
         */
        return loadTimestamp()
          .chain((suTime) =>
            of(ctx.sequenced)
            /**
             * Split our list of sequenced messages into binary Tuples
             * of consecutive messages
             */
              .map(aperture(2))
              .map(pairs => {
                const scheduleMessagesBetween = scheduleMessagesBetweenWith({
                  processId: ctx.id,
                  owner: ctx.owner,
                  originBlock: ctx.block,
                  blockRange: ctx.blockRange,
                  schedules,
                  suTime
                })

                return reduce(
                  (merged, [left, right]) => {
                    const scheduled = scheduleMessagesBetween(left, right)
                    logger(
                      'Loaded %s scheduled messages between messages %j and %j',
                      scheduled.length,
                      left,
                      right
                    )
                    merged.push.apply(merged, scheduled)
                    return merged
                  },
                  [],
                  pairs
                )
              })
          )
      }
    )
    .map(messages => ({ messages }))
}

/**
 * The result that is produced from this step
 * and added to ctx.
 *
 * This is used to parse the output to ensure the correct shape
 * is always added to context
 */
const ctxSchema = z.object({
  /**
   * Messages to be evaluated
   */
  messages: z.array(messageSchema)
}).passthrough()

/**
 * @typedef LoadMessagesArgs
 * @property {string} id - the contract id
 * @property {string} [from] - the lowermost sortKey
 * @property {string} [to] - the highest sortKey
 *
 * @typedef LoadMessagesResults
 * @property {any[]} messages
 *
 * @callback LoadMessages
 * @param {LoadMessagesArgs} args
 * @returns {Async<LoadMessagesResults & LoadMessagesArgs>}
 *
 * @typedef Env
 * @property {LoadMessages} loadInteractions
 */

/**
 * @param {Env} env
 * @returns {LoadMessages}
 */
export function loadMessagesWith (env) {
  const logger = env.logger.child('loadMessages')
  env = { ...env, logger }

  const loadSequencedMessages = loadSequencedMessagesWith(env)
  const loadScheduledMessages = loadScheduledMessagesWith(env)

  // { id, owner, block, tags ... }
  return (ctx) =>
    of(ctx)
      .chain(loadSequencedMessages)
      // { sequenced, blockRange }
      .chain(({ sequenced, blockRange }) =>
        loadScheduledMessages({ ...ctx, sequenced, blockRange })
      )
      // { messages }
      .map(mergeRight(ctx))
      .map(ctxSchema.parse)
      .map(logger.tap('Loaded messages and appended to context %j'))
}
