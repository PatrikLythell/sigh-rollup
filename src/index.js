import _ from 'lodash'
import Promise from 'bluebird'
import { Bacon } from 'sigh-core'
import { mapEvents } from 'sigh-core/lib/stream'

function plumberTask(opts) {
  // this function is called once for each subprocess in order to cache state,
  // it is not a closure and does not have access to the surrounding state, use
  // `require` to include any modules you need, for further info see
  // https://github.com/ohjames/process-pool
  var log = require('sigh-core').log
  var rollup = require('rollup')

  // this task runs inside the subprocess to transform each event
  return event => {
    var data, sourceMap
    // TODO: data = compile(event.data) etc.
    console.log(opts)
    var start = rollup.rollup({
      entry: opts.entry || event.path
    })
    return start.then(bundle => {
      var result = bundle.generate({
        sourceMap: true,
        sourceMapFile: event.path
      })
      return {
        data: result.code,
        sourceMap: result.map.toString()
      }
    })
  }
}

function adaptEvent(compiler) {
  // data sent to/received from the subprocess has to be serialised/deserialised
  return event => {
    if (event.type !== 'add' && event.type !== 'change')
      return event

    // if (event.fileType !== 'relevantType') return event

    return compiler(_.pick(event, 'type', 'data', 'path', 'projectPath')).then(result => {
      event.data = result.data

      if (result.sourceMap)
        event.applySourceMap(JSON.parse(result.sourceMap))

      // event.changeFileSuffix('newSuffix')
      return event
    })
  }
}

var pooledProc

export default function(op, opts = {}) {
  if (! pooledProc)
    pooledProc = op.procPool.prepare(plumberTask, opts, { module })

  return mapEvents(op.stream, adaptEvent(pooledProc))
}
