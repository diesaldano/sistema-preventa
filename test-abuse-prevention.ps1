#!/usr/bin/env pwsh

# Test Rate Limiting & Abuse Prevention - Preventa System
# Escenarios a validar:
# 1. Script en loop (Rate limit por IP)
# 2. Doble-click accidental (Duplicação en 5 min window)
# 3. Bot distribuido (Rate limit por email)

$BASE_URL = "http://localhost:3000"
$VALID_PRODUCT_ID = "agua-mineral"  # Producto del seed con stock 300
$VALID_EMAIL_BASE = "test"
$VALID_PHONE = "1123456789"
$VALID_NAME = "Juan Pérez"

function Create-Order {
    param(
        [string]$Email,
        [string]$ProductId = $VALID_PRODUCT_ID,
        [int]$Quantity = 1
    )
    
    $body = @{
        customerEmail = $Email
        customerPhone = $VALID_PHONE
        customerName = $VALID_NAME
        items = @(@{
            productId = $ProductId
            quantity = $Quantity
        }) | ConvertTo-Json -AsArray
        total = 10000
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$BASE_URL/api/orders" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Continue
    
    return $response
}

Write-Host "🧪 TESTING RATE LIMITING & ABUSE PREVENTION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ==============================================================
# ESCENARIO 1: Rate Limit por IP
# ==============================================================

Write-Host "📍 ESCENARIO 1: Rate Limit por IP (Max 5/hora)" -ForegroundColor Yellow
Write-Host "Intentando crear 6 órdenes desde la misma IP..." -ForegroundColor Gray

$ipTestEmail = "ratelimit-ip-test-$(Get-Date -Format 'HHmmss')@test.com"
$results = @()

for ($i = 1; $i -le 6; $i++) {
    try {
        $response = Create-Order -Email "$ipTestEmail-$i"
        $status = $response.StatusCode
        $body = $response.Content | ConvertFrom-Json
        
        $results += @{
            attempt = $i
            status = $status
            success = $status -eq 201
            message = if ($status -eq 201) { "✅ Created" } else { "❌ Rejected" }
            error = $body.error
        }
        
        Write-Host "  Attempt $i`: Status $status - $(if ($status -eq 201) { '✅ CREATED' } else { '❌ RATE LIMITED' })" -ForegroundColor $(if ($status -eq 201) { "Green" } else { "Red" })
        
    } catch {
        Write-Host "  Attempt $i`: ❌ ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
$successCount = ($results | Where-Object { $_.success }).Count
Write-Host "IP Rate Limit Result: $successCount/6 passed (expected: 5 passed, 1 rejected)" -ForegroundColor $(if ($successCount -eq 5) { "Green" } else { "Yellow" })
Write-Host ""

# ==============================================================
# ESCENARIO 2: Doble-Click (Deduplicación en 5 min)
# ==============================================================

Write-Host "📍 ESCENARIO 2: Doble-Click Accidental (5 min dedup window)" -ForegroundColor Yellow
Write-Host "Creando 2 órdenes idénticas desde mismo email en < 1 seg..." -ForegroundColor Gray

$dedupEmail = "dedup-test-$(Get-Date -Format 'HHmmss')@test.com"

# Primer intento
try {
    $response1 = Create-Order -Email $dedupEmail
    $status1 = $response1.StatusCode
    Write-Host "  Attempt 1: Status $status1 - $(if ($status1 -eq 201) { '✅ CREATED' } else { '❌ REJECTED' })" -ForegroundColor $(if ($status1 -eq 201) { "Green" } else { "Red" })
} catch {
    Write-Host "  Attempt 1: ❌ ERROR - $($_.Exception.Message)" -ForegroundColor Red
    $status1 = $null
}

# Segundo intento (casi inmediatamente - <1 seg)
try {
    $response2 = Create-Order -Email $dedupEmail
    $status2 = $response2.StatusCode
    $body2 = $response2.Content | ConvertFrom-Json
    Write-Host "  Attempt 2: Status $status2 - $(if ($status2 -eq 409) { '✅ CONFLICT (deduped)' } elseif ($status2 -eq 201) { '❌ CREATED (dedup failed)' } else { '❌ OTHER ERROR' })" -ForegroundColor $(if ($status2 -eq 409) { "Green" } else { "Red" })
    if ($status2 -ne 201) {
        Write-Host "    Error msg: $($body2.error)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Attempt 2: ❌ ERROR - $($_.Exception.Message)" -ForegroundColor Red
    $status2 = $null
}

Write-Host ""
$dedupPassed = ($status1 -eq 201) -and ($status2 -eq 409)
Write-Host "Dedup Result: $(if ($dedupPassed) { '✅ PASSED' } else { '❌ FAILED' })" -ForegroundColor $(if ($dedupPassed) { "Green" } else { "Yellow" })
Write-Host ""

# ==============================================================
# ESCENARIO 3: Rate Limit por Email
# ==============================================================

Write-Host "📍 ESCENARIO 3: Rate Limit por Email (Max 2/hora)" -ForegroundColor Yellow
Write-Host "Creando 3 órdenes desde un mismo email..." -ForegroundColor Gray

$emailTestEmail = "email-limit-test-$(Get-Date -Format 'HHmmss')@test.com"
$emailResults = @()

for ($i = 1; $i -le 3; $i++) {
    try {
        # Usar diferentes productos para evitar dedup check
        $response = Create-Order -Email $emailTestEmail
        $status = $response.StatusCode
        $body = $response.Content | ConvertFrom-Json
        
        $emailResults += @{
            attempt = $i
            status = $status
            success = ($status -eq 201 -or $status -eq 429)
        }
        
        Write-Host "  Attempt $i`: Status $status - $(if ($status -eq 201) { '✅ CREATED' } elseif ($status -eq 429) { '❌ RATE LIMITED' } else { '⚠️ OTHER' })" -ForegroundColor $(if ($status -eq 201) { "Green" } elseif ($status -eq 429) { "Red" } else { "Yellow" })
        
        if ($status -ne 201 -and $status -ne 429) {
            Write-Host "    Response: $($body.error)" -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "  Attempt $i`: ❌ ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 1000
}

Write-Host ""
$emailSuccess = ($emailResults | Where-Object { $_.status -eq 201 }).Count
Write-Host "Email Rate Limit Result: $emailSuccess created (expected: 2 created, 1 rejected)" -ForegroundColor $(if ($emailSuccess -eq 2) { "Green" } else { "Yellow" })
Write-Host ""

# ==============================================================
# RESULTADO GENERAL
# ==============================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$scenarios = @(
    @{ name = "IP Rate Limit"; pass = ($successCount -eq 5) }
    @{ name = "Dedup Window"; pass = $dedupPassed }
    @{ name = "Email Rate Limit"; pass = ($emailSuccess -eq 2) }
)

$passed = 0
$scenarios | ForEach-Object {
    $status = if ($_.pass) { "✅ PASS" } else { "❌ FAIL" }
    Write-Host "$status : $($_.name)" -ForegroundColor $(if ($_.pass) { "Green" } else { "Red" })
    if ($_.pass) { $passed++ }
}

Write-Host ""
Write-Host "Overall: $passed/3 Scenarios Passed" -ForegroundColor $(if ($passed -eq 3) { "Green" } else { "Yellow" })
