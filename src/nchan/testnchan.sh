#!/bin/bash
# Minimal Nchan test script
set -uo pipefail

# Defaults
DEFAULT_BASE_URL="http://localhost:80"
PROD_BASE_URL="https://billiards-network.onrender.com"
BASE_URL="$DEFAULT_BASE_URL"
PRODUCTION=false
CONTAINER_NAME="nchan-test-local"
PORT=80
DOCKER_IMAGE="tailuge/billiards-network"
TOTAL_TESTS=0
FAILED_TESTS=0
SEPARATOR="---------------------------------------"

# Resolve project root relative to script location
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$DIR/../.."

usage() {
	echo "Usage: $0 [-p]"
	echo "  -p: Production mode (points to $PROD_BASE_URL)"
	exit 1
	return 1
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
	# Ensure no stale container blocks startup
	docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

	if ! docker run -d --user root -p "$PORT":80 --name "$CONTAINER_NAME" "$DOCKER_IMAGE"; then
		echo "Failed to start container $CONTAINER_NAME."
		return 1
	fi

	echo "--- Waiting for image to initialize ---"
	local attempt=1
	local max_attempts=30
	while [[ $attempt -le $max_attempts ]]; do
		if curl -fsS --max-time 2 "$BASE_URL/basic_status" >/dev/null 2>&1; then
			echo "Container is healthy."
			return 0
		fi
		if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
			echo "Container exited before becoming healthy. Last logs:"
			docker logs "$CONTAINER_NAME" 2>&1 || true
			return 1
		fi
		sleep 1
		attempt=$((attempt + 1))
	done

	echo "Timed out waiting for healthy Nchan container. Last logs:"
	docker logs "$CONTAINER_NAME" 2>&1 || true
	return 1
}

record_result() {
	local exit_code=$1
	local test_name=$2
	TOTAL_TESTS=$((TOTAL_TESTS + 1))
	if [[ $exit_code -eq 0 ]]; then
		echo "PASS: $test_name"
	else
		echo "FAIL: $test_name"
		FAILED_TESTS=$((FAILED_TESTS + 1))
	fi
	return 0
}

run_test() {
	local test_name=$1
	shift
	echo ""
	echo "--- Test: $test_name ---"
	if "$@"; then
		record_result 0 "$test_name"
	else
		record_result 1 "$test_name"
	fi
	return 0
}

cleanup() {
	if [[ "$PRODUCTION" == "false" ]]; then
		echo "--- Shutting down local container ---"
		docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
		docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
	fi
	return 0
}

run_curl_tests() {
	echo "$SEPARATOR"
	echo "---             TESTING             ---"
	echo "--- Base URL: $BASE_URL ---"
	echo "$SEPARATOR"
	echo ""

	run_test "Health Check (/basic_status)" curl -fsS --max-time 5 "$BASE_URL/basic_status"

	run_test "Stats (/nchan_stats)" curl -fsS --max-time 5 "$BASE_URL/nchan_stats"

	run_test "Index (/index.html)" curl -fsS --max-time 5 "$BASE_URL/index.html"

	run_test "Publish to Lobby + custom headers" bash -c "
		RESPONSE=\$(curl -sS -i --max-time 5 -X POST -H 'Origin: $BASE_URL' -d '{\"event\": \"test\"}' '$BASE_URL/publish/lobby/testchannel') || exit 1
		echo \"\$RESPONSE\"
		echo \"\$RESPONSE\" | grep -q 'X-Server-Time:' &&
			echo \"\$RESPONSE\" | grep -q 'X-User-Agent:' &&
			echo \"\$RESPONSE\" | grep -q 'X-Origin:'
	"

	run_test "Pub/Sub Demo (Lobby)" bash -c "
		echo 'Starting subscriber in background...'
		curl -fsS --max-time 8 '$BASE_URL/subscribe/lobby/demo' >/tmp/nchan-lobby-sub.out &
		SUB_PID=\$!
		sleep 1
		echo 'Publishing message to demo channel...'
		curl -fsS --max-time 5 -X POST -d 'Hello from Pub/Sub test' '$BASE_URL/publish/lobby/demo' >/dev/null
		wait \$SUB_PID
		grep -q 'Hello from Pub/Sub test' /tmp/nchan-lobby-sub.out
	"

	run_test "WebSocket Handshake (ws/wss)" bash -c "
		HOST=\$(echo '$BASE_URL' | sed -E 's@^[[:space:]]*https?://([^/]+).*@\\1@')
		curl -sS -i -N --http1.1 --max-time 5 \
			-H 'Connection: Upgrade' \
			-H 'Upgrade: websocket' \
			-H \"Host: \$HOST\" \
			-H 'Origin: $BASE_URL' \
			-H 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==' \
			-H 'Sec-WebSocket-Version: 13' \
			'$BASE_URL/subscribe/lobby/handshake' | grep -m 1 'HTTP/1.1 101'
	"

	run_test "Publish to Presence" curl -fsS --max-time 5 -X POST -d '{"userId":"user1","userName":"Alice","type":"join"}' "$BASE_URL/publish/presence/lobby"

	run_test "Presence Pub/Sub (buffered messages)" bash -c "
		echo 'Publishing 3 presence messages...'
		curl -fsS --max-time 5 -X POST -d '{\"userId\":\"user1\",\"userName\":\"Alice\",\"type\":\"join\"}' '$BASE_URL/publish/presence/lobby' >/dev/null
		curl -fsS --max-time 5 -X POST -d '{\"userId\":\"user2\",\"userName\":\"Bob\",\"type\":\"join\"}' '$BASE_URL/publish/presence/lobby' >/dev/null
		curl -fsS --max-time 5 -X POST -d '{\"userId\":\"user1\",\"userName\":\"Alice\",\"type\":\"heartbeat\"}' '$BASE_URL/publish/presence/lobby' >/dev/null
		echo 'Starting subscriber (should receive buffered messages)...'
		RESP=\$(curl -fsS --max-time 5 '$BASE_URL/subscribe/presence/lobby') || exit 1
		echo \"\$RESP\"
		echo \"\$RESP\" | grep -q 'userId'
	"

	echo ""
	echo "$SEPARATOR"
	echo "--- Result: $((TOTAL_TESTS - FAILED_TESTS))/$TOTAL_TESTS passed ---"
	echo "$SEPARATOR"
	if [[ $FAILED_TESTS -gt 0 ]]; then
		return 1
	fi
	return 0
}

# Set cleanup trap
trap cleanup EXIT

# Execution flow
if ! setup_docker; then
	exit 1
fi

run_curl_tests
