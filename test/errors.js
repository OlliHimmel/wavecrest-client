'use strict'
var expect = require('chai').expect
var nock = require('nock')
var apiClient = require(__dirname + '/index.js').apiClient

require(__dirname + '/login.js')

describe('Error handling', function () {
  it('should handle a detailed error response', function () {
    nock('https://wcapi.wavecrest.in')
    .get('/v3/services/inexistent/path')
    .reply(404, {
      errorDetails: [{
        errorDescription: 'Mock of detailed not found response',
        errorCode: '-1000'
      }]
    })

    return apiClient._query('/inexistent/path', 'GET')
    .then(function (res) {
      expect(res.success).to.be.false
      expect(res.error).to.exist
      expect(res.error.type).to.equal('client')
      expect(res.statusCode).to.equal(404)
    })
  })

  it('should handle a simple error response', function () {
    nock('https://wcapi.wavecrest.in')
    .get('/v3/services/inexistent/path')
    .reply(404, {dummyResponse: true})

    return apiClient._query('/inexistent/path', 'GET')
    .then(function (res) {
      expect(res.success).to.be.false
      expect(res.error).to.exist
      expect(res.error.type).to.equal('client')
      expect(res.statusCode).to.equal(404)
    })
  })
})
