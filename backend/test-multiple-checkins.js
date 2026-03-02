// Test script for attendance check-in after auto-checkout scenario using Node.js and fetch API
const fetch = require('node-fetch'); 

const BASE_URL = 'http://localhost:8080/api/v1';

async function testMultipleCheckIns() {
  console.log('🧪 Testing Multiple Check-ins After Auto-checkout');
  
  try {
    // Step 1: Login
    console.log('\n1. 🔐 Logging in as receptionist2...');
    const loginResponse = await fetch(`${BASE_URL}/staff/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'tcchavan999@gmail.com',
        password: 'recep2123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    const authCookie = cookies ? cookies.split(';')[0] : '';
    console.log('✅ Login successful');

    // Step 2: First Check-in
    console.log('\n2. ⏰ First check-in...');
    let checkinResponse = await fetch(`${BASE_URL}/attendance/checkin`, {
      method: 'POST',
      headers: {
        'Cookie': authCookie
      }
    });

    if (checkinResponse.ok) {
      const checkinData = await checkinResponse.json();
      console.log('✅ First check-in successful:', checkinData.message);
    } else {
      const checkinError = await checkinResponse.json();
      console.log('📝 First check-in response:', checkinError.message);
    }

    // Step 3: Check-out
    console.log('\n3. 🏠 Check-out...');
    const checkoutResponse = await fetch(`${BASE_URL}/attendance/checkout`, {
      method: 'POST',
      headers: {
        'Cookie': authCookie
      }
    });

    if (checkoutResponse.ok) {
      const checkoutData = await checkoutResponse.json();
      console.log('✅ Check-out successful:', checkoutData.message);
    } else {
      const checkoutError = await checkoutResponse.json();
      console.log('❌ Check-out failed:', checkoutError.message);
    }

    // Step 4: Second Check-in (This should work now)
    console.log('\n4. ⏰ Second check-in (after checkout)...');
    checkinResponse = await fetch(`${BASE_URL}/attendance/checkin`, {
      method: 'POST',
      headers: {
        'Cookie': authCookie
      }
    });

    if (checkinResponse.ok) {
      const checkinData = await checkinResponse.json();
      console.log('✅ Second check-in successful:', checkinData.message);
    } else {
      const checkinError = await checkinResponse.json();
      console.log('❌ Second check-in failed:', checkinError.message);
    }

    // Step 5: Get current status
    console.log('\n5. 📊 Checking final status...');
    const statusResponse = await fetch(`${BASE_URL}/attendance/status`, {
      headers: {
        'Cookie': authCookie
      }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📋 Final status:', {
        isCheckedIn: statusData.data.isCheckedIn,
        checkInTime: statusData.data.checkInTime,
        checkOutTime: statusData.data.checkOutTime,
        status: statusData.data.status
      });
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testMultipleCheckIns();