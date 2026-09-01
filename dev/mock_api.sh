#!/usr/bin/env bash
set -euo pipefail

target_dir="../api/var"
base_url="https://cort.ovh/api/var"

files=(
	"wstatus.json"
	"stats.json"
	"events.json"
	"trainer_saved_setups.txt"
	"maintenance.txt"
	"events.sqlite"
)

echo "Populating /api/var..."
for file in "${files[@]}"; do
	curl -fsSL "${base_url}/${file}" -o "${target_dir}/${file}"
done
echo "OK!"
