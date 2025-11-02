# ---- Configuration ----
$piUser = "clcontact"
$piHost = "172.20.6.194"
$piAppDir = "/node/sportsticker2_0/frontend"
$pm2AppName = "sports-frontend"
$remoteDistDir = "$piAppDir/dist"
$destination = "${piUser}@${piHost}:$remoteDistDir/"

# === Step 1: Build React frontend locally ===
Write-Host " Building React frontend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host " Build failed. Aborting deployment." -ForegroundColor Red
    exit 1
}

# === Step 2: Upload dist/ to Raspberry Pi ===
Write-Host " Uploading dist/ folder to Raspberry Pi..." -ForegroundColor Cyan
$destination = "${piUser}@${piHost}:$remoteDistDir/"

#scp -r ./dist/* $destination
scp -r ./dist/* clcontact@172.20.6.194:/node/sportsticker2_0/frontend/dist/

if ($LASTEXITCODE -ne 0) {
    Write-Host " Upload failed. Aborting deployment." -ForegroundColor Red
    exit 1
}

# === Step 3: Restart PM2 process on Raspberry Pi ===
Write-Host " Restarting PM2 process..." -ForegroundColor Cyan

# Use single quotes to avoid PowerShell parsing issues
#$remoteCommand = 'pm2 delete ' + $pm2AppName + '; pm2 start serve --name ' + $pm2AppName + ' -- -s ' + $remoteDistDir + ' -l 3000; pm2 save; pm2 status ' + $pm2AppName
$remoteCommand = 'pm2 delete ' + $pm2AppName + '; pm2 start npm --name ' + $pm2AppName + ' -- run dev; pm2 save; pm2 status ' + $pm2AppName

ssh "${piUser}@${piHost}" $remoteCommand

Write-Host " Deployment complete!" -ForegroundColor Green