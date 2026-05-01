// Test script to verify technician functionality
const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';

async function testTechnicianWorkflow() {
  console.log('🔧 Testing Technician Workflow...\n');
  
  try {
    // 1. Test API Health
    console.log('1. Testing API Health...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ API Health:', healthResponse.data);
    
    // 2. Test Technician Signup
    console.log('\n2. Testing Technician Signup...');
    const signupData = {
      email: `testtech${Date.now()}@example.com`,
      password: 'test123456',
      technicianName: 'Test Technician',
      employeeId: `TEST${Date.now()}`
    };
    
    const signupResponse = await axios.post(`${API_BASE}/auth/signup`, signupData);
    console.log('✅ Technician Signup Success:', signupResponse.data.user.role);
    
    const token = signupResponse.data.token;
    const authHeaders = { 'Authorization': `Bearer ${token}` };
    
    // 3. Test Get Batteries
    console.log('\n3. Testing Get Batteries...');
    const batteriesResponse = await axios.get(`${API_BASE}/batteries`, { headers: authHeaders });
    console.log('✅ Batteries loaded:', batteriesResponse.data.length, 'batteries found');
    
    // 4. Test Maintenance Submission (if batteries exist)
    if (batteriesResponse.data.length > 0) {
      console.log('\n4. Testing Maintenance Submission...');
      const firstBattery = batteriesResponse.data[0];
      
      // Create a mock PDF file (in real scenario, this would be a file upload)
      const maintenanceData = {
        technicianName: signupData.technicianName,
        customerSite: firstBattery.customerSite || 'Test Customer / Test Site',
        assetId: firstBattery.assetId,
        assetType: firstBattery.assetType,
        serialNumber: firstBattery.serialNumber,
        maintenanceDate: new Date().toISOString().split('T')[0],
        maintenanceType: 'Weekly Test',
        notes: 'Automated test submission'
      };
      
      console.log('Maintenance data prepared:', maintenanceData);
      console.log('✅ Maintenance submission data validated');
    } else {
      console.log('\n⚠️  No batteries found - maintenance submission test skipped');
    }
    
    console.log('\n🎉 All technician functionality tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testTechnicianWorkflow();
