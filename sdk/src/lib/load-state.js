import { fromPromise, of, Rejected, Resolved } from "hyper-async";
import {
  __,
  always,
  applySpec,
  assoc,
  mergeRight,
  path,
  pick,
  pipe,
  prop,
  reduce,
} from "ramda";
import { z } from "zod";

const [INIT_STATE_TAG, INIT_STATE_TX_TAG] = ["Init-State", "Init-State-TX"];

const transactionSchema = z.object({
  tags: z.array(z.object({
    name: z.string(),
    value: z.string(),
  })),
  block: z.object({
    id: z.string(),
    height: z.coerce.number(),
    timestamp: z.coerce.number(),
  }),
});

/**
 * The result that is produced from this step
 * and added to ctx.
 *
 * This is used to parse the output to ensure the correct shape
 * is always added to context
 */
const stateSchema = z.object({
  /**
   * The most recent state. This could be the most recent
   * cached state, or potentially the initial state
   * if no interactions are cached
   */
  state: z.record(z.any()),
  /**
   * When the cache record was created in the local db. If the initial state had to be retrieved
   * from Arweave, due to no state being cached in the local db, then this will be undefined.
   */
  createdAt: z.date().optional(),
  /**
   * The most recent interaction sortKey. This could be the most recent
   * cached interaction, or potentially the initial state sort key,
   * if no interactions were cached
   *
   * This will be used to subsequently determine which interactions
   * need to be fetched from the network in order to perform the evaluation
   */
  from: z.coerce.string(),
}).passthrough();

/**
 * @callback LoadTransactionMeta
 * @param {string} id - the id of the transaction
 * @returns {Async<z.infer<typeof transactionSchema>>}
 *
 * @callback LoadTransaction
 * @param {string} id - the id of the transaction
 * @returns {Async<Response>}
 *
 * @typedef Env
 * @property {LoadTransactionMeta} loadTransactionMeta
 * @property {LoadTransaction} loadTransactionData
 * @property {any} db
 */

/**
 * @callback ResolveInitialState
 * @param {string} id - the id of the contract whose src is being loaded
 * @returns {Async<Record<string, any>>}
 *
 * @param {Env} env
 * @returns {ResolveInitialState}
 */
function resolveStateWith({ loadTransactionData }) {
  function maybeInitState(ctx) {
    if (!ctx.tags[INIT_STATE_TAG]) {
      return Rejected(ctx);
    }
    return Resolved(JSON.parse(ctx.tags[INIT_STATE_TAG]));
  }

  function maybeInitStateTx(ctx) {
    if (!ctx.tags[INIT_STATE_TX_TAG]) return Rejected(ctx);

    return loadTransactionData(ctx.tags[INIT_STATE_TX_TAG])
      .chain(fromPromise((res) => res.json()));
  }

  function maybeData(ctx) {
    return loadTransactionData(ctx.id)
      .chain(fromPromise((res) => res.json()));
  }

  /**
   * First check Init-State tag
   * Then check Init-State-Tx tag and fetch if defined
   * Then check transaction data
   */
  return (ctx) =>
    of(ctx)
      .bichain(Rejected, maybeInitState)
      .bichain(maybeInitStateTx, Resolved)
      .bichain(maybeData, Resolved);
}

/**
 * @typedef LoadInitialStateTagsArgs
 * @property {string} id - the id of the contract
 *
 * @callback LoadInitialStateTags
 * @param {LoadInitialStateTagsArgs} args
 * @returns {Async<string>}
 *
 * @param {Env} env
 * @returns {LoadInitialStateTags}
 */
function getSourceInitStateTagsWith({ loadTransactionMeta }) {
  return ({ id }) => {
    return loadTransactionMeta(id)
      .map(transactionSchema.parse)
      .map(pick(["tags", "block"]))
      .map(applySpec({
        id: always(id),
        tags: pipe(
          prop("tags"),
          reduce((a, t) => assoc(t.name, t.value, a), {}),
          pick([INIT_STATE_TAG, INIT_STATE_TX_TAG]),
        ),
        /**
         * Use the block height as the sort key
         *
         * See https://academy.warp.cc/docs/sdk/advanced/bundled-interaction#how-it-works
         */
        from: path(["block", "height"]),
      }));
  };
}

/**
 * @typedef MostRecentStateArgs
 * @property {string} id - the contract id
 * @property {string} to - the uppermost sort key
 *
 * @callback LoadMostRecentState
 * @param {MostRecentStateArgs} args
 * @returns {Async<string>}
 *
 * @param {Env} env
 * @returns {LoadMostRecentState}
 */
function getMostRecentStateWith({ db }) {
  return ({ id, to }) =>
    db.findLatestInteraction({ id, to })
      .chain((interaction) => {
        if (!interaction) return Rejected({ id, to });
        return Resolved({
          state: interaction.output.state,
          // TODO: probably a better way to do this
          createdAt: interaction.createdAt,
          from: interaction.id,
        });
      });
}

/**
 * @typedef Args
 * @property {string} id - the id of the contract
 *
 * @typedef Result
 * @property {string} id - the id of the contract
 * @property {ArrayBuffer} src - an array buffer that contains the Contract Wasm Src
 *
 * @callback LoadSource
 * @param {Args} args
 * @returns {Async<Result>}
 *
 * @param {Env} env
 * @returns {LoadSource}
 */
export function loadStateWith(env) {
  const getMostRecentState = getMostRecentStateWith(env);
  const getSourceInitStateTags = getSourceInitStateTagsWith(env);
  const resolveState = resolveStateWith(env);

  return (ctx) => {
    return of({ id: ctx.id, to: ctx.to })
      .bichain(Rejected, getMostRecentState)
      .bichain(
        /**
         * No recent state was found in the local db, so we need
         * to resolve the initial state from Arweave.
         */
        ({ id }) =>
          getSourceInitStateTags({ id })
            .chain((meta) => resolveState(meta).map(assoc("state", __, meta))),
        /**
         * A recent resultant state was found in the local db,
         * so do nothing
         */
        Resolved,
      )
      .bimap(
        (err) => {
          console.error(err);
          throw new Error("initial state could not be found");
        },
        (res) =>
          mergeRight(
            ctx,
            stateSchema.parse({
              state: res.state,
              createdAt: res.createdAt,
              from: res.from,
            }),
          ),
      );
  };
}