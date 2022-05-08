$root = $PSScriptRoot
start chrome --app="file:///$root/myapp.html",--window-size="400,400",--load-extension="$root\extension"

$key = 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.tweedle.examplehost'
$hostManifest = "$root\pshost\manifest.json"

New-ItemProperty -Path $key `
                    -Value $hostManifest `
                    -PropertyType String `
                    -Force | Out-Null
