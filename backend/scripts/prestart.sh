#! /usr/bin/env bash

# Let the DB start
echo "Running migrations..."
alembic upgrade head

echo "Starting server..."
# Exec command passed as arguments or default uvicorn
exec "$@"
