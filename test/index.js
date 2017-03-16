'use strict'

var Client = require(__dirname + '/../index.js')
var creds = {
  username: 'testUser',
  password: 'testPassword',
  businessId: 123456
}

module.exports = {
  apiClient: new Client(creds),
  creds: creds
}
