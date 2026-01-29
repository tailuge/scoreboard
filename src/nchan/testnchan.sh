#!/bin/bash
# Minimal Nchan test script 
set -e

# Defaults
DEFAULT_BASE_URL="http://localhost:8080"
PROD_BASE_URL="https://billiards-network.onrender.com"
BASE_URL="$DEFAULT_BASE_URL"
PRODUCTION=false
CONTAINER_NAME="nchan-test-local"
PORT=8080

# Resolve project root relative to script location
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$DIR/../.."

usage() {
	echo "Usage: $0 [-p]"
	echo "  -p: Production mode (points to $PROD_BASE_URL)"
	exit 1
}

# Parse command line options
while getopts "p" opt; do
	case "$opt" in
	p)
		PRODUCTION=true
		BASE_URL="$PROD_BASE_URL"
		;;
	*)
		usage
		;;
	esac
done

setup_docker() {
	if [[ "$PRODUCTION" == "true" ]]; then
		echo "--- Production mode: skipping Docker setup ---"
		return 0
	fi

	echo "--- Building Nchan Docker image ---"
	(cd "$ROOT_DIR" && yarn docker:build)

	echo "--- Starting Nchan container ---"
	# Stop existing container if it exists
	docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true

	docker run -d --rm -p $PORT:80 --name "$CONTAINER_NAME" tailuge/billiards-network

	echo "--- Waiting for image to initialize ---"
	sleep 2
	return 0
}

cleanup() {
	if [[ "$PRODUCTION" == "false" ]]; then
		echo "--- Shutting down local container ---"
		docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
	fi
	return 0
}

run_curl_tests() {
	echo "---------------------------------------"
	echo "---             TESTING             ---"
	echo "--- Base URL: $BASE_URL ---"
	echo "---------------------------------------"
	echo ""

	printf "\n--- Health Check: /basic_status ---\n"
	curl -s --max-time 5 "$BASE_URL/basic_status"

	printf "\n\n--- Stats: /nchan_stats ---"
	curl -s --max-time 5 "$BASE_URL/nchan_stats"
	echo ""

	printf "\n\n--- Index: /index.html ---"
	curl -s --max-time 5 "$BASE_URL/index.html"
	echo ""

	printf "\n--- Test: Publish to Lobby ---"
	curl -s --max-time 5 -X POST -d '{"event": "test"}' "$BASE_URL/publish/lobby/testchannel"
	echo ""

	printf "\n--- Test: Pub/Sub Demo (Lobby) ---"
	echo "Starting subscriber in background..."
	curl -s --max-time 5 "$BASE_URL/subscribe/lobby/demo" &
	SUB_PID=$!
	sleep 1
	echo "Publishing message to demo channel..."
	curl -s --max-time 5 -X POST -d "Hello from Pub/Sub test" "$BASE_URL/publish/lobby/demo"
	wait $SUB_PID
	printf "\nSubscriber received message and exited.\n"

	printf "\n--- Test: WebSocket Handshake (ws/wss) ---"
	# Extract host for the Host header
	HOST=$(echo "$BASE_URL" | sed -E 's@^[[:space:]]*https?://([^/]+).*@\1@')

	if curl -s -i -N --http1.1 --max-time 5 \
		-H "Connection: Upgrade" \
		-H "Upgrade: websocket" \
		-H "Host: $HOST" \
		-H "Origin: $BASE_URL" \
		-H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
		-H "Sec-WebSocket-Version: 13" \
		"$BASE_URL/subscribe/lobby/handshake" | grep -m 1 "HTTP/1.1 101"; then
		echo "Handshake successful (HTTP 101 received)"
	else
		echo "Handshake failed or timed out"
		exit 1
	fi

	echo "--- Test Completed successfully ---"
	return 0
}

# Set cleanup trap
trap cleanup EXIT

# Execution flow
setup_docker
run_curl_tests