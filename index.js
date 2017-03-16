'use strict'

var Promise = require('bluebird')
var request = Promise.promisify(require('request'))

var token = null

// Hard coded values
var channelType = 1   // Web browser
var cardProgramId = 1 // Virtual cards

function Client (options) {
  // Check options parameters
  if (!options) {
    throw new Error('Client requires the option object on creation')
  }

  if (!options.username || !options.password || !options.businessId) {
    throw new Error('Client creation options must include username, password and businessId')
  }

  // So far so good. Let's set default request options for all methods:
  this.request = request.defaults({
    baseUrl: (options && options.apiUrl) || 'https://wcapi.wavecrest.in/v3/services',
    strictSSL: true,
    json: true,
    timeout: (options && options.timeout) || 1000 * 30
  })

  // Set credentials used in _query().renewAuthToken
  this.username = options.username
  this.password = options.password
  this.businessId = options.businessId
}

Client.prototype._getToken = function () {
  return token
}

Client.prototype._query = function (path, method, data, params) {
  var self = this
  return new Promise(function (resolve, reject) {
    var renewAuthToken = function () {
      return new Promise(function (resolve, reject) {
        var loginOptions = {
          'url': '/authenticator',
          'method': 'POST',
          'headers': {
            'X-Method-Override': 'login',
            'DeveloperId': self.username,
            'developerPassword': self.password
          }
        }

        self.request(loginOptions)
        .then(function (res) {
          if (res.statusCode !== 200 || res.body.token === undefined) {
            token = null

            var error = {
              success: false,
              statusCode: res.statusCode,
              error: {
                type: 'api'
              }
            }

            if (res.body.errorDetails) {
              error.error.description = res.body.errorDetails[0].errorDescription
              error.error.wavecrestCode = res.body.errorDetails[0].errorCode
            } else if (res.body.errorCode) {
              error.error.description = res.body.errorMessage
              error.error.wavecrestCode = res.body.errorCode
            } else {
              error.error.description = 'Unknown error'
              error.error.details = res.body
            }
            return resolve(error)
          }
          token = res.body.token
          // console.log('Successfully logged in')
          return resolve()
        })
      })
    }

    var makeRequest = function () {
      return new Promise(function (resolve, reject) {
        var options = {
          'url': path,
          'method': method,
          'body': data,
          'qs': params,
          'headers': {
            'DeveloperID': self.username,
            'AuthenticationToken': token
          }
        }

        self.request(options)
        .then(function (res) {
          if (token === null) {
            // console.log('Not logged in. Renewing API auth token.')
            return resolve(renewAuthToken().then(function (res) {
              if (token === null) {
                return res
              }
              return makeRequest()
            }))
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Successful requests
            var response = {
              success: true,
              statusCode: res.statusCode,
              body: res.body
            }
            return resolve(response)
          }

          if (res.statusCode >= 400) {
            // Error handling
            if (res.statusCode === 401) {
              // Not logged in.
              if (res.body.errorDetails[0].errorCode === '1000') { // 'Invalid or Expired authentication token'
                // console.log('Expired token')
                token = null
                return resolve(makeRequest())
              }
            }

            // Client errors
            var error = {
              success: false,
              statusCode: res.statusCode,
              error: {
                type: 'client'
              }
            }
            if (Array.isArray(res.body.errorDetails)) {
              // Wavecrest errors with description
              error.statusCode = res.statusCode
              error.error.description = res.body.errorDetails[0].errorDescription
              error.error.wavecrestCode = res.body.errorDetails[0].errorCode
            } else {
              // No much information. Use what is on the body
              error.error.description = res.body
            }
            return resolve(error)
          }
        })
        .catch(function (err) {
          // System or network errors
          var error = {
            success: false,
            statusCode: err.statusCode,
            error: {
              type: 'system',
              description: 'System or network error',
              cause: err.cause
            }
          }
          return resolve(error)
        })
      })
    }
    return resolve(makeRequest())
  })
}

Client.prototype._getCardPath = function (userId, cardProxy, path) {
  return ('/users/' + userId + '/cards/' + cardProxy + '/' + path)
}

Client.prototype._getAccountPath = function (path) {
  return ('/businesspartners/' + this.businessId + '/' + path)
}

Client.prototype.login = function () {
  return this._
}

Client.prototype.createCard = function (userDetail, refId) {
  // userDetail is an object with at least the following properties
  // {
  //   'firstName:string'
  //   'lastName:string'
  //   'dateOfBirth'
  //   'addressLine1'
  //   'city'
  //   'zipCode'
  //   'country'
  //   'mobileNumber'
  //   'landlineNumber'
  //   'email'
  //   'currencyCode'
  //   'externalReferenceId'
  //   'acceptTermsAndConditions'
  //   'acceptEsign'
  // }
  var cardInquiry = {
    'nameOnCard': userDetail.firstName + ' ' + userDetail.lastName,
    'userDetail': userDetail,
    'channelType': channelType,
    'cardProgramId': cardProgramId,
    'localeTime': new Date().toISOString(),
    'refId': refId
  }
  return this._query('cards', 'POST', cardInquiry)
  .then(function (res) {
    if (!res.success) {
      return res
    }

    var result = {
      success: true,
      statusCode: res.statusCode,
      cardDetail: res.body.cardDetail
    }
    return result
  })
}

