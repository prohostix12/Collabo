@echo off
echo Starting Collabo Platform...

echo Starting Django Backend...
start "Django Backend" cmd /k "cd backend && call venv\Scripts\activate && python manage.py runserver"

echo Starting React Frontend...
start "React Frontend" cmd /k "cd frontend && npm start"

echo Starting Redis Server...
start "Redis Server" cmd /k "redis-server"

echo Starting Celery Worker...
start "Celery Worker" cmd /k "cd backend && call venv\Scripts\activate && celery -A influencer_platform worker --loglevel=info"

echo Starting Celery Beat...
start "Celery Beat" cmd /k "cd backend && call venv\Scripts\activate && celery -A influencer_platform beat --loglevel=info"

echo All services started successfully!
echo You can close this window, the services will continue running in their own windows.
pause
