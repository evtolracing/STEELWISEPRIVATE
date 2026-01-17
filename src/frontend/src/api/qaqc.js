import client from './client'

// Quality Assurance / Quality Control API

// Unit Tests
export const getUnitTests = (unitId) => client.get(`/units/${unitId}/tests`).then(r => r.data)

export const addUnitTest = (unitId, data) => client.post(`/units/${unitId}/tests`, data).then(r => r.data)

export const getUnitTest = (unitId, testId) => client.get(`/units/${unitId}/tests/${testId}`).then(r => r.data)

export const updateUnitTest = (unitId, testId, data) => 
  client.put(`/units/${unitId}/tests/${testId}`, data).then(r => r.data)

// Unit Certifications
export const getUnitCertifications = (unitId) => client.get(`/units/${unitId}/certifications`).then(r => r.data)

export const addUnitCertification = (unitId, data) => client.post(`/units/${unitId}/certifications`, data).then(r => r.data)

export const getUnitCertification = (unitId, certId) => 
  client.get(`/units/${unitId}/certifications/${certId}`).then(r => r.data)

export const revokeUnitCertification = (unitId, certId, reason) => 
  client.delete(`/units/${unitId}/certifications/${certId}`, { data: { reason } }).then(r => r.data)

// Test Types
export const getTestTypes = () => client.get('/qaqc/test-types').then(r => r.data)

export const createTestType = (data) => client.post('/qaqc/test-types', data).then(r => r.data)

// Certification Standards
export const getCertificationStandards = () => client.get('/qaqc/standards').then(r => r.data)

export const createCertificationStandard = (data) => client.post('/qaqc/standards', data).then(r => r.data)

// QA Holds
export const getQAHolds = (params) => client.get('/qaqc/holds', { params }).then(r => r.data)

export const createQAHold = (data) => client.post('/qaqc/holds', data).then(r => r.data)

export const releaseQAHold = (holdId, data) => client.put(`/qaqc/holds/${holdId}/release`, data).then(r => r.data)

// Inspection Reports
export const getInspectionReports = (params) => client.get('/qaqc/inspections', { params }).then(r => r.data)

export const createInspectionReport = (data) => client.post('/qaqc/inspections', data).then(r => r.data)

export const getInspectionReport = (id) => client.get(`/qaqc/inspections/${id}`).then(r => r.data)

// Non-Conformance Reports (NCR)
export const getNCRs = (params) => client.get('/qaqc/ncrs', { params }).then(r => r.data)

export const createNCR = (data) => client.post('/qaqc/ncrs', data).then(r => r.data)

export const getNCR = (id) => client.get(`/qaqc/ncrs/${id}`).then(r => r.data)

export const updateNCR = (id, data) => client.put(`/qaqc/ncrs/${id}`, data).then(r => r.data)

export const closeNCR = (id, resolution) => client.put(`/qaqc/ncrs/${id}/close`, { resolution }).then(r => r.data)

export default {
  getUnitTests,
  addUnitTest,
  getUnitTest,
  updateUnitTest,
  getUnitCertifications,
  addUnitCertification,
  getUnitCertification,
  revokeUnitCertification,
  getTestTypes,
  createTestType,
  getCertificationStandards,
  createCertificationStandard,
  getQAHolds,
  createQAHold,
  releaseQAHold,
  getInspectionReports,
  createInspectionReport,
  getInspectionReport,
  getNCRs,
  createNCR,
  getNCR,
  updateNCR,
  closeNCR,
}
