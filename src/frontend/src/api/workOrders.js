import client from './client'

export const createWorkOrder = (data) => client.post('/work-orders', data).then(r => r.data)

export default {
  createWorkOrder,
}
