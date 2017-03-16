'use strict'
var expect = require('chai').expect
var nock = require('nock')
var apiClient = require(__dirname + '/index.js').apiClient

require(__dirname + '/login.js')

describe('Card methods', function () {
  var userId = 1234567
  var cardId = 1234567890

  it('should return detail info for a card', function () {
    var detailResponse = {
      localeTime: 1473361235059,
      errorDetails: [ { errorCode: '0', errorDescription: 'Success' } ],
      usrId: cardId,
      cardDetail:
       { usrId: cardId,
         nameOnCard: 'Test User',
         proxy: cardId,
         expiryDate: '09-19',
         cardStatus: 'READY_TO_ACTIVE',
         cardType: 'VIRTUAL',
         currency: 'USD',
         cardProgramName: 'MyChoiceUK USD Virtual MasterCard',
         creationDate: '2016-09-07',
         txnId: 10071956,
         replacedCard: false,
         embossedCardholderName: 'Test User',
         pan: '1234567890123456',
         cvv: '123' },
      embossedCardNumber: null,
      fisProxy: '1746379648736598',
      kyc: 'LEVEL_1',
      shippingMethod: null,
      shipmentTrackingId: null,
      cardReplaced: false,
      reissuedDate: '2016-09-07',
      cardFulfillmentOrderStatus: null }

    nock('https://wcapi.wavecrest.in')
    .get('/v3/services/users/' + userId + '/cards/' + cardId + '/carddetails')
    .reply(200, detailResponse)

    return apiClient.getCardDetail(userId, cardId)
    .then(function (res) {
      expect(res.statusCode).to.equal(200)
      expect(res.success).to.be.true
      expect(res.cardDetail).to.exist
    })
  })

  it('should return a card balance', function () {
    var balanceResponse = {
      localeTime: 1473362397947,
      errorDetails: [ { errorCode: '0', errorDescription: 'Success' } ],
      proxy: cardId,
      avlBal: 300,
      currency: 'USD',
      accountBal: 300 }

    nock('https://wcapi.wavecrest.in')
    .get('/v3/services/users/' + userId + '/cards/' + cardId + '/balance')
    .reply(200, balanceResponse)

    return apiClient.getCardBalance(userId, cardId)
    .then(function (res) {
      expect(res.success).to.be.true
      expect(res.statusCode).to.equal(200)
      expect(res.cardBalance).to.exist

      expect(res.cardBalance.available).to.exist
      expect(res.cardBalance.available.amount).to.be.a('number')
      expect(res.cardBalance.available.amount).to.be.above(0)
      expect(res.cardBalance.available.currency).to.equals('USD')

      expect(res.cardBalance.accountable).to.exist
      expect(res.cardBalance.accountable.amount).to.be.a('number')
      expect(res.cardBalance.accountable.amount).to.be.above(0)
      expect(res.cardBalance.accountable.currency).to.equals('USD')
    })
  })

  it('should return card transactions', function () {
    var transactionsResponse = {
      localeTime: 1473363862554,
      errorDetails: [ { errorCode: '0', errorDescription: 'Success' } ],
      proxy: '253116915934713',
      txntype: [ 'All' ],
      txnCount: 10,
      offset: 0,
      currency: 'USD',
      transactionDetails: [{
        transactionId: '108154',
        tranDate: '2016-09-09T00:02:01.000+0530',
        postDate: '2016-09-09T00:02:01.000+0530',
        description: 'Value Load',
        transactionAmount: 10,
        transactionCurrency: 'USD',
        billAmount: 10,
        billCurrency: 'USD',
        totalFeeAmount: 0,
        authAmt: 10,
        currency: 'USD',
        settleAmt: 10,
        settleCurrency: 'USD',
        inserted: '2016-09-09T00:02:01.000+0530',
        merchantName: 'surBTC',
        txnType: 'Load',
        crdrIndicator: 'CREDIT',
        comment: 'Card load',
        reasoncode: '0',
        instrumentType: 'CashCard',
        status: 'Success',
        txnReference: '108154',
        sourceTxnId: '100'
      }]
    }

    nock('https://wcapi.wavecrest.in')
    .post('/v3/services/users/' + userId + '/cards/' + cardId + '/transactions')
    .reply(200, transactionsResponse)

    return apiClient.getCardTransactions(userId, cardId, 10, 0)
    .then(function (res) {
      expect(res.success).to.be.true
      expect(res.statusCode).to.equal(200)
      expect(Array.isArray(res.cardTransactions)).to.be.true
    })
  })

  it('should create a card', function () {
    var usrData = {
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1980-12-23',
      addressLine1: 'Acacia avenue 2345',
      city: 'Gotham city',
      zipCode: '7263452',
      country: 'US',
      mobileNumber: '+112345678',
      landlineNumber: '+112345678',
      email: 'johndoe@example.com',
      currencyCode: 'USD',
      externalReferenceId: '13',
      acceptTermsAndConditions: true,
      acceptEsign: true
    }

    var cardCreationResponse = {
      refId: '35',
      localeTime: 1473447750720,
      errorDetails: [ { errorCode: '0', errorDescription: 'Success' } ],
      usrId: 1197711,
      cardDetail: {
        usrId: 1197711,
        nameOnCard: 'Test User',
        proxy: '253116987417506',
        expiryDate: '09-19',
        cardStatus: 'READY_TO_ACTIVE',
        cardType: 'VIRTUAL',
        currency: 'USD',
        cardProgramName: 'MyChoiceUK USD Virtual MasterCard',
        creationDate: '2016-09-10',
        txnId: 10072072,
        replacedCard: false,
        embossedCardholderName: 'Test User',
        pan: 'XXXXXXXXXXXX3736'
      },
      eligibleForQuestions: false,
      userId: 1197711
    }

    nock('https://wcapi.wavecrest.in')
    .post('/v3/services/cards')
    .reply(200, cardCreationResponse)

    return apiClient.createCard(usrData, 35)
    .then(function (res) {
      expect(res.success).to.be.true
      expect(res.statusCode).to.equal(200)
      expect(res.cardDetail).to.exist
      expect(res.cardDetail.proxy).to.be.a('string')
      expect(res.cardDetail.proxy.length).to.be.equals(15)
      expect(res.cardDetail.nameOnCard).to.equal(usrData.firstName + ' ' + usrData.lastName)
    })
  })

  it('should load a card', function () {
    var userId = 1197711
    var cardProxy = 253116987417506
    var amount = 10
    var currency = 'USD'
    var refId = 120

    var cardLoadResponse = {
      refId: '120',
      localeTime: 1473448485308,
      errorDetails: [{errorCode: '0', errorDescription: 'Success'}],
      usrId: 1197711,
      transactionId: 108290,
      status: 'Success',
      accountBalanceDetails: [{
        txnAccountId: 10072072,
        availableBalance: 10,
        accountBalance: 10,
        isoCurrencyCode: 'USD'
      }],
      proxy: '253116987417506'
    }

    nock('https://wcapi.wavecrest.in')
    .post('/v3/services/users/' + userId + '/cards/' + cardProxy + '/load')
    .reply(200, cardLoadResponse)

    return apiClient.loadCard(userId, cardProxy, amount, currency, refId)
    .then(function (res) {
      expect(res.success).to.be.true
      expect(res.statusCode).to.equal(200)

      expect(res.txDetails).to.exist
      expect(res.txDetails.txId).to.be.above(0)
      expect(res.txDetails.status).to.be.equal('Success')
      expect(res.txDetails.cardBalance).to.exist

      expect(res.txDetails.cardBalance.available).to.exist
      expect(res.txDetails.cardBalance.available.amount).to.be.above(0)
      expect(res.txDetails.cardBalance.available.currency).to.be.equal(currency)

      expect(res.txDetails.cardBalance.accountable).to.exist
      expect(res.txDetails.cardBalance.accountable.amount).to.be.above(0)
      expect(res.txDetails.cardBalance.accountable.currency).to.be.equal(currency)
    })
  })
})
