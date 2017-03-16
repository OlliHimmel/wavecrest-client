var expect = require('chai').expect
var nock = require('nock')
var apiClient = require(__dirname + '/index.js').apiClient

var loginResponse = {
  adminAndUserLoginRequest: {
    refId: null,
    credentials: {},
    localeTime: null,
    channelType: 0,
    program: 'ProgramName',
    programId: 13,
    developerId: 'creds.username',
    developerPassword: '',
    username: null,
    password: null,
    emailID: null,
    mobileNumber: null,
    userId: null,
    cardNumber: null,
    cvv: null,
    expiryDate: null,
    otp: null,
    dateOfBirth: null,
    proxy: null,
    android_imei: null,
    mpin: null,
    mobileAppId: null,
    loginName: null,
    primaryLoginPassword: null,
    secondaryLoginPassword: null,
    loginUserIdType: null,
    primaryLoginPasswordType: null,
    secondaryLoginPasswordType: null,
    idType: null,
    idNumber: null,
    userType: null,
    requestorId: null
  },
  token: '123456789012345678901234',
  userId: -1
}

describe('_query() method', function () {
  it('should get a new API session token', function () {
    nock('https://wcapi.wavecrest.in')
    .get('/v3/services/')
    .reply(200, {text: 'hola'})
    .persist()
    .post('/v3/services/authenticator')
    .reply(200, loginResponse)

    return apiClient._query('/', 'GET')
    .then(function (res) {
      // Check the received token
      expect(apiClient._getToken()).to.be.a('string')
      expect(apiClient._getToken()).to.have.length(24)
    })
  })
})
