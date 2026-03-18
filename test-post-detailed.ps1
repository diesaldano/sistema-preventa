# Test detallado del endpoint POST /api/orders

$baseUrl = "http://localhost:3000"
$api = "$baseUrl/api"

Write-Host "Obteniendo productos primero..." -ForegroundColor Cyan

try {
  $productsResponse = Invoke-WebRequest -Uri "$api/products" -Method Get
  $products = $productsResponse.Content | ConvertFrom-Json
  
  if ($products -and $products.Count -gt 0) {
    $firstProductId = $products[0].id
    Write-Host "Primer producto ID: $firstProductId" -ForegroundColor Green
  } else {
    Write-Host "No se encontraron productos!" -ForegroundColor Red
    exit
  }
  
} catch {
  Write-Host "Error obteniendo productos: $($_.Exception.Message)" -ForegroundColor Red
  exit
}

Write-Host "`nEnviando solicitud al endpoint POST /api/orders..." -ForegroundColor Cyan

$createOrderBody = @{
  name = "Juan Test E2E"
  email = "juan.e2e@test.com"
  phone = "+54911223344"
  items = @(
    @{
      productId = $firstProductId
      quantity = 2
      price = 150000
    }
  )
  total = 300000
} | ConvertTo-Json

Write-Host "Body enviado:" -ForegroundColor Yellow
Write-Host $createOrderBody

try {
  $response = Invoke-WebRequest -Uri "$api/orders" -Method Post -ContentType "application/json" -Body $createOrderBody -ErrorAction Stop
  
  Write-Host "`nRespuesta exitosa (status $($response.StatusCode)):" -ForegroundColor Green
  $response.Content | ConvertFrom-Json | ConvertTo-Json
  
} catch {
  Write-Host "`nError en la respuesta:" -ForegroundColor Red
  Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
  
  if ($_.Exception.Response) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errorContent = $reader.ReadToEnd()
    Write-Host "Contenido del error:" -ForegroundColor Red
    Write-Host $errorContent
  }
}
