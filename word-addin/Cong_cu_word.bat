@echo off
chcp 65001 >nul
echo Dang cai dat Add-in SaoBay vao Microsoft Word...

:: Tự động tạo thư mục STARTUP nếu máy khách chưa có
powershell -Command "if (!(Test-Path \"$env:APPDATA\Microsoft\Word\STARTUP\")) { New-Item -ItemType Directory -Force -Path \"$env:APPDATA\Microsoft\Word\STARTUP\" | Out-Null }"

:: Tải file add-in vào thư mục STARTUP
powershell -Command "Invoke-WebRequest -Uri 'https://saobay.github.io/word-addin/saobay.dotm' -OutFile \"$env:APPDATA\Microsoft\Word\STARTUP\saobay.dotm\""

echo Cai dat thanh cong! Vui long mo lai Microsoft Word de su dung.
pause