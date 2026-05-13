const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test patron data
const testPatron = {
  patronFirstName: 'John',
  patronLastName: 'Doe',
  patronEmail: 'john.doe.test@example.com',
  patronPassword: 'testpassword123',
  userType: 'student',
  studentDetails: {
    department: 'Computer Science',
    semester: 5,
    rollNo: 12345,
    enrollmentNumber: 2021001
  }
};

async function testCRUDOperations() {
  let testPatronId = null;
  
  try {
    console.log('🧪 Starting CRUD Operations Test...\n');

    // 1. CREATE - Test creating a new patron
    console.log('1. Testing CREATE operation...');
    const createResponse = await fetch(`${BASE_URL}/api/librarian/patrons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPatron),
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      testPatronId = createResult.patron.patronId;
      console.log('✅ CREATE successful - Patron ID:', testPatronId);
    } else {
      const error = await createResponse.json();
      console.log('❌ CREATE failed:', error.error);
    }

    if (testPatronId) {
      // 2. READ - Test getting the patron
      console.log('\n2. Testing READ operation...');
      const readResponse = await fetch(`${BASE_URL}/api/librarian/patrons/${testPatronId}`);
      
      if (readResponse.ok) {
        const readResult = await readResponse.json();
        console.log('✅ READ successful - Patron:', readResult.patron.patronFirstName, readResult.patron.patronLastName);
      } else {
        console.log('❌ READ failed');
      }

      // 3. UPDATE - Test updating the patron
      console.log('\n3. Testing UPDATE operation...');
      const updateData = {
        ...testPatron,
        patronFirstName: 'Jane',
        studentDetails: {
          ...testPatron.studentDetails,
          semester: 6
        }
      };

      const updateResponse = await fetch(`${BASE_URL}/api/librarian/patrons/${testPatronId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ UPDATE successful - Updated patron:', updateResult.patron.patronFirstName);
      } else {
        const error = await updateResponse.json();
        console.log('❌ UPDATE failed:', error.error);
      }

      // 4. DELETE - Test deleting the patron
      console.log('\n4. Testing DELETE operation...');
      const deleteResponse = await fetch(`${BASE_URL}/api/librarian/patrons/${testPatronId}`, {
        method: 'DELETE',
      });

      if (deleteResponse.ok) {
        const deleteResult = await deleteResponse.json();
        console.log('✅ DELETE successful:', deleteResult.message);
      } else {
        const error = await deleteResponse.json();
        console.log('❌ DELETE failed:', error.error);
      }
    }

    // 5. LIST - Test getting list of patrons
    console.log('\n5. Testing LIST operation...');
    const listResponse = await fetch(`${BASE_URL}/api/librarian/patrons?page=1&limit=5`);
    
    if (listResponse.ok) {
      const listResult = await listResponse.json();
      console.log('✅ LIST successful - Found', listResult.patrons.length, 'patrons');
      console.log('📊 Stats:', {
        total: listResult.stats.totalPatrons,
        students: listResult.stats.studentPatrons,
        faculty: listResult.stats.facultyPatrons,
        general: listResult.stats.generalPatrons
      });
    } else {
      console.log('❌ LIST failed');
    }

    console.log('\n🎉 CRUD Operations Test Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testCRUDOperations();
