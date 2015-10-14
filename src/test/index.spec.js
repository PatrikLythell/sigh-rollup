import _ from 'lodash'
import Promise from 'bluebird'
import ProcessPool from 'process-pool'
import { Bacon } from 'sigh-core'
import Event from 'sigh/lib/Event'

import plumber from '../'

require('source-map-support').install()
require('chai').should()

var mock = require('mock-fs')

describe('sigh-plumber', () => {
  var procPool
  beforeEach(() => { procPool = new ProcessPool() })
  afterEach(() => { procPool.destroy() })

  it('can roll up', () => {
    var event = new Event({
      basePath: 'root',
      path: './test.js',
      type: 'add',
    })
    var stream = Bacon.constant([ event ])

    return plumber({ stream, procPool }).toPromise(Promise).then(events => {
      events.length.should.equal(1)

      console.log(events)
    })
  })
})
