import pickle


def pickle_load(path: str, mode: str = "rb"):
    with open(path, mode) as f:
        return pickle.load(f)


def pickle_dump(value, path: str, mode: str = "wb"):
    with open(path, mode) as file:
        pickle.dump(value, file)
