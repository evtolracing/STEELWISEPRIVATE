import client from './client'

// Order-entry pricing. Only routes the server has are called from here (S-026): the fifteen
// other functions this file used to export called /api/pricing/* and /api/pricing-records
// routes that do not exist, and no screen used them. The price book screens use
// /api/pricing/overview, /price-list and /list-price (pages/Pricing).
export const calculatePrice = (data) => client.post('/pricing/calculate', data).then(r => r.data)

export const getContracts = (params) => client.get('/pricing/contracts', { params }).then(r => r.data)

export default {
  calculatePrice,
  getContracts,
}
