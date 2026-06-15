$path = 'app/admin/analytics/page.tsx'
$bytes = [System.IO.File]::ReadAllBytes($path)
$len = $bytes.Length
Write-Host ("Size: {0} bytes" -f $len)

Write-Host 'First 32 bytes (hex):'
$firstLen = [Math]::Min(32, $len)
$first = $bytes[0..($firstLen-1)]
Write-Host ([BitConverter]::ToString($first))

Write-Host 'Last 32 bytes (hex):'
$start = [Math]::Max(0, $len-32)
$last = $bytes[$start..($len-1)]
Write-Host ([BitConverter]::ToString($last))

Write-Host '--- Find non-UTF8 byte positions (first 20) ---'
$count = 0
for ($i=0; $i -lt $len; $i++) {
    $b = $bytes[$i]
    # Identify bytes that are NOT valid as the first byte of a UTF-8 sequence per typical ASCII/UTF-8 text
    # We'll find any byte > 0x7F (non-ASCII) and look at context
    if ($b -gt 0x7F) {
        $count++
        if ($count -le 20) {
            $ctxStart = [Math]::Max(0, $i-4)
            $ctxEnd = [Math]::Min($len-1, $i+4)
            $ctx = $bytes[$ctxStart..$ctxEnd]
            Write-Host ("  Offset {0}: byte=0x{1:X2} context=[{2}]" -f $i, $b, ([BitConverter]::ToString($ctx)))
        }
    }
}
Write-Host ("Total non-ASCII bytes: {0}" -f $count)

Write-Host '--- Try to decode as UTF-8 (will throw on invalid) ---'
try {
    $text = [System.Text.Encoding]::UTF8.GetString($bytes)
    Write-Host ("Decoded OK, length: {0}" -f $text.Length)
} catch {
    Write-Host ("DECODE FAILED: {0}" -f $_.Exception.Message)
}
