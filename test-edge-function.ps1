# Test Supabase Edge Function
Write-Host "`n=== Testing AI Chat Edge Function ===" -ForegroundColor Cyan

$body = @{
    messages = @(
        @{
            role = 'user'
            content = 'What is A36 steel? Answer in one sentence.'
        }
    )
} | ConvertTo-Json -Depth 10

Write-Host "`nSending request to Edge Function..." -ForegroundColor Yellow

$response = Invoke-WebRequest `
    -Uri 'https://giyheniqqqwpmetefdxj.supabase.co/functions/v1/ai-chat' `
    -Method POST `
    -ContentType 'application/json' `
    -Body $body `
    -UseBasicParsing

Write-Host "`nStatus Code: $($response.StatusCode)" -ForegroundColor Green

$result = $response.Content | ConvertFrom-Json

Write-Host "`nAI Response:" -ForegroundColor Cyan
Write-Host $result.message.content -ForegroundColor White

Write-Host "`nUsage:" -ForegroundColor Cyan
Write-Host "  Prompt tokens: $($result.usage.prompt_tokens)"
Write-Host "  Completion tokens: $($result.usage.completion_tokens)"
Write-Host "  Total tokens: $($result.usage.total_tokens)"
Write-Host "  Model: $($result.model)"

Write-Host "`n✅ Edge Function is working!" -ForegroundColor Green
