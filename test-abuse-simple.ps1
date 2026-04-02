#!/usr/bin/env pwsh

# Test Rate Limiting & Abuse Prevention
# Scenarios: (1) IP limit, (2) Dedup window, (3) Email limit

$BASE_URL = "http://localhost:3000"
$VALID_PRODUCT_ID = "agua-mineral"
$VALID_PHONE = "1123456789"
$VALID_NAME = "Juan Perez"

function Create-Order {
    param([string]$Email)
    
    $itemsJson = '[{"productId":"' + $VALID_PRODUCT_ID + '","quantity":1}]'
    
    $body = @{
        customerEmail = $Email
        customerPhone = $VALID_PHONE
        customerName = $VALID_NAME
        items = $itemsJson
        total = 3000
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/api/orders" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Continue
        return $response
    } catch {
        return $null
    }
}

Write-Host ""
Write-Host "TEST RATE LIMITING & ABUSE PREVENTION" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# SCENARIO 1: Rate Limit por IP
Write-Host "SCENARIO 1: Rate Limit by IP (Max 5 per hour)" -ForegroundColor Yellow
Write-Host "Creating 6 orders from same IP..." -ForegroundColor Gray

$ipTestEmail = "ratelimit-ip-test-$(Get-Date -Format 'HHmmss')@test.com"
$successCount = 0

for ($i = 1; $i -le 6; $i++) {
    $response = Create-Order -Email "$ipTestEmail-$i"
    
    if ($response) {
        $status = $response.StatusCode
        if ($status -eq 201) {
            $successCount++
            Write-Host "  Attempt $i : Status $status [CREATED]" -ForegroundColor Green
        } else {
            $body = $response.Content | ConvertFrom-Json
            Write-Host "  Attempt $i : Status $status [REJECTED] - $($body.error)" -ForegroundColor Red
        }
    } else {
        Write-Host "  Attempt $i : FAILED" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Result: $successCount/6 passed (expected: 5 passed, 1 rejected)" -ForegroundColor $(if ($successCount -eq 5) { "Green" } else { "Yellow" })
Write-Host ""

# SCENARIO 2: Deduplication (5 min window)
Write-Host "SCENARIO 2: Dedup Window (5 minute)" -ForegroundColor Yellow
Write-Host "Creating 2 identical orders < 1 second apart..." -ForegroundColor Gray

$dedupEmail = "dedup-test-$(Get-Date -Format 'HHmmss')@test.com"

$response1 = Create-Order -Email $dedupEmail
$status1 = if ($response1) { $response1.StatusCode } else { 0 }
Write-Host "  Attempt 1 : Status $status1 - $(if ($status1 -eq 201) { 'CREATED' } else { 'REJECTED' })" -ForegroundColor $(if ($status1 -eq 201) { "Green" } else { "Red" })

$response2 = Create-Order -Email $dedupEmail
$status2 = if ($response2) { $response2.StatusCode } else { 0 }
Write-Host "  Attempt 2 : Status $status2 - $(if ($status2 -eq 409) { 'CONFLICT (deduped)' } elseif ($status2 -eq 201) { 'CREATED (dedup failed)' } else { 'REJECTED' })" -ForegroundColor $(if ($status2 -eq 409) { "Green" } else { "Yellow" })

Write-Host ""
$dedupPassed = ($status1 -eq 201) -and ($status2 -eq 409)
Write-Host "Result: $(if ($dedupPassed) { 'PASS' } else { 'FAIL' })" -ForegroundColor $(if ($dedupPassed) { "Green" } else { "Yellow" })
Write-Host ""

# SCENARIO 3: Rate Limit por Email
Write-Host "SCENARIO 3: Rate Limit by Email (Max 2 per hour)" -ForegroundColor Yellow
Write-Host "Creating 3 orders with same email..." -ForegroundColor Gray

$emailTestEmail = "email-limit-test-$(Get-Date -Format 'HHmmss')@test.com"
$emailCreatedCount = 0

for ($i = 1; $i -le 3; $i++) {
    $response = Create-Order -Email $emailTestEmail
    
    if ($response) {
        $status = $response.StatusCode
        if ($status -eq 201) {
            $emailCreatedCount++
            Write-Host "  Attempt $i : Status $status [CREATED]" -ForegroundColor Green
        } elseif ($status -eq 429) {
            Write-Host "  Attempt $i : Status $status [RATE LIMITED]" -ForegroundColor Red
        } else {
            Write-Host "  Attempt $i : Status $status [OTHER]" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  Attempt $i : FAILED" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 1000
}

Write-Host ""
Write-Host "Result: $emailCreatedCount created (expected: 2 created, 1 rejected)" -ForegroundColor $(if ($emailCreatedCount -eq 2) { "Green" } else { "Yellow" })
Write-Host ""

# SUMMARY
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$passed = 0
if ($successCount -eq 5) {
    Write-Host "PASS: IP Rate Limit" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: IP Rate Limit" -ForegroundColor Red
}

if ($dedupPassed) {
    Write-Host "PASS: Dedup Window" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: Dedup Window" -ForegroundColor Red
}

if ($emailCreatedCount -eq 2) {
    Write-Host "PASS: Email Rate Limit" -ForegroundColor Green
    $passed++
} else {
    Write-Host "FAIL: Email Rate Limit" -ForegroundColor Red
}

Write-Host ""
Write-Host "Result: $passed/3 Scenarios Passed" -ForegroundColor $(if ($passed -eq 3) { "Green" } else { "Yellow" })
