#!/usr/bin/env bash

# Check if a URL is provided as an argument
OUTPUT_FOLDER=$2
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <URL> <OUTPUT_FOLDER>"
    exit 1
fi

URL="$1"
FILENAME=$(basename "$URL")
echo "Downloading '${FILENAME}' from '${URL}'"

# Run the Python script
python3 ./download_file.py "${URL}" "${OUTPUT_FOLDER}/${FILENAME}"

exit 0
