import client from './client'

// ==================== OPERATORS API ====================

export const getOperators = (params = {}) =>
  client.get('/staff/operators', { params }).then((r) => r.data)

export const getOperator = (id) =>
  client.get(`/staff/operators/${id}`).then((r) => r.data)

export const createOperator = (data) =>
  client.post('/staff/operators', data).then((r) => r.data)

export const updateOperator = (id, data) =>
  client.patch(`/staff/operators/${id}`, data).then((r) => r.data)

export const deleteOperator = (id) =>
  client.delete(`/staff/operators/${id}`).then((r) => r.data)

// ==================== OPERATOR SKILLS API ====================

export const getOperatorSkills = (operatorId) =>
  client.get(`/staff/operators/${operatorId}/skills`).then((r) => r.data)

export const addOperatorSkill = (operatorId, data) =>
  client.post(`/staff/operators/${operatorId}/skills`, data).then((r) => r.data)

export const updateOperatorSkill = (operatorId, skillId, data) =>
  client.patch(`/staff/operators/${operatorId}/skills/${skillId}`, data).then((r) => r.data)

export const removeOperatorSkill = (operatorId, skillId) =>
  client.delete(`/staff/operators/${operatorId}/skills/${skillId}`).then((r) => r.data)

// ==================== SHIFTS API ====================

export const getShifts = (params = {}) =>
  client.get('/staff/shifts', { params }).then((r) => r.data)

export const createShift = (data) =>
  client.post('/staff/shifts', data).then((r) => r.data)

export const updateShift = (id, data) =>
  client.patch(`/staff/shifts/${id}`, data).then((r) => r.data)

export const cancelShift = (id) =>
  client.delete(`/staff/shifts/${id}`).then((r) => r.data)

// ==================== STAFF UTILITIES ====================

export const getStaffStats = () =>
  client.get('/staff/stats').then((r) => r.data)

export const getAvailableOperators = (params = {}) =>
  client.get('/staff/available', { params }).then((r) => r.data)
