@echo off
echo Dang cai dat Add-in SaoBay vao Microsoft Word...
powershell -Command "Invoke-WebRequest -Uri 'https://saobay.github.io/word-addin/saobay.dotm' -OutFile \"$env:APPDATA\Microsoft\Word\STARTUP\saobay.dotm\""
echo Cai dat thanh cong! Vui long mo lai Microsoft Word de su dung.
pause