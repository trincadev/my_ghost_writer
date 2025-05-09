import importlib.metadata


try:
    __version__ = importlib.metadata.version(__package__ or __name__)
except ImportError as e:
    print(f"metadata::e: {type(e)}, {e}: package installed?")
    __version__ = "1.0.0"
