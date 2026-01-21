import { v4 as uuidv4 } from 'uuid';
import { contacts, rfqs, quotes, orders, jobs } from './orderHubStore.js';

export function initOrderHubData() {
  // Clear existing data
  contacts.length = 0;
  rfqs.length = 0;
  quotes.length = 0;
  orders.length = 0;
  jobs.length = 0;

  // ============================================================================
  // SEED CONTACTS
  // ============================================================================
  const contact1 = {
    id: uuidv4(),
    companyName: 'Midwest Fabricators Inc',
    contactName: 'John Miller',
    email: 'jmiller@midwestfab.com',
    phone: '(312) 555-0101',
    billingAddress: '1234 Industrial Blvd, Chicago, IL 60614',
    shippingAddress: '1234 Industrial Blvd, Chicago, IL 60614',
    notes: 'Preferred customer - net 30 terms',
    createdAt: new Date().toISOString()
  };

  const contact2 = {
    id: uuidv4(),
    companyName: 'Great Lakes Steel Works',
    contactName: 'Sarah Thompson',
    email: 'sthompson@glsteelworks.com',
    phone: '(216) 555-0202',
    billingAddress: '5678 Steel Ave, Cleveland, OH 44101',
    shippingAddress: '5678 Steel Ave, Cleveland, OH 44101',
    notes: 'High volume account',
    createdAt: new Date().toISOString()
  };

  const contact3 = {
    id: uuidv4(),
    companyName: 'Precision Parts Corp',
    contactName: 'Mike Davis',
    email: 'mdavis@precisionparts.com',
    phone: '(248) 555-0303',
    billingAddress: '9012 Manufacturing Dr, Detroit, MI 48201',
    shippingAddress: '9012 Manufacturing Dr, Detroit, MI 48201',
    notes: 'Requires certs on all orders',
    createdAt: new Date().toISOString()
  };

  const contact4 = {
    id: uuidv4(),
    companyName: 'Allied Plastics Solutions',
    contactName: 'Jennifer Wilson',
    email: 'jwilson@alliedplastics.com',
    phone: '(614) 555-0404',
    billingAddress: '3456 Polymer Park, Columbus, OH 43201',
    shippingAddress: '3456 Polymer Park, Columbus, OH 43201',
    notes: 'Plastics division customer',
    createdAt: new Date().toISOString()
  };

  contacts.push(contact1, contact2, contact3, contact4);

  // ============================================================================
  // SEED RFQs
  // ============================================================================
  const rfq1 = {
    id: uuidv4(),
    contactId: contact1.id,
    channel: 'EMAIL',
    sourceRef: 'email-msg-001',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'NEW',
    requestedByName: contact1.contactName,
    requestedByEmail: contact1.email,
    requestedDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    lines: [
      {
        id: uuidv4(),
        materialCode: 'PLT-A36-0250',
        commodity: 'METALS',
        form: 'PLATE',
        grade: 'A36',
        thickness: 0.25,
        width: 48,
        length: 96,
        quantity: 10,
        notes: 'Need mill certs'
      },
      {
        id: uuidv4(),
        materialCode: 'PLT-A36-0500',
        commodity: 'METALS',
        form: 'PLATE',
        grade: 'A36',
        thickness: 0.5,
        width: 48,
        length: 96,
        quantity: 5,
        notes: null
      }
    ]
  };

  const rfq2 = {
    id: uuidv4(),
    contactId: contact2.id,
    channel: 'PHONE',
    sourceRef: null,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'IN_REVIEW',
    requestedByName: contact2.contactName,
    requestedByEmail: contact2.email,
    requestedDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    lines: [
      {
        id: uuidv4(),
        materialCode: 'SHT-304-16GA',
        commodity: 'METALS',
        form: 'SHEET',
        grade: '304',
        thickness: 0.06,
        width: 48,
        length: 120,
        quantity: 20,
        notes: '#4 finish'
      }
    ]
  };

  const rfq3 = {
    id: uuidv4(),
    contactId: contact4.id,
    channel: 'WEB',
    sourceRef: 'web-cart-12345',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    status: 'NEW',
    requestedByName: contact4.contactName,
    requestedByEmail: contact4.email,
    requestedDueDate: null,
    lines: [
      {
        id: uuidv4(),
        materialCode: 'SHT-HDPE-0500',
        commodity: 'PLASTICS',
        form: 'SHEET',
        grade: 'HDPE',
        thickness: 0.5,
        width: 48,
        length: 96,
        quantity: 8,
        notes: 'Natural color'
      },
      {
        id: uuidv4(),
        materialCode: 'SHT-UHMW-0750',
        commodity: 'PLASTICS',
        form: 'SHEET',
        grade: 'UHMW',
        thickness: 0.75,
        width: 24,
        length: 48,
        quantity: 4,
        notes: null
      }
    ]
  };

  rfqs.push(rfq1, rfq2, rfq3);

  // ============================================================================
  // SEED QUOTES
  // ============================================================================
  const quote1 = {
    id: uuidv4(),
    rfqId: null,
    contactId: contact3.id,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'SENT',
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    currency: 'USD',
    lines: [
      {
        id: uuidv4(),
        rfqLineId: null,
        materialCode: 'PLT-4140-1000',
        description: '4140 Plate 1" x 12" x 24"',
        quantity: 6,
        unitPrice: 485.00,
        extendedPrice: 2910.00,
        notes: null
      }
    ],
    totalPrice: 2910.00
  };

  quotes.push(quote1);

  // ============================================================================
  // SEED ORDERS
  // ============================================================================
  const order1 = {
    id: uuidv4(),
    contactId: contact2.id,
    quoteId: null,
    channel: 'PHONE',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'IN_PRODUCTION',
    locationId: 'LOC-CHI',
    division: 'METALS',
    requestedShipDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    promiseDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    lines: [
      {
        id: uuidv4(),
        rfqLineId: null,
        quoteLineId: null,
        materialCode: 'PLT-A572-0375',
        commodity: 'METALS',
        form: 'PLATE',
        grade: 'A572-50',
        thickness: 0.375,
        width: 60,
        length: 120,
        quantity: 15,
        division: 'METALS',
        status: 'RELEASED_TO_PRODUCTION',
        jobId: null
      }
    ]
  };

  const order2 = {
    id: uuidv4(),
    contactId: contact1.id,
    quoteId: null,
    channel: 'WEB',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'NEW',
    locationId: 'LOC-DET',
    division: 'METALS',
    requestedShipDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    promiseDate: null,
    lines: [
      {
        id: uuidv4(),
        rfqLineId: null,
        quoteLineId: null,
        materialCode: 'BAR-1018-2RD',
        commodity: 'METALS',
        form: 'BAR',
        grade: '1018',
        thickness: 2,
        width: null,
        length: 144,
        quantity: 25,
        division: 'METALS',
        status: 'NEW',
        jobId: null
      },
      {
        id: uuidv4(),
        rfqLineId: null,
        quoteLineId: null,
        materialCode: 'BAR-1018-3RD',
        commodity: 'METALS',
        form: 'BAR',
        grade: '1018',
        thickness: 3,
        width: null,
        length: 144,
        quantity: 10,
        division: 'METALS',
        status: 'NEW',
        jobId: null
      }
    ]
  };

  orders.push(order1, order2);

  // ============================================================================
  // SEED JOBS
  // ============================================================================
  const job1 = {
    id: uuidv4(),
    orderId: order1.id,
    orderLineId: order1.lines[0].id,
    locationId: 'LOC-CHI',
    division: 'METALS',
    materialCode: 'PLT-A572-0375',
    thickness: 0.375,
    width: 60,
    length: 120,
    quantity: 15,
    status: 'IN_PROCESS',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  };

  // Link job to order line
  order1.lines[0].jobId = job1.id;

  jobs.push(job1);

  console.log('✅ OrderHub seed data initialized:', {
    contacts: contacts.length,
    rfqs: rfqs.length,
    quotes: quotes.length,
    orders: orders.length,
    jobs: jobs.length
  });
}

export default initOrderHubData;
