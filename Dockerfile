FROM python:3.10-slim

WORKDIR /app

RUN python -m venv /venv
# Make sure we use the virtualenv:
ENV PATH="/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
RUN python -m pip install --upgrade pip

COPY ./app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt