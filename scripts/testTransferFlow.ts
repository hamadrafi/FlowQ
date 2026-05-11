/**
 * Queue Transfer Simulation Script
 * This script tests the transfer functionality between two service queues.
 * 
 * Usage:
 * 1. Ensure your Next.js server is running (npm run dev)
 * 2. Run this script: npx ts-node scripts/testTransferFlow.ts
 */

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('🚀 Starting Queue Transfer Simulation...\n');

  try {
    // 1. Create Organization
    console.log('--- Step 1: Creating Organization ---');
    const orgRes = await fetch(`${BASE_URL}/organization/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Transfer Test Hospital',
        type: 'healthcare',
        location: 'West Wing',
        ownerId: 'admin_test',
      }),
    });
    const orgData = await orgRes.json();
    if (!orgData.success) throw new Error(orgData.error);
    const orgId = orgData.organization._id;
    console.log(`✅ Organization Created: ${orgData.organization.name}\n`);

    // 2. Create Two Services
    console.log('--- Step 2: Creating Services ---');
    const createService = async (name: string) => {
      const res = await fetch(`${BASE_URL}/service/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, name }),
      });
      const data = await res.json();
      return data.service._id;
    };

    const serviceAId = await createService('General Consultation');
    const serviceBId = await createService('Pharmacy');
    console.log(`✅ Service A (Source): General Consultation (ID: ${serviceAId})`);
    console.log(`✅ Service B (Dest): Pharmacy (ID: ${serviceBId})\n`);

    // 3. Customer Joins Service A
    console.log('--- Step 3: Customer Joins Service A ---');
    const customer = { name: 'John Doe', phone: '555-9999' };
    const joinRes = await fetch(`${BASE_URL}/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        serviceId: serviceAId,
        name: customer.name,
        phone: customer.phone,
      }),
    });
    const joinData = await joinRes.json();
    console.log(`👤 ${customer.name} joined General Consultation. Position: ${joinData.position}\n`);

    // 4. Transfer Customer from A to B
    console.log('--- Step 4: Transferring Customer from A to B ---');
    const transferRes = await fetch(`${BASE_URL}/queue/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromServiceId: serviceAId,
        toServiceId: serviceBId,
        phone: customer.phone
      }),
    });
    const transferData = await transferRes.json();
    if (!transferData.success) throw new Error(transferData.error);
    console.log(`✅ Transfer Successful!`);
    console.log(`📝 Message: ${transferData.message}`);
    console.log(`📍 New Position in Pharmacy: ${transferData.customer.position}\n`);

    // 5. Verify State in Both Queues
    console.log('--- Step 5: Verifying Final States ---');
    
    // Check Source Queue
    const getARes = await fetch(`${BASE_URL}/queue/get?serviceId=${serviceAId}`);
    const getAData = await getARes.json();
    const sourceCustomer = getAData.queue.customers.find((c: any) => c.phone === customer.phone);
    console.log(`📋 Source Queue (General Consultation):`);
    console.log(`   - Customer Status: ${sourceCustomer?.status} (Expected: transferred)`);

    // Check Destination Queue
    const getBRes = await fetch(`${BASE_URL}/queue/get?serviceId=${serviceBId}`);
    const getBData = await getBRes.json();
    const destCustomer = getBData.queue.customers.find((c: any) => c.phone === customer.phone);
    console.log(`📋 Destination Queue (Pharmacy):`);
    console.log(`   - Customer Status: ${destCustomer?.status} (Expected: waiting)`);
    console.log(`   - Transferred From: ${destCustomer?.transferredFrom}\n`);

    console.log('✨ Transfer simulation completed successfully!');

  } catch (error: any) {
    console.error('❌ Simulation failed:', error.message);
  }
}

runTest();
