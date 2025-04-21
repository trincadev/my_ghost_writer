# My Ghost Writer

A simple helper for writers.

## Overview

[My Ghost Writer](https://github.com/trincadev/my_ghost_writer/) is a web application that analyzes text and provides word frequency statistics. It allows users to upload or type in a text, and then displays the most common words and their frequencies. The application uses natural language processing (NLP) techniques to stem words, making it easier to identify patterns and trends in the text.

## Features

* Analyze large texts and provide word frequency statistics
* Use NLP to stem words for more accurate results
* Support for uploading or typing in text
* User-friendly interface with a simple editor and display of word frequencies

## Technologies Used

* Python 3.10+ (FastAPI web framework)
* a Vanilla JavaScript frontend, [playwright](https://playwright.dev/) for E2E testing
* [`nltk`](https://www.nltk.org/) library for natural language processing
* [`structlog`](https://www.structlog.org/) for logging and error handling

## Getting Started

1. Clone the repository using `git clone`
2. Install the project dependencies using `poetry install`
3. Run the application using `uvicorn main:app --host 0.0.0.0 --port 7860`

## Contributing

Pull requests are welcome! Please make sure to test your changes thoroughly before submitting a pull request.

This project is still in its early stages, and there are many features that can be added to make it more useful for writers.

If you have any suggestions or would like to contribute to the project, please don't hesitate to reach out!
