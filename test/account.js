'use strict'
var expect = require('chai').expect
var nock = require('nock')
var apiClient = require(__dirname + '/index.js').apiClient
var businessId = require(__dirname + '/index.js').creds.businessId

require(__dirname + '/login.js')

describe('Account methods', function () {
  it('should return a business account balance', function () {
    var accBalanceResponse = {
      errorDetails: [{errorCode: '0', errorDescription: 'Success'}],
      avlBal: 9999757,
      currency: 'USD',
      accountBal: 9999757,
      txnAccountId: 10068218
    }

    nock('https://wcapi.wavecrest.in')
    .post('/v3/services/businesspartners/' + businessId + '/balance')
    .reply(200, accBalanceResponse)

    return apiClient.getAccountBalance('USD')
    .then(function (res) {
      expect(res.success).to.be.true
      expect(res.statusCode).to.equal(200)
      expect(res.accountBalance).to.exist

      expect(res.accountBalance.available).to.exist
      expect(res.accountBalance.available.amount).to.be.a('number')
      expect(res.accountBalance.available.amount).to.be.above(0)
      expect(res.accountBalance.available.currency).to.equals('USD')

      expect(res.accountBalance.accountable).to.exist
      expect(res.accountBalance.accountable.amount).to.be.a('number')
      expect(res.accountBalance.accountable.amount).to.be.above(0)
      expect(res.accountBalance.accountable.currency).to.equals('USD')
    })
  })

  it('should return account a list of business accounts', function () {
    var accountsResponse = {
      errorDetails: [ { errorCode: '0', errorDescription: 'Success' } ],
      txnAccountList: [
        {
          txnAccountId: 10068217,
          status: 'Active',
          currency: 'EUR',
          type: 'REGULAR',
          primary: true
        },
        {
          txnAccountId: 10068218,
          status: 'Active',
          currency: 'USD',
          type: 'REGULAR',
          primary: false
        },
        {
          txnAccountId: 10068219,
          status: 'Active',
          currency: 'GBP',
          type: 'REGULAR',
          primary: false
        }
      ]
    }

    nock('https://wcapi.wavecrest.in')
    .get('/v3/services/businesspartners/' + businessId + '/txnaccounts')
    .reply(200, accountsResponse)

    return apiClient.getAccounts()
    .then(function (res) {
      expect(res.success).to.be.true
      expect(res.statusCode).to.equal(200)
      expect(res.accounts).to.exist

      expect(Array.isArray(res.accounts)).to.be.true
    })
  })

  it('should return a list with business account transactions', function () {
    var accTransactionsResponse = {
      errorDetails: [{errorCode: '0', errorDescription: 'Success'}],
      usrId: 1194644,
      transactionId: 0,
      refNumber: null,
      status: null,
      feeDetail: null,
      accountBalanceDetails:
       [ { txnAccountId: 10068218,
           availableBalance: 9999757,
           accountBalance: 9999757,
           isoCurrencyCode: 'USD' } ],
      seamlessEnabled: null,
      userId: 1194644,
      txnDTOList:
       [ { transactionId: 108153,
           instrumentType: 'BeneficiaryBankAccount',
           description: 'Load to Card (XXXX-4429)',
           currency: 'USD',
           txnAmount: 10,
           creationTime: '2016-09-09T00:02:01.000+0530',
           creationTimeAsLong: 1473359521000,
           settlementDate: '2016-09-09T00:02:01.000+0530',
           settlementDateAsLong: 1473359521000,
           txnDate: '2016-09-09T00:02:01.000+0530',
           status: 'Success',
           txnType: 'Unload',
           merchantCategory: null,
           merchantId: null,
           sourceTxnId: '100',
           settleAmount: 10,
           responseCode: 0,
           billAmount: 10,
           totalFeeAmount: 0,
           crdrIndicator: 'DEBIT',
           comments: 'Card load',
           merchantName: 'MyChoiceUK',
           accountBalance: 9999767,
           availableBalance: 9999767,
           txnAccountType: 'REGULAR',
           reversal: null,
           instrumentId: null,
           source: null,
           returnType: 0,
           billCurrency: 'USD',
           approvalCode: null,
           processorTxnId: null,
           avsCheckResult: null,
           tdsCheckResult: null,
           txnReference: '108153',
           terminalId: '108153',
           processorName: null,
           runningBalance: 9999757 }]
    }

    nock('https://wcapi.wavecrest.in')
    .get('/v3/services/businesspartners/' + businessId + '/transactionaccounts/' + 12345678 + '/transfers')
    .reply(200, accTransactionsResponse)

    return apiClient.getAccountTransactions(12345678)
    .then(function (res) {
      expect(res.success).to.be.true
      expect(res.statusCode).to.equal(200)
      expect(Array.isArray(res.accountTransactions)).to.be.true
      expect(res.accountTransactions.length).to.be.equal(1)
    })
  })
})
