# E2E Testing Script para Sistema Preventa

Write-Host "Iniciando E2E Tests..." -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"
$api = "$baseUrl/api"

$testResults = @()

# TEST 1: Obtener todos los productos
Write-Host "`nTEST 1: Obtener todos los productos" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "$api/products" -Method Get
  $products = $response.Content | ConvertFrom-Json
  
  if ($products.Count -ge 6) {
    Write-Host "PASS: Se obtuvieron $($products.Count) productos" -ForegroundColor Green
    $testResults += @{test = "GET /api/products"; status = "PASS" }
  } else {
    Write-Host "FAIL: Se esperaban 6 productos, se obtuvieron $($products.Count)" -ForegroundColor Red
    $testResults += @{test = "GET /api/products"; status = "FAIL" }
  }
} catch {
  Write-Host "FAIL: Error fetching products - $($_.Exception.Message)" -ForegroundColor Red
  $testResults += @{test = "GET /api/products"; status = "FAIL" }
}

# TEST 2: Crear una nueva orden
Write-Host "`nTEST 2: Crear una nueva orden" -ForegroundColor Yellow
$createOrderBody = @{
  name = "Juan Test E2E"
  email = "juan.e2e@test.com"
  phone = "+54911223344"
  items = @(
    @{
      productId = "1"
      quantity = 2
      price = 150000
    }
  )
  total = 300000
} | ConvertTo-Json

try {
  $response = Invoke-WebRequest -Uri "$api/orders" -Method Post -ContentType "application/json" -Body $createOrderBody
  $order = $response.Content | ConvertFrom-Json
  
  if ($order.code -and $order.status -eq "PENDING_PAYMENT") {
    Write-Host "PASS: Orden creada - Código: $($order.code), Status: $($order.status)" -ForegroundColor Green
    $testResults += @{test = "POST /api/orders"; status = "PASS" }
    $testOrderCode = $order.code
  } else {
    Write-Host "FAIL: Respuesta invalida" -ForegroundColor Red
    $testResults += @{test = "POST /api/orders"; status = "FAIL" }
  }
} catch {
  Write-Host "FAIL: Error creating order - $($_.Exception.Message)" -ForegroundColor Red
  $testResults += @{test = "POST /api/orders"; status = "FAIL" }
}

# TEST 3: Obtener orden por código
Write-Host "`nTEST 3: Obtener orden por código" -ForegroundColor Yellow
if ($testOrderCode) {
  try {
    $response = Invoke-WebRequest -Uri "$api/orders/$testOrderCode" -Method Get
    $order = $response.Content | ConvertFrom-Json
    
    if ($order.code -eq $testOrderCode) {
      Write-Host "PASS: Orden encontrada - $($order.code)" -ForegroundColor Green
      $testResults += @{test = "GET /api/orders/{code}"; status = "PASS" }
    } else {
      Write-Host "FAIL: Codigo no coincide" -ForegroundColor Red
      $testResults += @{test = "GET /api/orders/{code}"; status = "FAIL" }
    }
  } catch {
    Write-Host "FAIL: Error fetching order - $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{test = "GET /api/orders/{code}"; status = "FAIL" }
  }
} else {
  Write-Host "SKIP: No order code from previous test" -ForegroundColor Cyan
  $testResults += @{test = "GET /api/orders/{code}"; status = "SKIP" }
}

# TEST 4: Obtener todas las órdenes
Write-Host "`nTEST 4: Obtener todas las órdenes" -ForegroundColor Yellow
try {
  $response = Invoke-WebRequest -Uri "$api/orders" -Method Get
  $orders = $response.Content | ConvertFrom-Json
  
  if ($orders.Count -gt 0) {
    Write-Host "PASS: Se obtuvieron $($orders.Count) ordenes" -ForegroundColor Green
    $testResults += @{test = "GET /api/orders"; status = "PASS" }
  } else {
    Write-Host "FAIL: No se obtuvieron ordenes" -ForegroundColor Red
    $testResults += @{test = "GET /api/orders"; status = "FAIL" }
  }
} catch {
  Write-Host "FAIL: Error fetching orders - $($_.Exception.Message)" -ForegroundColor Red
  $testResults += @{test = "GET /api/orders"; status = "FAIL" }
}

# RESUMEN
Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "RESUMEN DE TESTS" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

$passCount = ($testResults | Where-Object { $_.status -eq "PASS" }).Count
$failCount = ($testResults | Where-Object { $_.status -eq "FAIL" }).Count
$skipCount = ($testResults | Where-Object { $_.status -eq "SKIP" }).Count

foreach ($result in $testResults) {
  $symbol = if ($result.status -eq "PASS") { "[PASS]" } 
            elseif ($result.status -eq "FAIL") { "[FAIL]" }
            else { "[SKIP]" }
  
  Write-Host "$symbol $($result.test): $($result.status)" -ForegroundColor $(
    if ($result.status -eq "PASS") { "Green" }
    elseif ($result.status -eq "FAIL") { "Red" }
    else { "Cyan" }
  )
}

Write-Host "`nPASS: $passCount | FAIL: $failCount | SKIP: $skipCount" -ForegroundColor Cyan
Write-Host "====================================================================`n" -ForegroundColor Cyan

if ($failCount -eq 0) {
  Write-Host "Tests completados exitosamente!" -ForegroundColor Green
} else {
  Write-Host "$failCount tests fallaron." -ForegroundColor Yellow
}
