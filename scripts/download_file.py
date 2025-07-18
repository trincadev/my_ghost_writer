import requests
import sys


if __name__ == '__main__':
    url = sys.argv[1]
    filename = sys.argv[2]

    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise an exception for HTTP errors

        print(f"saving file to '{filename}'")
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Successfully downloaded '{filename}' from '{url}'")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading the file: '{e}'")
        sys.exit(1)
