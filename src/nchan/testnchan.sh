#!/bin/bash
# Minimal Nchan test script following karpathy-guidelines
set -e

# Resolve project root relative to script location
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$DIR/../.."

echo "--- Building Nchan Docker image ---"
(cd "$ROOT_DIR" && yarn docker:build)

echo "--- Starting Nchan container ---"
PORT=8080
CONTAINER_NAME="nchan-test-local"

# Stop existing container if it exists
docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d --rm -p $PORT:80 --name "$CONTAINER_NAME" tailuge/billiards-network

echo "---------------------------------------"
echo "---             TESTING             ---"
echo "---------------------------------------"
echo ""

# Cleanup on exit or failure
trap 'echo "--- Shutting down ---"; docker stop "$CONTAINER_NAME"' EXIT

echo "--- Waiting for image to initialize ---"
sleep 2

printf "\n\n--- Health Check: /basic_status ---\n"
curl -s http://localhost:$PORT/basic_status

printf "\n\n--- Stats: /nchan_stats ---\n"
curl -s http://localhost:$PORT/nchan_stats
echo ""

printf "\n\n--- Index: /index.html ---\n"
curl -s http://localhost:$PORT/index.html
echo ""

printf "\n--- Test: Publish to Lobby ---\n"
curl -s -X POST -d "{\"event\": \"test\"}" http://localhost:$PORT/publish/lobby/testchannel
echo ""

printf "\n--- Test: Pub/Sub Demo (Lobby) ---\n"
echo "Starting subscriber in background..."
curl -s http://localhost:$PORT/subscribe/lobby/demo &
SUB_PID=$!
sleep 1
echo "Publishing message to demo channel..."
curl -s -X POST -d "Hello from Pub/Sub test" http://localhost:$PORT/publish/lobby/demo
wait $SUB_PID
printf "\nSubscriber received message and exited.\n"

echo "--- Test Completed successfully ---"

