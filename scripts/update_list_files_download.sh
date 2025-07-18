#!/usr/bin/env bash

MAX_DEPTH=1
FOLDER_PATH=$1
OUTPUT_FILE=$2

help() {
  echo "given the folder path, redirect the list of output files to the given file (MAX_DEPTH is optional)"
  echo "scan the given folder searching for files that are not *git* or *env*"
  echo "Usage: \$0 <FOLDER_PATH> <OUTPUT_FILE> <MAX_DEPTH>"
  echo ""
}

if [ -z "${FOLDER_PATH}" ]; then
    help
    echo "argument \$1 'FOLDER_PATH' not found: error!"
    exit 1
fi
if [ -z "${OUTPUT_FILE}" ]; then
    help
    echo "argument \$2 'OUTPUT_FILE' not found: error!"
    exit 1
fi
if [ -n "$3" ]; then
    echo "try to set MAX_DEPTH to '$3'..."
    if [ -n "$3" ] && [ "$3" -eq "$3" ] 2>/dev/null; then
      MAX_DEPTH=$3
    else
      help
      echo "you are using a the optional MAX_DEPTH argument, but isn't a positive integer: error!"
      exit 2
    fi
fi

echo "using MAX_DEPTH='${MAX_DEPTH}' with the command:"
echo find "${FOLDER_PATH}"/ -maxdepth "${MAX_DEPTH}" -type f ! -name "*git*" ! -name "*env*" ! -name "*.py[co]" | tee "${OUTPUT_FILE}"
echo ""

find "${FOLDER_PATH}"/ -maxdepth "${MAX_DEPTH}" -type f ! -name "*git*" ! -name "*env*" ! -name "*.py[co]" | tee "${OUTPUT_FILE}"

exit 0
