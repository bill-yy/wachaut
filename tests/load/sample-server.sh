#!/usr/bin/env bash
# Server-side sampler — run ON THE VPS (SSH) while run.mjs runs outside.
# Captures docker stats for the media containers + host load into a CSV.
#
#   ./sample-server.sh 600        # sample for 600 seconds → /tmp/wachaut-load.csv
set -euo pipefail

DURATION=${1:-600}
OUT=${2:-/tmp/wachaut-load.csv}

echo "ts,cpu_pct,mem_pct,load1,sfu_cpu,sfu_mem,server_cpu,server_mem,coturn_cpu,coturn_mem" > "$OUT"

# Resolve the running container names once (they carry swarm task suffixes).
sfu=$(docker ps --format '{{.Names}}' | grep -m1 'app-input-haptic')
server=$(docker ps --format '{{.Names}}' | grep -m1 'wachaut-wachaut')
coturn=$(docker ps --format '{{.Names}}' | grep -m1 'coturn' || true)

end=$((SECONDS + DURATION))
echo "sampling for ${DURATION}s → $OUT (sfu=$sfu server=$server coturn=$coturn)"
while [ $SECONDS -lt $end ]; do
  # Host load + CPU (us+sy from top) + RAM used % (free).
  load1=$(cut -d' ' -f1 /proc/loadavg)
  cpu=$(top -bn1 | awk '/Cpu\(s\)/ {gsub(/[%,]/,""); printf "%.1f", $2+$4}')
  mem=$(free | awk '/Mem:/ {printf "%.1f", $3/$2*100}')
  row="$(date -u +%FT%TZ),$cpu,$mem,$load1"

  for name in "$sfu" "$server" "$coturn"; do
    if [ -n "${name:-}" ]; then
      stats=$(docker stats --no-stream --format '{{.CPUPerc}},{{.MemPerc}}' "$name" | tr -d '% ')
      row="$row,$stats"
    else
      row="$row,,"
    fi
  done
  echo "$row" >> "$OUT"
  sleep 10
done
echo "done → $OUT"
