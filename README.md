Wavecrest REST client
=======

Promises based REST client for [Wavecrest](https://www.wavecrest.gi/) API

[![JavaScript Style Guide](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Overview

Wavecrest card processor exposes an API to create, load and manage debit cards. This client consumes their API handling authentication and other low-level details

## Getting started

Install this package as a dependency:

      npm install --save wavecrest-rest-client

## Usage


```javascript

var Client = require('wavecrest-rest-client')

var creds = {
  username: 'apiUsername',
  password: 'apiPassword',
  businessId: apiBusinessId
}

var client = new Client(creds)

var accId = 123456

client.getAccountTransactions(accId)
.then(function (res) {
  if (res.success) {
    console.log('Call successful. Details: ' JSON.stringify(res))
  } else {
    console.log('Error! Details: ' JSON.stringify(res))
  }
})

```

### Return values

All methods returns an object with a `success` boolean property representing the result of the API call. It is duty of the caller to inspect it to handle errors.

### Error handling

In case of errors, the response object will include an `error` attribute that can be inspected to handle them. Inside this object, the `type` attr classifies the error in one of the following categories:

* `client`: Error caused by a malformed API call or caused by exceeded limits (card load limit, card creation limits, etc)
* `api`: API is unable to handle requests. Can be caused by incorrect authentication credentials or API malfunction.
* `system`: Error caused by local system or network.

## Methods

### Card management

#### `createCard(userDetail, refId)`

Creates a new card associated to the user defined in userDetail.

Args:

- `userDetail`: (required) A User object has to include at least the following information:
  - `firstName`: string
  - `lastName`: string,
  - `dateOfBirth`: 'YYYY-MM-DD',
  - `addressLine1`: string
  - `city`: string,
  - `zipCode`: string,
  - `country`: string (country ISO code),
  - `mobileNumber`: string,
  - `landlineNumber`: string,
  - `email`: string (valid email address),
  - `currencyCode`: string (valid currency ISO code),
  - `externalReferenceId`: string (unique user identifier),
  - `acceptTermsAndConditions`: true,
  - `acceptEsign`: true
- `refId`: string (required, unique): Unique card identifier

Response:
``` javascript
{ success: true,
  statusCode: 200,
  cardDetail:
   { usrId: 1234567,
     nameOnCard: 'Test User',
     proxy: '123456789012345',
     expiryDate: '09-19',
     cardStatus: 'READY_TO_ACTIVE',
     cardType: 'VIRTUAL',
     currency: 'USD',
     cardProgramName: 'MyChoiceUK USD Virtual MasterCard',
     creationDate: '2016-09-07',
     txnId: 12345678,
     replacedCard: false,
     embossedCardholderName: 'Test User',
     pan: 'XXXXXXXXXXXX2345'
   }
}
```

#### `loadCard(userId, cardProxy, amount, currencyCode, refId)`

Loads `amount` balance on `currencyCode` currency from the corresponding Business Account to a created card.

Args:

- `userId`: number (required)
- `cardId`: number (required)
- `amount`: number (required)
- `currencyCode`: string (required)
- `refId`: number (required, unique)

Response:
``` javascript
{ success: true,
  statusCode: 200,
  txDetails:
   { txId: 107934,
     status: 'Success',
     cardBalance: {
        available: { amount: 10, currency: 'USD'},
        accountable: { amount: 10, currency: 'USD'}
      }
  }
}
```


#### `getCardDetails(userId, cardProxy)`

Retrieves details for `cardProxy` card that belongs to user `userId`

Args:

- `userId`: number (required)
- `cardProxy`: number (required)

Response:
```javascript
{ success: true,
  statusCode: 200,
  cardDetail:
   { usrId: 1234567,
     nameOnCard: 'Test User',
     proxy: '123456789123456',
     expiryDate: '08-19',
     cardStatus: 'READY_TO_ACTIVE',
     cardType: 'VIRTUAL',
     currency: 'USD',
     cardProgramName: 'MyChoiceUK USD Virtual MasterCard',
     creationDate: '2016-08-18',
     txnId: 12345678,
     replacedCard: false,
     embossedCardholderName: 'Test User',
     pan: '1234567890123456',
     cvv: '123',
     cardReplaced: false,
     embossedCardNumber: null,
     shippingMethod: null,
     shipmentTrackingId: null
   }
}
```

#### `getCardBalance(userId, cardProxy)`

Retrieves current balance for `cardProxy` card that belongs to user `userId`

Args:

- `userId`: number (required)
- `cardProxy`: number (required)

Response:
```javascript
{ success: true,
  statusCode: 200,
  cardBalance:
   { available: { amount: 102, currency: 'USD' },
     accountable: { amount: 102, currency: 'USD' }
   }
 }
```

#### `getCardTransactions(userId, cardProxy, txnCount, offset)`

Retrieves a list of `cardProxy` card transactions. As this list can be large, `txnCount` (number of transactions) and `offset` (starting position) parameters must be provided.


Args:

- `userId`: number (required)
- `cardProxy`: number (required)
- `txnCount`: number (required)
- `offset`: number (required)

Response:
``` javascript
{ success: true,
  statusCode: 200,
  cardTransactions:
   [ { transactionId: '107394',
       tranDate: '2016-09-02T02:42:21.000+0530',
       postDate: '2016-09-02T02:42:21.000+0530',
       description: 'Value Load',
       transactionAmount: 1,
       transactionCurrency: 'USD',
       billAmount: 1,
       billCurrency: 'USD',
       totalFeeAmount: 0,
       authAmt: 1,
       currency: 'USD',
       settleAmt: 1,
       settleCurrency: 'USD',
       inserted: '2016-09-02T02:42:21.000+0530',
       merchantName: 'merchantName',
       txnType: 'Load',
       crdrIndicator: 'CREDIT',
       comment: 'Card load',
       reasoncode: '0',
       instrumentType: 'CashCard',
       status: 'Success',
       txnReference: '107394' }]
}
```


### Accounts management

#### `getAccountBalance(currencyCode)`

Retrieves the balance to the corresponding Business Account that handles `currencyCode` currency (ie: 'USD').

Args:

- `currencyCode`: string (required)

Response:
``` javascript
{ success: true,
  statusCode: 200,
  accountId: 12345678,
  accountBalance:
   { available: { amount: 9999787, currency: 'USD' },
     accountable: { amount: 9999787, currency: 'USD' }}
}
```

#### `getAccounts()`

Retrieves a list of Business Accounts associated with the API caller.


``` javascript
{ success: true,
  statusCode: 200,
  accounts:
   [ { txnAccountId: 12345678,
       status: 'Active',
       currency: 'EUR',
       type: 'REGULAR',
       primary: true },
     { txnAccountId: 12345678,
       status: 'Active',
       currency: 'USD',
       type: 'REGULAR',
       primary: false },
     { txnAccountId: 12345678,
       status: 'Active',
       currency: 'GBP',
       type: 'REGULAR',
       primary: false }]
}
```
#### `getAccountTransactions(accountId, params)`

Retrieves a list of transaction of corresponding `accountId` Business Account.
As the list of transactions can be large, this method can be provided with a `params` object containing filters to apply.

Possible attrs of params object:

- `sourceTxnId`
- `transactionId`
- `startDate`={MM/DD/YYYY}
- `endDate`={MM/DD/YYYY}
- `txnCount`
- `offSet`
- `status`
- `txnType`
- `crdrIndicator`=credit|debit

Args:

- `accountId`: number (required)
- `params`: object (optional)

Response:
``` javascript
{ success: true,
  statusCode: 200,
  transactions:
   [ { transactionId: 107393,
       instrumentType: 'BeneficiaryBankAccount',
       description: 'Load to Card (XXXX-8911)',
       currency: 'USD',
       txnAmount: 1,
       creationTime: '2016-09-02T02:42:21.000+0530',
       creationTimeAsLong: 1234567841000,
       settlementDate: '2016-09-02T02:42:21.000+0530',
       settlementDateAsLong: 1234567841000,
       txnDate: '2016-09-02T02:42:21.000+0530',
       status: 'Success',
       txnType: 'Unload',
       merchantCategory: null,
       merchantId: null,
       sourceTxnId: null,
       settleAmount: 1,
       responseCode: 0,
       billAmount: 1,
       totalFeeAmount: 0,
       crdrIndicator: 'DEBIT',
       comments: 'Card load',
       merchantName: 'MyChoiceUK',
       accountBalance: 9999788,
       availableBalance: 9999788,
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
       txnReference: '107393',
       terminalId: '107393',
       processorName: null,
       runningBalance: 9999787 }]
}
```

### Not implemented

#### `upgradeCustomerKYC(userId, kycData)`

#### `replaceCard()`

#### `getCardCORSToken()`
