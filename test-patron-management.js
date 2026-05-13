// Using native fetch API available in Node.js 18+

const BASE_URL = 'http://localhost:3000';

async function testPatronManagement() {
  console.log('🧪 Testing Patron Management System...\n');

  try {
    // Test 1: Get all patrons (READ operation)
    console.log('📋 Test 1: Fetching all patrons...');
    const getResponse = await fetch(`${BASE_URL}/api/librarian/patrons?page=1&limit=10`);
    const getData = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ GET patrons - SUCCESS');
      console.log(`   Found ${getData.patrons.length} patrons`);
      console.log(`   Total patrons: ${getData.stats.totalPatrons}`);
      console.log(`   Students: ${getData.stats.studentPatrons}, Faculty: ${getData.stats.facultyPatrons}, General: ${getData.stats.generalPatrons}`);
    } else {
      console.log('❌ GET patrons - FAILED');
      console.log('   Error:', getData.error);
      return;
    }

    let testPatronId = null;
    if (getData.patrons.length > 0) {
      testPatronId = getData.patrons[0].patronId;
      console.log(`   Using patron ID ${testPatronId} for individual tests`);
    }

    // Test 2: Get individual patron (VIEW operation)
    if (testPatronId) {
      console.log('\n👤 Test 2: Fetching individual patron details...');
      const viewResponse = await fetch(`${BASE_URL}/api/librarian/patrons/${testPatronId}`);
      const viewData = await viewResponse.json();
      
      if (viewResponse.ok) {
        console.log('✅ VIEW patron - SUCCESS');
        console.log(`   Patron: ${viewData.patron.patronFirstName} ${viewData.patron.patronLastName}`);
        console.log(`   Email: ${viewData.patron.patronEmail}`);
        console.log(`   Type: ${viewData.patron.userType}`);
        console.log(`   Status: ${viewData.patron.status}`);
        console.log(`   Active Loans: ${viewData.patron.currentLoans}`);
        console.log(`   Reservations: ${viewData.patron.reservations}`);
      } else {
        console.log('❌ VIEW patron - FAILED');
        console.log('   Error:', viewData.error);
      }
    }

    // Test 3: Create new patron (CREATE operation)
    console.log('\n➕ Test 3: Creating new test patron...');
    const testPatronData = {
      patronFirstName: 'Test',
      patronLastName: 'User',
      patronEmail: `testuser${Date.now()}@library.edu`,
      patronPassword: 'TestPass123',
      userType: 'student',
      studentDetails: {
        department: 'Computer Science',
        semester: 3,
        rollNo: 12345,
        enrollmentNumber: 987654
      }
    };

    const createResponse = await fetch(`${BASE_URL}/api/librarian/patrons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPatronData),
    });
    const createData = await createResponse.json();

    let newPatronId = null;
    if (createResponse.ok) {
      console.log('✅ CREATE patron - SUCCESS');
      newPatronId = createData.patron.patronId;
      console.log(`   Created patron with ID: ${newPatronId}`);
      console.log(`   Name: ${createData.patron.patronFirstName} ${createData.patron.patronLastName}`);
    } else {
      console.log('❌ CREATE patron - FAILED');
      console.log('   Error:', createData.error);
    }

    // Test 4: Update patron (EDIT operation)
    if (newPatronId) {
      console.log('\n✏️ Test 4: Updating test patron...');
      const updateData = {
        patronFirstName: 'Updated',
        patronLastName: 'TestUser',
        patronEmail: testPatronData.patronEmail,
        patronPassword: '',
        userType: 'faculty',
        facultyDetails: {
          department: 'Information Technology'
        }
      };

      const updateResponse = await fetch(`${BASE_URL}/api/librarian/patrons/${newPatronId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const updateResult = await updateResponse.json();

      if (updateResponse.ok) {
        console.log('✅ UPDATE patron - SUCCESS');
        console.log(`   Updated patron: ${updateResult.patron.patronFirstName} ${updateResult.patron.patronLastName}`);
        console.log(`   New type: ${updateResult.patron.userType}`);
      } else {
        console.log('❌ UPDATE patron - FAILED');
        console.log('   Error:', updateResult.error);
      }
    }

    // Test 5: Delete patron (DELETE operation)
    if (newPatronId) {
      console.log('\n🗑️ Test 5: Deleting test patron...');
      const deleteResponse = await fetch(`${BASE_URL}/api/librarian/patrons/${newPatronId}`, {
        method: 'DELETE',
      });
      const deleteData = await deleteResponse.json();

      if (deleteResponse.ok) {
        console.log('✅ DELETE patron - SUCCESS');
        console.log('   Test patron deleted successfully');
      } else {
        console.log('❌ DELETE patron - FAILED');
        console.log('   Error:', deleteData.error);
      }
    }

    // Test 6: Search functionality
    console.log('\n🔍 Test 6: Testing search functionality...');
    const searchResponse = await fetch(`${BASE_URL}/api/librarian/patrons?page=1&limit=5&search=test`);
    const searchData = await searchResponse.json();

    if (searchResponse.ok) {
      console.log('✅ SEARCH patrons - SUCCESS');
      console.log(`   Found ${searchData.patrons.length} patrons matching 'test'`);
    } else {
      console.log('❌ SEARCH patrons - FAILED');
      console.log('   Error:', searchData.error);
    }

    // Test 7: Filter functionality
    console.log('\n🔽 Test 7: Testing filter functionality...');
    const filterResponse = await fetch(`${BASE_URL}/api/librarian/patrons?page=1&limit=5&userType=student`);
    const filterData = await filterResponse.json();

    if (filterResponse.ok) {
      console.log('✅ FILTER patrons - SUCCESS');
      console.log(`   Found ${filterData.patrons.length} student patrons`);
    } else {
      console.log('❌ FILTER patrons - FAILED');
      console.log('   Error:', filterData.error);
    }

    console.log('\n🎉 Patron Management System Test Complete!');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Make sure the development server is running on localhost:3000');
  }
}

