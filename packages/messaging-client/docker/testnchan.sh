#!/bin/bash
# Nchan integration test script
set -uo pipefail

PROD_BASE_URL="https://billiards-network.onrender.com"
BASE_URL="http://localhost:80"
PRODUCTION=false

SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
DOCKER_NCHAN="$(realpath "$SCRIPT_DIR/../scripts/docker-nchan.sh")"

usage() {
	echo "Usage: $0 [-p]"
	echo "  -p: Production mode (skip Docker, use $PROD_BASE_URL)"
	exit 1
}

while getopts "p" opt; do
	case "$opt" in
	p) PRODUCTION=true ;;
	*) usage ;;
	esac
done

if [[ "$PRODUCTION" == "true" ]]; then
	BASE_URL="$PROD_BASE_URL"
fi

total=0
failed=0

run_test() {
	local name="$1"
	shift
	total=$((total + 1))
	if "$@"; then
		echo "PASS: $name"
	else
		echo "FAIL: $name"
		failed=$((failed + 1))
	fi
}

cleanup() {
	if [[ "$PRODUCTION" == "false" ]]; then
		"$DOCKER_NCHAN" stop >/dev/null 2>&1 || true
	fi
}

trap cleanup EXIT

if [[ "$PRODUCTION" == "false" ]]; then
	echo "--- Starting Nchan ---"
	"$DOCKER_NCHAN" start
fi

echo ""
echo "--- Testing: $BASE_URL ---"
echo ""

run_test "Health Check" curl -fsS --max-time 5 "$BASE_URL/basic_status"
run_test "Stats" curl -fsS --max-time 5 "$BASE_URL/nchan_stats"
run_test "Index" curl -fsS --max-time 5 "$BASE_URL/index.html"

run_test "Publish to Lobby" bash -c '
	curl -sS -i --max-time 5 -X POST -H "Origin: http://localhost" -d "{\"event\": \"test\"}" "http://localhost/publish/lobby/testchannel" | grep -q "X-Server-Time:"
'

run_test "Pub/Sub Demo" bash -c '
	curl -fsS --max-time 8 "http://localhost/subscribe/lobby/demo" >/tmp/nchan-sub.out &
	SUB_PID=$!
	sleep 1
	curl -fsS --max-time 5 -X POST -d "Hello from test" "http://localhost/publish/lobby/demo" >/dev/null
	wait $SUB_PID
	grep -q "Hello from test" /tmp/nchan-sub.out
'

run_test "WebSocket Handshake" bash -c '
	curl -sS -i -N --http1.1 --max-time 5 \
		-H "Connection: Upgrade" -H "Upgrade: websocket" -H "Host: localhost" \
		-H "Origin: http://localhost" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
		-H "Sec-WebSocket-Version: 13" "http://localhost/subscribe/lobby/handshake" | grep -qm1 "HTTP/1.1 101"
'

run_test "Publish to Presence" curl -fsS --max-time 5 -X POST \
	-d '{"userId":"user1","userName":"Alice","type":"join"}' "http://localhost/publish/presence/lobby"

run_test "Presence Pub/Sub" bash -c '
	curl -fsS --max-time 5 -X POST -d "{\"userId\":\"user1\",\"userName\":\"Alice\",\"type\":\"join\"}" "http://localhost/publish/presence/lobby" >/dev/null
	curl -fsS --max-time 5 -X POST -d "{\"userId\":\"user2\",\"userName\":\"Bob\",\"type\":\"join\"}" "http://localhost/publish/presence/lobby" >/dev/null
	curl -fsS --max-time 5 "http://localhost/subscribe/presence/lobby" | grep -q "userId"
'

run_test "Publish to Table" curl -fsS --max-time 5 -X POST \
	-d '{"type": "accept", "tableId": "testtable", "userId": "player1", "userName": "Alice"}' "http://localhost/publish/table/testtable"

run_test "Table Pub/Sub" bash -c '
	curl -fsS --max-time 5 -X POST -d "{\"type\": \"accept\", \"tableId\": \"tabletest\", \"userId\": \"player1\", \"userName\": \"Alice\"}" "http://localhost/publish/table/tabletest" >/dev/null
	curl -fsS --max-time 5 "http://localhost/subscribe/table/tabletest" | grep -q "tableId"
'

run_test "Meta: Publish response contains _meta field" bash -c '
	response=$(curl -fsS --max-time 5 -X POST -H "Origin: http://localhost" -H "User-Agent: test-agent" -d "{\"event\": \"meta_test\"}" "http://localhost/publish/lobby/meta")
	echo "$response" | grep -q "_meta"
'

run_test "Meta: Publish response contains ts field" bash -c '
	response=$(curl -fsS --max-time 5 -X POST -H "Origin: http://localhost" -H "User-Agent: test-agent" -d "{\"event\": \"meta_test\"}" "http://localhost/publish/lobby/meta_ts")
	echo "$response" | grep -q "\"ts\":"
'

run_test "Meta: Publish response contains origin field" bash -c '
	response=$(curl -fsS --max-time 5 -X POST -H "Origin: http://testorigin.com" -d "{\"event\": \"meta_test\"}" "http://localhost/publish/lobby/meta_origin")
	echo "$response" | grep -q "origin"
'

run_test "Meta: Publish response contains method field" bash -c '
	response=$(curl -fsS --max-time 5 -X POST -d "{\"event\": \"meta_test\"}" "http://localhost/publish/lobby/meta_method")
	echo "$response" | grep -q "\"method\":"
'

run_test "Meta: Publish response contains path field" bash -c '
	response=$(curl -fsS --max-time 5 -X POST -d "{\"event\": \"meta_test\"}" "http://localhost/publish/lobby/meta_path")
	echo "$response" | grep -q "\"path\":"
'

run_test "Meta: Subscribe receives _meta in published message" bash -c '
	curl -fsS --max-time 5 "http://localhost/subscribe/lobby/meta_sub" >/tmp/nchan-meta-sub.out &
	SUB_PID=$!
	sleep 1
	curl -fsS --max-time 5 -X POST -d "{\"event\": \"meta_message\"}" "http://localhost/publish/lobby/meta_sub" >/dev/null
	wait $SUB_PID
	grep -q "_meta" /tmp/nchan-meta-sub.out
'

run_test "Meta: Subscribe receives ts in published message" bash -c '
	curl -fsS --max-time 5 "http://localhost/subscribe/lobby/meta_ts_sub" >/tmp/nchan-meta-ts.out &
	SUB_PID=$!
	sleep 1
	curl -fsS --max-time 5 -X POST -d "{\"event\": \"ts_message\"}" "http://localhost/publish/lobby/meta_ts_sub" >/dev/null
	wait $SUB_PID
	grep -q "ts" /tmp/nchan-meta-ts.out
'

run_test "Meta: Subscribe receives method in published message" bash -c '
	curl -fsS --max-time 5 "http://localhost/subscribe/lobby/meta_method_sub" >/tmp/nchan-meta-method.out &
	SUB_PID=$!
	sleep 1
	curl -fsS --max-time 5 -X POST -d "{\"event\": \"method_message\"}" "http://localhost/publish/lobby/meta_method_sub" >/dev/null
	wait $SUB_PID
	grep -q "method" /tmp/nchan-meta-method.out
'

echo ""
echo "--- Result: $((total - failed))/$total passed ---"
[[ $failed -eq 0 ]]
