FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENV PYTHONDONTWRITEBYTECODE 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
