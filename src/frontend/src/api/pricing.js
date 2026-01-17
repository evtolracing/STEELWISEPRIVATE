import client from './client'

export const getPriceList = (params) => client.get('/pricing/prices', { params }).then(r => r.data)

export const getPrice = (id) => client.get(`/pricing/prices/${id}`).then(r => r.data)

export const createPrice = (data) => client.post('/pricing/prices', data).then(r => r.data)

export const updatePrice = (id, data) => client.put(`/pricing/prices/${id}`, data).then(r => r.data)

export const getSurcharges = () => client.get('/pricing/surcharges').then(r => r.data)

export const updateSurcharge = (id, data) => client.put(`/pricing/surcharges/${id}`, data).then(r => r.data)

export const getMarketPrices = (params) => client.get('/pricing/market', { params }).then(r => r.data)

export const getQuotes = (params) => client.get('/pricing/quotes', { params }).then(r => r.data)

export const getQuote = (id) => client.get(`/pricing/quotes/${id}`).then(r => r.data)

export const createQuote = (data) => client.post('/pricing/quotes', data).then(r => r.data)

export const updateQuote = (id, data) => client.put(`/pricing/quotes/${id}`, data).then(r => r.data)

export const calculatePrice = (data) => client.post('/pricing/calculate', data).then(r => r.data)

export const getContracts = (params) => client.get('/pricing/contracts', { params }).then(r => r.data)

// Pricing Records (market data)
export const getPricingRecords = (params) => client.get('/pricing-records', { params }).then(r => r.data)

export const createPricingRecord = (data) => client.post('/pricing-records', data).then(r => r.data)

export const updatePricingRecord = (id, data) => client.put(`/pricing-records/${id}`, data).then(r => r.data)

export const deletePricingRecord = (id) => client.delete(`/pricing-records/${id}`).then(r => r.data)

export const getCurrentPricing = (params) => client.get('/pricing', { params }).then(r => r.data)

export default {
  getPriceList,
  getPrice,
  createPrice,
  updatePrice,
  getSurcharges,
  updateSurcharge,
  getMarketPrices,
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  calculatePrice,
  getContracts,
  getPricingRecords,
  createPricingRecord,
  updatePricingRecord,
  deletePricingRecord,
  getCurrentPricing,
}
