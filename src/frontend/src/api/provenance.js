import client from './client'

export const lookupProvenance = (identifier) => client.get(`/provenance/lookup/${identifier}`).then(r => r.data)

export const getProvenanceChain = (unitId) => client.get(`/provenance/chain/${unitId}`).then(r => r.data)

export const verifyProvenance = (hash) => client.get(`/provenance/verify/${hash}`).then(r => r.data)

export const getProvenanceEvents = (unitId) => client.get(`/provenance/events/${unitId}`).then(r => r.data)

export const anchorToBlockchain = (data) => client.post('/provenance/anchor', data).then(r => r.data)

export const getBlockchainRecords = (params) => client.get('/provenance/blockchain', { params }).then(r => r.data)

export const generateCertificate = (unitId) => client.post(`/provenance/certificate/${unitId}`).then(r => r.data)

export const getCertificates = (params) => client.get('/provenance/certificates', { params }).then(r => r.data)

export const verifyCertificate = (certId) => client.get(`/provenance/certificates/${certId}/verify`).then(r => r.data)

export default {
  lookupProvenance,
  getProvenanceChain,
  verifyProvenance,
  getProvenanceEvents,
  anchorToBlockchain,
  getBlockchainRecords,
  generateCertificate,
  getCertificates,
  verifyCertificate,
}
