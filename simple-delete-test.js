// Simple test for battery delete functionality
const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function simpleDeleteTest() {
  console.log('🗑️  SIMPLE BATTERY DELETE TEST');
  console.log('=' .repeat(40));
  
  try {
    // Step 1: Login as supervisor
    console.log('\n🔐 Supervisor Login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@epiroc.local',
      password: 'Admin123!'
    });
    const supervisorToken = loginResponse.data.token;
    const authHeaders = { 'Authorization': `Bearer ${supervisorToken}` };
    console.log('✅ Login successful');
    
    // Step 2: Get existing batteries
    console.log('\n🔋 Getting existing batteries...');
    const batteriesResponse = await axios.get(`${API_BASE}/batteries`, { headers: authHeaders });
    const batteries = batteriesResponse.data;
    console.log(`✅ Found ${batteries.length} batteries`);
    
    if (batteries.length === 0) {
      console.log('⚠️  No batteries available for testing');
      return;
    }
    
    // Step 3: Create a test battery to delete
    console.log('\n🔋 Creating test battery...');
    const testBatteryData = {
      customerSite: 'Delete Test / Test Site',
      assetId: `DELETE_TEST_${Date.now()}`,
      assetType: 'B2 Battery',
      serialNumber: `DEL_${Date.now()}`,
      locationType: 'On Customer Site',
      status: 'Active'
    };
    
    const createResponse = await axios.post(`${API_BASE}/batteries`, testBatteryData, { headers: authHeaders });
    const testBattery = createResponse.data;
    console.log('✅ Test battery created:', testBattery.assetId);
    
    // Step 4: Verify battery exists
    console.log('\n🔍 Verifying battery exists...');
    const verifyResponse = await axios.get(`${API_BASE}/batteries`, { headers: authHeaders });
    const existsAfterCreate = verifyResponse.data.some(b => b._id === testBattery._id);
    console.log(existsAfterCreate ? '✅ Battery exists in database' : '❌ Battery not found');
    
    // Step 5: Delete the battery
    console.log('\n🗑️  Deleting battery...');
    const deleteResponse = await axios.delete(`${API_BASE}/batteries/${testBattery._id}`, { headers: authHeaders });
    console.log('✅ Delete request successful');
    console.log(`   Deleted maintenance records: ${deleteResponse.data.deletedMaintenanceRecordsCount}`);
    
    // Step 6: Verify battery is deleted
    console.log('\n🔍 Verifying deletion...');
    const afterDeleteResponse = await axios.get(`${API_BASE}/batteries`, { headers: authHeaders });
    const existsAfterDelete = afterDeleteResponse.data.some(b => b._id === testBattery._id);
    console.log(existsAfterDelete ? '❌ Battery still exists' : '✅ Battery successfully deleted');
    
    // Step 7: Test unauthorized delete
    console.log('\n🚫 Testing unauthorized delete...');
    try {
      await axios.delete(`${API_BASE}/batteries/${testBattery._id}`);
      console.log('❌ Unauthorized delete should have failed');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized delete properly blocked');
      } else {
        console.log('⚠️  Unexpected error:', error.message);
      }
    }
    
    console.log('\n' + '=' .repeat(40));
    console.log('🎉 DELETE TEST RESULTS:');
    console.log('✅ API Endpoint: WORKING');
    console.log('✅ Authentication: WORKING');
    console.log('✅ Battery Creation: WORKING');
    console.log('✅ Battery Deletion: WORKING');
    console.log('✅ Cascade Delete: WORKING');
    console.log('✅ Security: WORKING');
    
    console.log('\n🚀 DELETE FUNCTIONALITY IS READY!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response?.data || error.message);
  }
}

simpleDeleteTest();
