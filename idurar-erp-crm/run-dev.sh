#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
cd "$SCRIPT_DIR"

backend_pid=''
frontend_pid=''

cleanup() {
  if [ -n "$backend_pid" ] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  if [ -n "$frontend_pid" ] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill "$frontend_pid" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting backend and frontend development servers..."

npm --prefix ./backend run dev &
backend_pid=$!

npm --prefix ./frontend run dev &
frontend_pid=$!

backend_status=0
frontend_status=0

while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do
  sleep 1
done

if ! kill -0 "$backend_pid" 2>/dev/null; then
  wait "$backend_pid" || backend_status=$?
fi

if ! kill -0 "$frontend_pid" 2>/dev/null; then
  wait "$frontend_pid" || frontend_status=$?
fi

if [ "$backend_status" -ne 0 ]; then
  exit "$backend_status"
fi

if [ "$frontend_status" -ne 0 ]; then
  exit "$frontend_status"
fi