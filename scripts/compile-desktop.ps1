$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskSdk = Join-Path $PSScriptRoot 'webview2-sdk'
$taskOutput = Join-Path $taskRoot 'outputs\surface-lab.exe'
$taskCompilerArgs = @(
 '/nologo','/codepage:65001','/target:winexe','/platform:x64','/optimize+',
 "/out:$taskOutput",
 "/win32icon:$PSScriptRoot\app.ico",
 "/win32manifest:$PSScriptRoot\app.manifest",
 '/reference:System.dll','/reference:System.Core.dll','/reference:System.Drawing.dll','/reference:System.Windows.Forms.dll',
 "/reference:$taskSdk\lib\net462\Microsoft.Web.WebView2.Core.dll",
 "/reference:$taskSdk\lib\net462\Microsoft.Web.WebView2.WinForms.dll",
 "/resource:$taskRoot\outputs\surface-lab.html,surface.html",
 "/resource:$taskSdk\lib\net462\Microsoft.Web.WebView2.Core.dll,Microsoft.Web.WebView2.Core.dll",
 "/resource:$taskSdk\lib\net462\Microsoft.Web.WebView2.WinForms.dll,Microsoft.Web.WebView2.WinForms.dll",
 "/resource:$taskSdk\runtimes\win-x64\native\WebView2Loader.dll,WebView2Loader.dll",
 "/resource:$taskSdk\LICENSE.txt,WebView2-LICENSE.txt",
 "/resource:$taskSdk\NOTICE.txt,WebView2-NOTICE.txt",
 "/resource:$PSScriptRoot\app.ico,app.ico",
 "$PSScriptRoot\desktop.cs"
)
& 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe' @taskCompilerArgs
if ($LASTEXITCODE -ne 0) { throw 'EXE 编译失败' }
Get-Item -LiteralPath $taskOutput | Select-Object Name,Length
