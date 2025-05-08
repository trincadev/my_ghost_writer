#!/bin/bash

GITHUB_USER="trincadev"
GITHUB_REPO="my_ghost_writer"

export API_MODE=TRUE
export ALLOWED_ORIGIN=http://localhost:7860,http://localhost:8000
python_executable=$(which python3)
ORIGIN_PYTHON=SYSTEM
VERSION="0.1.0"
VIRTUALENV_FOLDER="venv_mgw"
ROOT_FOLDER=$0
REPOSITORY_URL="https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"


display_help() {
    echo
    echo "Script version $VERSION"
    echo "A tool for installing and/or executing My Ghost Writer (${REPOSITORY_URL})."
    echo 'Usage: install.sh <option>'
    echo 'Options:'
    echo '   -h --help                                     Show help'
    echo '   -d --download-nltk                            Download required NLTK data files (crubadan, optional since you could download them manually or have them already)'
    echo '   -i --only-install                             Only install the python package and its dependencies (optional, without this option the script will install the package and run it)'
    echo "   -p --python-executable <python_executable>    Specifies the python executable to use (optional, without this option the default python3 executable (${python_executable}) will be used)"
    echo "   -o --allowed-origin <allowed_origin>          Specifies the allowed origin for the webserver (optional, without this option the default value (${ALLOWED_ORIGIN}) will be used)"
    echo '   -V --package-version <package>                Specifies package version to install (optional, without this option the latest version will be installed)'
    echo
    echo 'Submit a GitHub issue if you are encountering problems or want to suggest new features.'
    echo
    exit 1
}


while [[ $# -gt 0 ]]
do
key="$1"

case $key in
    -o|--allowed-origin)
    export ALLOWED_ORIGIN="$2"
    shift # past argument
    shift # past value
    ;;
    -h|--help)
    help=YES
    shift # past argument
    ;;
    -V|--package-version)
    package_version="$2"
    echo "package_version: '${package_version}'"
    shift # past argument
    shift # past value
    ;;
    -p|--python-executable)
    python_executable="$2"
    ORIGIN_PYTHON=CUSTOM
    echo "# custom python_executable: '${python_executable}'"
    ${python_executable} --version
    shift # past argument
    shift # past value
    ;;
    -i|--only-install)
    only_install=YES
    shift # past argument
    ;;
    -d|--download-nltk)
    download_nltk=YES
    echo "# download_nltk: '${download_nltk}'"
    shift # past argument
    ;;
    *) echo "Unknown parameter passed: '$1'";
    display_help
    exit 1
    ;;
esac
done


installer(){
    echo -e "\n# using python executable ${python_executable} (python origin is ${ORIGIN_PYTHON}) with version:"
    ${python_executable} --version

    echo -e "\n# Installing virtualenv:"
    ${python_executable} -m venv ${VIRTUALENV_FOLDER}

    echo -e "\n# Activating venv_mgw:"
    source ${VIRTUALENV_FOLDER}/bin/activate

    echo -e "\n# virtualenv folder:"
    echo ${VIRTUAL_ENV}

    python -m pip install --upgrade pip

    echo -e "\n# virtualenv python version:"
    which python
    python --version

    echo -e "\n# installing my-ghost-writer"
    if [ -z ${package_version} ]; then
        echo -e "\n# Installing latest version of my-ghost-writer..."
        python -m pip install my-ghost-writer
    else
        echo -e "\n# Installing version my-ghost-writer==${package_version}..."
        python -m pip install my-ghost-writer==${package_version}
    fi

    MGW_VERSION=$(python -m pip freeze|grep -E "my_ghost_writer|my-ghost-writer"|cut -d'=' -f3)
    # gitlab prefix: https://gitlab.com/{GITLAB_USER}/{GITLAB_REPO}/-/raw
    URL_REPOSITORY_PREFIX="https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/refs/tags/${MGW_VERSION}"
    python -m pip install my-ghost-writer -r "${URL_REPOSITORY_PREFIX}/requirements-webserver.txt"
    
    if [ "$download_nltk" = "YES" ]; then
        echo -e "\n# install required NLTK data files (crubadan):"
        python -m nltk.downloader -d "${VIRTUALENV_FOLDER}/nltk_data" crubadan
    fi

    echo -e "\n# installed my-ghost-writer version: ${MGW_VERSION}!"
}

runner(){
    echo -e "\n# running my-ghost-writer, API_MODE: ${API_MODE}, version: ${MGW_VERSION}..."
    python -m my_ghost_writer.app
}

if [ "$help" = "YES" ]; then
    display_help
    exit 0
fi

if [ -z "${only_install}" ]; then
    installer
    echo -e "\n# my-ghost-writer installed successfully..."
    runner
    exit 0
fi

if [ "$only_install" = "YES" ]; then
    installer
    echo -e "\n# my-ghost-writer installed successfully, exit!"
    exit 0
fi

echo -e "\n# Invalid option(s)."
display_help
exit 1