Client.prototype.getCardDetail = function (userId, cardProxy) {
  return this._query(this._getCardPath(userId, cardProxy, 'carddetails'), 'GET')
  .then(function (res) {
    if (!res.success) {
      return res
    }
    var result = {
      success: true,
      statusCode: res.statusCode,
      cardDetail: res.body.cardDetail
    }
    result.cardDetail.cardReplaced = res.body.cardReplaced
    result.cardDetail.embossedCardNumber = res.body.embossedCardNumber
    result.cardDetail.cardReplaced = res.body.cardReplaced
    result.cardDetail.shippingMethod = res.body.shippingMethod
    result.cardDetail.shipmentTrackingId = res.body.shipmentTrackingId

    return result
  })
}

Client.prototype.getCardBalance = function (userId, cardProxy) {
  return this._query(this._getCardPath(userId, cardProxy, 'balance'), 'GET')
  .then(function (res) {
    if (!res.success) {
      return res
    }
    var result = {
      success: true,
      statusCode: res.statusCode,
      cardBalance: {
        available: {
          amount: res.body.avlBal,
          currency: res.body.currency
        },
        accountable: {
          amount: res.body.accountBal,
          currency: res.body.currency
        }
      }
    }
    return result
  })
}

Client.prototype.getCardTransactions = function (userId, cardProxy, txnCount, offset) {
  // FIXME: Implement query params
  var payload = {
    'txnType': ['All'],
    'offset': offset,
    'txnCount': txnCount
    // 'channelType':'1',
    // 'refId': '13340',
    // 'startDate': '2015-02-25T00:00:00.000+05:00',
    // 'endDate': '2016-08-31T00:00:00.000+05:00',
    // 'localeTime': '2015-02-30T00:00:00.000+05:00'
  }
  return this._query(this._getCardPath(userId, cardProxy, 'transactions'), 'POST', payload)
  .then(function (res) {
    if (!res.success) {
      return res
    }
    var result = {
      success: true,
      statusCode: res.statusCode,
      cardTransactions: res.body.transactionDetails
    }
    return result
  })
}

Client.prototype.loadCard = function (userId, cardProxy, amount, currencyCode, refId) {
  var loadData = {
    'transactionAmount': amount,
    'currencyCode': currencyCode,
    'refId': refId,
    'channelType': channelType,
    'sourceTxnDateTime': new Date().toISOString,
    'comments': 'Card load'
    // 'sourceName': 'ProgramPartner',
    // 'agentId':'707109',
  }
  return this._query(this._getCardPath(userId, cardProxy, 'load'), 'POST', loadData)
  .then(function (res) {
    if (!res.success) {
      return res
    }
    var result = {
      success: true,
      statusCode: res.statusCode,
      txDetails: {
        txId: res.body.transactionId,
        status: res.body.status,
        cardBalance: {
          available: {
            amount: res.body.accountBalanceDetails[0].availableBalance,
            currency: res.body.accountBalanceDetails[0].isoCurrencyCode
          },
          accountable: {
            amount: res.body.accountBalanceDetails[0].accountBalance,
            currency: res.body.accountBalanceDetails[0].isoCurrencyCode
          }
        }
      }
    }
    return result
  })
}

Client.prototype.getAccountBalance = function (currencyCode) {
  var payload = {
    currency: currencyCode
  }
  return this._query(this._getAccountPath('balance'), 'POST', payload)
  .then(function (res) {
    if (!res.success) {
      return res
    }
    var result = {
      success: true,
      statusCode: res.statusCode,
      accountId: res.body.txnAccountId,
      accountBalance: {
        available: {
          amount: res.body.avlBal,
          currency: res.body.currency
        },
        accountable: {
          amount: res.body.accountBal,
          currency: res.body.currency
        }
      }
    }
    return result
  })
}

Client.prototype.getAccounts = function () {
  return this._query(this._getAccountPath('txnaccounts'), 'GET')
  .then(function (res) {
    if (!res.success) {
      return res
    }
    var result = {
      success: true,
      statusCode: res.statusCode,
      accounts: res.body.txnAccountList
    }
    return result
  })
}

Client.prototype.getAccountTransactions = function (accountId, params) {
  // params is an object with different parameters to filter transactions.
  // Choices are:
  //  - sourceTxnId
  //  - transactionId
  //  - startDate={MM/DD/YYYY}
  //  - endDate={MM/DD/YYYY}
  //  - txnCount
  //  - offSet
  //  - status
  //  - txnType
  //  - crdrIndicator=credit|debit
  var fullPath = this._getAccountPath('transactionaccounts') + '/' + accountId + '/transfers'
  return this._query(fullPath, 'GET', null, params)
  .then(function (res) {
    if (!res.success) {
      return res
    }
    var result = {
      success: true,
      statusCode: res.statusCode,
      accountTransactions: res.body.txnDTOList
    }
    return result
  })
}

Client.prototype.upgradeCustomerKYC = function (userId, kycData) {
  // TODO: Implement this
  var result = {
    success: false,
    error: {
      description: 'Method not implemented'
    }
  }
  return result
}

module.exports = Client
