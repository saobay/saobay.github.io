@echo off
chcp 65001 > nul
setlocal

echo ==========================================
echo   ĐANG CẬP NHẬT SAOBAY.DOTM LOCAL ĐỂ TEST...
echo ==========================================

:: 1. Kiểm tra file nguồn
if not exist "%~dp0saobay.dotm" (
    echo [LỖI] Không tìm thấy file saobay.dotm cùng cấp với file bat này!
    goto error
)

:: 2. Đang tắt Microsoft Word
echo [1/3] Đang tắt Microsoft Word (để mở khóa file)...
taskkill /f /im WINWORD.EXE >nul 2>&1
timeout /t 1 >nul

:: 3. Đảm bảo thư mục STARTUP tồn tại
if not exist "%appdata%\Microsoft\Word\STARTUP" (
    mkdir "%appdata%\Microsoft\Word\STARTUP"
)

:: 4. Thực hiện copy (Bỏ >nul để hiện thông báo chính xác từ lệnh copy)
echo [2/3] Đang copy file saobay.dotm vào thư mục Startup...
copy /y "%~dp0saobay.dotm" "%appdata%\Microsoft\Word\STARTUP\saobay.dotm"

:: Kiểm tra nếu copy thất bại (0 file copied)
if errorlevel 1 (
    echo.
    echo [CẢNH BÁO] Copy thất bại, đang thử lại lần nữa...
    timeout /t 2 >nul
    copy /y "%~dp0saobay.dotm" "%appdata%\Microsoft\Word\STARTUP\saobay.dotm"
    if errorlevel 1 goto error
)

echo.
echo [THÀNH CÔNG] Đã copy thành công 1 file vào Startup!

:: 5. Khởi động lại Microsoft Word
echo [3/3] Đang khởi động lại Microsoft Word...
start "" "winword.exe"

echo ==========================================
echo   XONG! BẠN CÓ THỂ TEST NGAY LẬP TỨC.
echo ==========================================
timeout /t 3 >nul
exit

:error
echo ==========================================
echo   [LỖI] KHÔNG THỂ COPY ĐƯỢC FILE SAOBAY.DOTM!
echo ==========================================
echo Vui lòng đóng thủ công Microsoft Word và chạy lại file bat.
pause
exit