# My Ghost Writer

A simple helper for writers.

## Overview

[My Ghost Writer](https://github.com/trincadev/my_ghost_writer/) is a web application that analyzes text and provides words frequency statistics. It allows users to upload or type in a text, and then displays the most common words, their frequencies and their position with the text editor. The application uses natural language processing (NLP) techniques to stem words, making it easier to identify patterns and trends in the text.

## Features

* Analyse large texts and provide words frequency statistics
* Use NLP to stem words for more accurate results
* Support for uploading or typing in text
* User-friendly interface with a simple editor and display of word frequencies

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

If using the webserver with the module (`python -m ghost_writer.app.py`) it's necessary one of these env variables:

* `STATIC_FOLDER` to define a custom path for the static folder. Probably you should also download the static files:
  * `index.html`
  * `index.js`
  * `index.css`
* `API_MODE` to avoid mounting the static folder. This will define only the API endpoints
  * `/health`
  * `/words-frequency`

## Contributing

Pull requests are welcome! Please make sure to test your changes thoroughly before submitting a pull request.

This project is still in its early stages, and there are many features that can be added to make it more useful for writers.

If you have any suggestions or would like to contribute to the project, please don't hesitate to reach out!
