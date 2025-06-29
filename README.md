# My Ghost Writer

A simple helper for writers.

## Overview

[My Ghost Writer](https://github.com/trincadev/my_ghost_writer/) is a web application that analyzes text and provides words frequency statistics. It allows users to upload or type in a text, and then displays the most common words, their frequencies and their position with the text editor. The application uses natural language processing (NLP) techniques to stem words, making it easier to identify patterns and trends in the text.

## Features

* Analyse large texts and provide words frequency statistics
* Use NLP to stem words for more accurate results
* Support for uploading or typing in text
* User-friendly interface with a simple editor and display of word frequencies
* WIP: thesaurus, powered by [wordsapi](https://www.wordsapi.com/) (you need to get your own wordsapi API key)

## Technologies Used

* Python 3.10+ (FastAPI web framework)
* a Vanilla JavaScript frontend, [playwright](https://playwright.dev/) for E2E testing
* [`nltk`](https://www.nltk.org/) library for natural language processing
* [`structlog`](https://www.structlog.org/) for logging and error handling

## Getting Started

In a Linux/WSL environment (I didn't tried with MacOS or Windows):

1. Clone the repository using `git clone https://github.com/trincadev/my_ghost_writer`, `cd my_ghost_writer`
2. Create a [virtualenv](https://virtualenv.pypa.io/en/latest/user_guide.html) and install the project dependencies using an existing python version with

   * [poetry](https://python-poetry.org/) (`poetry env use 3.12.10`, `poetry install`, `eval $(poetry env activate)`)
   * `python -m venv .venv`, `source .venv/bin/activate`, `pip install -r requirements.txt` (and the other requirements files if you need also the webserver and/or the test environment)

3. Run the application using:
   * `python my_ghost_writer/app.py` using the python app.py file path
   * `python -m ghost_writer.app.py` using the python module

### Run as a python module

If using the webserver with the module (`python -m ghost_writer.app.py`) it's necessary one of these env variables:

* `STATIC_FOLDER` to define a custom path for the static folder. Probably you should also download the static files:
  * `index.html`
  * `index.js`
  * `index.css`
* `API_MODE` to avoid mounting the static folder. This will define only the API endpoints
  * `/health`
  * `/health-mongo`
  * `/words-frequency`
  * `/thesaurus-wordsapi`

### Installation script

An alternate way to use the project is installing it using `install.sh`. e.g.

```bash
bash ./install.sh
```

If you want to run my custom frontend using this script (available on default on port 7860):

1. use the install-only option
2. define a custom path for `STATIC_FOLDER` and use it for the module execution:

```bash
# run the script with the install-only option
bash install.sh -i

# run the python module with the custom STATIC_FOLDER env variable, e.g.
# if you already created STATIC_FOLDER within the current directory with the needed files within, see above
export STATIC_FOLDER=$PWD/static
python -m my_ghost_writer.app
```

## Local mongodb needed for the thesaurus feature

To run a local mongodb instance on your local environment, you can use this docker command:

```
docker run --env=MONGO_MAJOR=8.0 \
--env=HOME=/data/db --volume=${LOCAL_MONGO_FOLDER}:/data -p 27017:27017 \
--volume=/data/configdb --volume=/data/db --network=bridge --restart=always \
-d mongo:8-noble
```

## Docker

To build the project with docker:

```
DOCKER_VERSION=$(grep version pyproject.toml |head -1|cut -d'=' -f2|cut -d'"' -f2);
docker build . --progress=plain --tag registry.gitlab.com/aletrn/my_ghost_writer:${DOCKER_VERSION}
docker build . -f dockerfiles/dockerfile_my_ghost_writer_base  --progress=plain --tag registry.gitlab.com/aletrn/my_ghost_writer_base:${DOCKER_VERSION}
```

To run the docker container (you still need to configure the mongodb endpoint to use the single my_ghost_writer container):
```
docker run -d --name my_ghost_writer -p 7860:7860 -e WORDSAPI_KEY=${WORDSAPI_KEY} -e ME_CONFIG_MONGODB_USE_OK=TRUE registry.gitlab.com/aletrn/my_ghost_writer:0.4.0; docker logs -f my_ghost_writer
```

To source more than one env variable, you can use this command:
```
set -o allexport && source <(cat ./.env) && set +o allexport;
```

Instead to simple

## Contributing

Pull requests are welcome! Please make sure to test your changes thoroughly before submitting a pull request.

This project is still in its early stages, and there are many features that can be added to make it more useful for writers.

If you have any suggestions or would like to contribute to the project, please don't hesitate to reach out!
