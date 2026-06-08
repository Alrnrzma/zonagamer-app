FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# 0.0.0.0 es para que Docker acepte conexiones externas.
# En el navegador se abre con: http://localhost:8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]