// Additional test for edge cases
async function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases...\n');

  try {
    // Test invalid patron ID
    console.log('📋 Testing invalid patron ID...');
    const invalidResponse = await fetch(`${BASE_URL}/api/librarian/patrons/99999`);
    const invalidData = await invalidResponse.json();
    
    if (invalidResponse.status === 404) {
      console.log('✅ Invalid patron ID handling - SUCCESS');
      console.log('   Correctly returned 404 for non-existent patron');
    } else {
      console.log('❌ Invalid patron ID handling - FAILED');
      console.log(`   Expected 404, got ${invalidResponse.status}`);
    }

    // Test duplicate email
    console.log('\n📧 Testing duplicate email handling...');
    const duplicateEmail = `duplicate${Date.now()}@library.edu`;
    
    // Create first patron
    const firstPatron = await fetch(`${BASE_URL}/api/librarian/patrons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patronFirstName: 'First',
        patronLastName: 'User',
        patronEmail: duplicateEmail,
        patronPassword: 'TestPass123',
        userType: 'general'
      }),
    });

    if (firstPatron.ok) {
      const firstData = await firstPatron.json();
      
      // Try to create second patron with same email
      const duplicateResponse = await fetch(`${BASE_URL}/api/librarian/patrons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patronFirstName: 'Second',
          patronLastName: 'User',
          patronEmail: duplicateEmail,
          patronPassword: 'TestPass123',
          userType: 'general'
        }),
      });

      if (duplicateResponse.status === 400) {
        console.log('✅ Duplicate email handling - SUCCESS');
        console.log('   Correctly prevented duplicate email registration');
      } else {
        console.log('❌ Duplicate email handling - FAILED');
        console.log(`   Expected 400, got ${duplicateResponse.status}`);
      }

      // Clean up - delete the test patron
      await fetch(`${BASE_URL}/api/librarian/patrons/${firstData.patron.patronId}`, {
        method: 'DELETE'
      });
    }

  } catch (error) {
    console.error('💥 Edge case test failed:', error.message);
  }
}

async function runAllTests() {
  await testPatronManagement();
  await testEdgeCases();
}

// Run the tests
runAllTests();
