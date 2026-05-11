/**
 * Queue Flow Simulation Script
 * This script tests the end-to-end flow of the Universal Queue Management SaaS APIs.
 * 
 * Usage:
 * 1. Ensure your Next.js server is running (npm run dev)
 * 2. Run this script: npx ts-node scripts/testQueueFlow.ts
 */

const BASE_URL = 'http://localhost:3000/api';

async function runTest() {
  console.log('🚀 Starting Queue Flow Simulation...\n');

  try {
    // 1. Create Organization
    console.log('--- Step 1: Creating Organization ---');
    const orgRes = await fetch(`${BASE_URL}/organization/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Grand Central Bank',
        type: 'bank',
        location: 'Downtown City Center',
        ownerId: 'user_12345',
      }),
    });
    const orgData = await orgRes.json();
    if (!orgData.success) throw new Error(orgData.error);
    const orgId = orgData.organization._id;
    console.log(`✅ Organization Created: ${orgData.organization.name} (ID: ${orgId})\n`);

    // 2. Create Service
    console.log('--- Step 2: Creating Service ---');
    const serviceRes = await fetch(`${BASE_URL}/service/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        name: 'Account Opening Counter',
        description: 'Counter for new bank account registrations',
        estimatedTime: 15,
      }),
    });
    const serviceData = await serviceRes.json();
    if (!serviceData.success) throw new Error(serviceData.error);
    const serviceId = serviceData.service._id;
    console.log(`✅ Service Created: ${serviceData.service.name} (ID: ${serviceId})\n`);

    // 3. Add Multiple Users to Queue
    console.log('--- Step 3: Users Joining Queue ---');
    const customers = [
      { name: 'Alice Smith', phone: '555-0101' },
      { name: 'Bob Johnson', phone: '555-0102' },
      { name: 'Charlie Brown', phone: '555-0103' },
      { name: 'Diana Prince', phone: '555-0104' },
    ];

    for (const customer of customers) {
      const joinRes = await fetch(`${BASE_URL}/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          serviceId,
          name: customer.name,
          phone: customer.phone,
        }),
      });
      const joinData = await joinRes.json();
      console.log(`👤 ${customer.name} joined queue. Position: ${joinData.position}`);
    }
    console.log('');

    // 4. Fetch Queue State
    console.log('--- Step 4: Fetching Current Queue State ---');
    const getRes = await fetch(`${BASE_URL}/queue/get?serviceId=${serviceId}`);
    const getData = await getRes.json();
    console.log(`📋 Total customers in queue: ${getData.queue.customers.length}\n`);

    // 5. Call Next Customer (Simulate 2 calls)
    for (let i = 1; i <= 2; i++) {
      console.log(`--- Step 5.${i}: Calling Next Customer ---`);
      const nextRes = await fetch(`${BASE_URL}/queue/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });
      const nextData = await nextRes.json();
      if (nextData.customer) {
        console.log(`📢 Now Calling: ${nextData.customer.name} (Position: ${nextData.customer.position})`);
      } else {
        console.log('⚠️ ' + nextData.message);
      }

      // Briefly observe the "called" status
      const stateRes = await fetch(`${BASE_URL}/queue/get?serviceId=${serviceId}`);
      const stateData = await stateRes.json();
      const called = stateData.queue.customers.filter((c: any) => c.status === 'called');
      const waiting = stateData.queue.customers.filter((c: any) => c.status === 'waiting');
      console.log(`📊 Stats: ${called.length} Called, ${waiting.length} Waiting\n`);

      // Complete the customer
      if (nextData.customer) {
        console.log(`--- Step 5.${i}b: Completing Customer ---`);
        const completeRes = await fetch(`${BASE_URL}/queue/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId }),
        });
        const completeData = await completeRes.json();
        console.log(`✅ Customer ${completeData.customer.name} completed.\n`);
      }
    }

    console.log('✨ Simulation completed successfully!');

  } catch (error: any) {
    console.error('❌ Simulation failed:', error.message);
  }
}

runTest();
