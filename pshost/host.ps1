
param($Extension, $Window)
<#
This file implements the Native Messaging host.

The browser will pass two parameters to this Native Messaging host:
$Extension - The identifier of the extension connecting to the host.
$Window    - The ID/index of the active window/tab.
#>

# Binary streams are needed to process the first 4 bytes of each message.
$stdin  = [System.Console]::OpenStandardInput()
$stdout = [System.Console]::OpenStandardOutput()
$reader = [System.IO.BinaryReader]::new($stdin)
$writer = [System.IO.BinaryWriter]::new($stdout)

function Write-Log($Msg) {
    $Msg | Out-File -FilePath "$PSScriptRoot\log.txt" -Append
}

Write-Log "Parameters received:"
Write-Log "Extension : $Extension"
Write-Log "Window    : $Window"

function Read-Message() {
    # First 4 raw bytes incoming are the host-order uint32 message length.
    $len = $reader.ReadUInt32()
    $buf = $reader.ReadBytes($len)
    $msg = [System.Text.Encoding]::UTF8.GetString($buf)
    Write-Log "Received: $msg"
    return $msg
}

function Write-Message($Msg) {
    # First 4 raw bytes outgoing are the host-order uint32 length.
    $buf = [System.Text.Encoding]::UTF8.GetBytes($Msg)
    $writer.Write([UInt32]$buf.Length)
    $writer.Write($buf, 0, $buf.Length)
    Write-Log "Response: $Msg"
}

while ($true) {
    try {
        $message = Read-Message

        # Avoid processing raw data from browsers using Invoke-Expression, 
        # et al. Implement specific operations.
        if ($message -match 'LIST_WORKING_DIRECTORY') {
            # Any extra output from commands needs to either be suppressed or
            # redirected to the standard error stream, or it will interfere
            # with intended data sent back to the browser.
            $list = (Get-ChildItem .).Name | 
                    ConvertTo-Json -WarningAction Ignore
            Write-Message $list
        } else {
            Write-Message '"Unrecognized request!"'
        }
        Write-Log '----'
    } catch {
        Write-Log "Disconnected: $_"
        break
    }
}
