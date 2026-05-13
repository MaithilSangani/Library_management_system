$baseUrl = "http://localhost:3000"

# Test patron data
$testPatron = @{
    patronFirstName = "John"
    patronLastName = "Doe"
    patronEmail = "john.doe.test@example.com"
    patronPassword = "testpassword123"
    userType = "student"
    studentDetails = @{
        department = "Computer Science"
        semester = 5
        rollNo = 12345
        enrollmentNumber = 2021001
    }
} | ConvertTo-Json -Depth 3

Write-Host "🧪 Starting CRUD Operations Test..." -ForegroundColor Green
Write-Host ""

$testPatronId = $null

try {
    # 1. CREATE - Test creating a new patron
    Write-Host "1. Testing CREATE operation..." -ForegroundColor Yellow
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/librarian/patrons" -Method POST -ContentType "application/json" -Body $testPatron
    
    if ($createResponse.patron) {
        $testPatronId = $createResponse.patron.patronId
        Write-Host "✅ CREATE successful - Patron ID: $testPatronId" -ForegroundColor Green
    }

    if ($testPatronId) {
        # 2. READ - Test getting the patron
        Write-Host ""
        Write-Host "2. Testing READ operation..." -ForegroundColor Yellow
        $readResponse = Invoke-RestMethod -Uri "$baseUrl/api/librarian/patrons/$testPatronId" -Method GET
        
        if ($readResponse.patron) {
            Write-Host "✅ READ successful - Patron: $($readResponse.patron.patronFirstName) $($readResponse.patron.patronLastName)" -ForegroundColor Green
        }

        # 3. UPDATE - Test updating the patron
        Write-Host ""
        Write-Host "3. Testing UPDATE operation..." -ForegroundColor Yellow
        $updateData = @{
            patronFirstName = "Jane"
            patronLastName = "Doe"
            patronEmail = "john.doe.test@example.com"
            patronPassword = ""
            userType = "student"
            studentDetails = @{
                department = "Computer Science"
                semester = 6
                rollNo = 12345
                enrollmentNumber = 2021001
            }
        } | ConvertTo-Json -Depth 3

        $updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/librarian/patrons/$testPatronId" -Method PUT -ContentType "application/json" -Body $updateData
        
        if ($updateResponse.patron) {
            Write-Host "✅ UPDATE successful - Updated patron: $($updateResponse.patron.patronFirstName)" -ForegroundColor Green
        }

        # 4. DELETE - Test deleting the patron
        Write-Host ""
        Write-Host "4. Testing DELETE operation..." -ForegroundColor Yellow
        $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/librarian/patrons/$testPatronId" -Method DELETE
        
        if ($deleteResponse.message) {
            Write-Host "✅ DELETE successful: $($deleteResponse.message)" -ForegroundColor Green
        }
    }

    # 5. LIST - Test getting list of patrons
    Write-Host ""
    Write-Host "5. Testing LIST operation..." -ForegroundColor Yellow
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/api/librarian/patrons?page=1&limit=5" -Method GET
    
    if ($listResponse.patrons) {
        Write-Host "✅ LIST successful - Found $($listResponse.patrons.Count) patrons" -ForegroundColor Green
        Write-Host "📊 Stats: Total: $($listResponse.stats.totalPatrons), Students: $($listResponse.stats.studentPatrons), Faculty: $($listResponse.stats.facultyPatrons), General: $($listResponse.stats.generalPatrons)" -ForegroundColor Cyan
    }

    Write-Host ""
    Write-Host "🎉 CRUD Operations Test Complete!" -ForegroundColor Green

} catch {
    Write-Host "❌ Test failed with error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error details: $errorBody" -ForegroundColor Red
    }
}
