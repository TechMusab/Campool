# Update all API endpoints to use the correct IP address
 = @('app/login.tsx', 'app/search-rides.tsx', 'app/post-ride.tsx', 'app/chat/[rideId].tsx')

foreach ( in ) {
    if (Test-Path ) {
        Write-Host "Updating "
        (Get-Content ) -replace 'http://localhost:4000', 'https://campool-l1un.vercel.app' | Set-Content 
    }
}
