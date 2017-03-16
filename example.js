var Client = require('./index.js')

var creds = {
  username: 'sw9c5h2l34kxy7qbgobq',
  password: 'a1!M&Wosb1*e',
  businessId: 1194644
}

var userId = 1196334
var cardId = 253116937457644
var accId = 10068218
var accId2 = 10070337

var wc_client = new Client(creds)


var params = {
  transactionId: 104044
}

var usr = {
  firstName: 'Test',
  lastName: 'User',
  dateOfBirth: '1980-12-23',
  addressLine1: 'Acacia avenue 2345',
  city: 'Gotham city',
  zipCode: '7263452',
  country: 'US',
  mobileNumber: '+112345678',
  landlineNumber: '+112345678',
  email: 'camilo@dinex.cl',
  currencyCode: 'USD',
  externalReferenceId: '13',
  acceptTermsAndConditions: true,
  acceptEsign: true
}

  wc_client.getCardBalance(1218804, 253116989834450).then(res => {
  console.log(res)
})
