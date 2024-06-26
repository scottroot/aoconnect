// TODO: update these tests


// import { describe, test } from 'node:test'
// import * as assert from 'node:assert'
//
// import { createLogger } from '../../logger.js'
// import { verifyInputsWith } from './verify-inputs.js'
//
// const MODULE = 'zVkjFCALjk4xxuCilddKS8ShZ-9HdeqeuYQOgMgWucro'
// const SCHEDULER = 'zVkjFCALjk4xxuCilddKS8ShZ-9HdeqeuYQOgMgWucrm'
//
// const logger = createLogger('spawn')
//
// describe('verify-input', () => {
//   test('verify source tags and verify signer', async () => {
//     const verifyInput = verifyInputsWith({
//       loadTransactionMeta: async (_id) =>
//         ({
//           tags: [
//             { name: 'Data-Protocol', value: 'ao' },
//             { name: 'Data-Protocol', value: 'Data-Protocol' },
//             { name: 'Type', value: 'Module' },
//             { name: 'Module-Format', value: 'emscripten' },
//             { name: 'Input-Encoding', value: 'JSON-1' },
//             { name: 'Output-Encoding', value: 'JSON-1' }
//           ]
//         }),
//       validateScheduler: async (id) => {
//         assert.equal(id, SCHEDULER)
//         return true
//       },
//       logger
//     })
//
//     await verifyInput({
//       module: MODULE,
//       scheduler: SCHEDULER,
//       signer: () => {},
//       tags: [
//         { name: 'foo', value: 'bar' }
//       ]
//     }).toPromise().then(assert.ok)
//   })
//
//   describe('throw if required tag is invalid on source', () => {
//     test('Data-Protocol', async () => {
//       const verifyInput = verifyInputsWith({
//         loadTransactionMeta: async (_id) =>
//           ({
//             tags: [
//               { name: 'Data-Protocol', value: 'not_ao' },
//               { name: 'Data-Protocol', value: 'still_not_ao' }
//             ]
//           }),
//         validateScheduler: async (id) => {
//           assert.equal(id, SCHEDULER)
//           return true
//         },
//         logger
//       })
//
//       await verifyInput({
//         module: MODULE,
//         scheduler: SCHEDULER,
//         signer: () => {},
//         tags: [
//           { name: 'foo', value: 'bar' }
//         ]
//       }).toPromise()
//         .then(assert.fail)
//         .catch(err => {
//           assert.equal(
//             err,
//             "Tag 'Data-Protocol': value 'ao' was not found on module"
//           )
//         })
//     })
//
//     test('Type', async () => {
//       const verifyInput = verifyInputsWith({
//         loadTransactionMeta: async (_id) =>
//           ({
//             tags: [
//               { name: 'Data-Protocol', value: 'ao' },
//               { name: 'Type', value: 'Foobar' }
//             ]
//           }),
//         validateScheduler: async (id) => {
//           assert.equal(id, SCHEDULER)
//           return true
//         },
//         logger
//       })
//
//       await verifyInput({
//         module: MODULE,
//         scheduler: SCHEDULER,
//         signer: () => {},
//         tags: [
//           { name: 'foo', value: 'bar' }
//         ]
//       }).toPromise()
//         .then(assert.fail)
//         .catch(err => {
//           assert.equal(
//             err,
//             "Tag 'Type': value 'Module' was not found on module"
//           )
//         })
//     })
//
//     test('Module-Format', async () => {
//       const verifyInput = verifyInputsWith({
//         loadTransactionMeta: async (_id) =>
//           ({
//             tags: [
//               { name: 'Data-Protocol', value: 'ao' },
//               { name: 'Type', value: 'Module' }
//             ]
//           }),
//         validateScheduler: async (id) => {
//           assert.equal(id, SCHEDULER)
//           return true
//         },
//         logger
//       })
//
//       await verifyInput({
//         module: MODULE,
//         scheduler: SCHEDULER,
//         signer: () => {},
//         tags: [
//           { name: 'foo', value: 'bar' }
//         ]
//       }).toPromise()
//         .then(assert.fail)
//         .catch(err => {
//           assert.equal(
//             err,
//             "Tag 'Module-Format': was not found on module"
//           )
//         })
//     })
//
//     test('Input-Encoding', async () => {
//       const verifyInput = verifyInputsWith({
//         loadTransactionMeta: async (_id) =>
//           ({
//             tags: [
//               { name: 'Data-Protocol', value: 'ao' },
//               { name: 'Type', value: 'Module' },
//               { name: 'Module-Format', value: 'emscripten' }
//             ]
//           }),
//         validateScheduler: async (id) => {
//           assert.equal(id, SCHEDULER)
//           return true
//         },
//         logger
//       })
//
//       await verifyInput({
//         module: MODULE,
//         scheduler: SCHEDULER,
//         signer: () => {},
//         tags: [
//           { name: 'foo', value: 'bar' }
//         ]
//       }).toPromise()
//         .then(assert.fail)
//         .catch(err => {
//           assert.equal(
//             err,
//             "Tag 'Input-Encoding': was not found on module"
//           )
//         })
//     })
//
//     test('Output-Encoding', async () => {
//       const verifyInput = verifyInputsWith({
//         loadTransactionMeta: async (_id) =>
//           ({
//             tags: [
//               { name: 'Data-Protocol', value: 'ao' },
//               { name: 'Type', value: 'Module' },
//               { name: 'Module-Format', value: 'emscripten' },
//               { name: 'Input-Encoding', value: 'JSON-1' }
//             ]
//           }),
//         validateScheduler: async (id) => {
//           assert.equal(id, SCHEDULER)
//           return true
//         },
//         logger
//       })
//
//       await verifyInput({
//         module: MODULE,
//         scheduler: SCHEDULER,
//         signer: () => {},
//         tags: [
//           { name: 'foo', value: 'bar' }
//         ]
//       }).toPromise()
//         .then(assert.fail)
//         .catch(err => {
//           assert.equal(
//             err,
//             "Tag 'Output-Encoding': was not found on module"
//           )
//         })
//     })
//   })
//
//   test('throw if signer is not found', async () => {
//     const verifyInput = verifyInputsWith({
//       loadTransactionMeta: async (_id) =>
//         ({
//           tags: [
//             { name: 'Data-Protocol', value: 'ao' },
//             { name: 'Data-Protocol', value: 'Data-Protocol' },
//             { name: 'Type', value: 'Module' },
//             { name: 'Module-Format', value: 'emscripten' },
//             { name: 'Input-Encoding', value: 'JSON-1' },
//             { name: 'Output-Encoding', value: 'JSON-1' }
//           ]
//         }),
//       validateScheduler: async (id) => {
//         assert.equal(id, SCHEDULER)
//         return true
//       },
//       logger
//     })
//
//     await verifyInput({
//       module: MODULE,
//       scheduler: SCHEDULER,
//       signer: undefined,
//       tags: [
//         { name: 'foo', value: 'bar' }
//       ],
//       logger
//     }).toPromise()
//       .then(assert.fail)
//       .catch(err => {
//         assert.equal(
//           err,
//           'signer not found'
//         )
//       })
//   })
//
//   test('throw if scheduler is not found', async () => {
//     const verifyInput = verifyInputsWith({
//       loadTransactionMeta: async (_id) =>
//         ({
//           tags: [
//             { name: 'Data-Protocol', value: 'ao' },
//             { name: 'Data-Protocol', value: 'Data-Protocol' },
//             { name: 'Type', value: 'Module' },
//             { name: 'Module-Format', value: 'emscripten' },
//             { name: 'Input-Encoding', value: 'JSON-1' },
//             { name: 'Output-Encoding', value: 'JSON-1' }
//           ]
//         }),
//       validateScheduler: async (id) => {
//         assert.equal(id, SCHEDULER)
//         return false
//       },
//       logger
//     })
//
//     await verifyInput({
//       module: MODULE,
//       scheduler: SCHEDULER,
//       signer: () => {},
//       tags: [
//         { name: 'foo', value: 'bar' }
//       ],
//       logger
//     }).toPromise()
//       .then(assert.fail)
//       .catch(err => {
//         assert.equal(
//           err,
//           `Valid Scheduler-Location owned by ${SCHEDULER} not found`
//         )
//       })
//   })
// })
