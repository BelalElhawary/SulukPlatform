@echo off
echo Starting Suluk Platform in Production Mode...

:: 1. Start Ollama
echo Starting Ollama...
start "Ollama Service" ollama serve

:: 2. Start Backend
echo Starting Backend...
cd suluk-platform-ai-backend
start "Suluk Backend" cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
cd ..

:: 3. Build and Serve Frontend
echo Building Frontend (this may take a moment)...
cd suluk-platform-frontend
call npm run build

echo Starting Frontend Server...
:: Using 'preview' as per package.json standard for serving built files
start "Suluk Frontend" npm run preview

echo.
echo All services started!
echo Backend running on http://localhost:8000
echo Frontend will run on http://localhost:4173 (check window)
echo.
pause
