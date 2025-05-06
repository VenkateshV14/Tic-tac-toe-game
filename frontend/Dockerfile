FROM python:3.10-slim 

WORKDIR /app

COPY . .

EXPOSE 3500

CMD ["python", "-m", "http.server", "3500", "--bind", "0.0.0.0"]