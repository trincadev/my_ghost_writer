#!/usr/bin/env bash

SCRIPT=$(realpath "$0")
REQUIREMENTS_NO_VERSION=$(realpath "$1") | $(realpath "./requirements_no_versions.txt")
SCRIPT_FOLDER=$(dirname "$SCRIPT")
ROOT_FOLDER=${SCRIPT_FOLDER}/../
echo "# REQUIREMENTS_NO_VERSION: ${REQUIREMENTS_NO_VERSION} #"

mkdir -p tmp
rm ./tmp/requirements_tmp.txt || echo "./tmp/requirements_tmp.txt not found!"

echo "start requirements.txt preparation: pip freeze..."
pip freeze > ./tmp/freeze.txt
echo "grep python dependencies into freeze.txt..."
for f in $(ls requirements_no_versions*.txt); do
  for x in $(cat ./$f); do
    echo "# $x #"
    grep $x ./tmp/freeze.txt >> ./tmp/${f}_tmp.txt
    echo "# done line '$x' #"
  done
  echo "# file '$f' ##" >> ./tmp/requirements_tmp.txt
  sort -u ./tmp/${f}_tmp.txt >> ./tmp/requirements_tmp.txt
  echo "# processed file '$f' ##" >> ./tmp/requirements_tmp.txt
  echo "# ==================== #" >> ./tmp/requirements_tmp.txt
done


echo "cat ${ROOT_FOLDER}/tmp/requirements_tmp.txt"
cat ${ROOT_FOLDER}/tmp/requirements_tmp.txt
echo -e "\n"

[[ "$(echo -n 'Promote && sort "${ROOT_FOLDER}/tmp/requirements_tmp.txt" as new requirements.txt? [y/N]> ' >&2; read; echo $REPLY)" == [Yy]* ]] \
  && echo "copy requirements_tmp.txt to root project..." \
  || exit 0

cp ${ROOT_FOLDER}/tmp/requirements_tmp.txt ${ROOT_FOLDER}/requirements.txt

echo "Fix any discrepancy within the new requirements.txt, bye!"

exit 0
