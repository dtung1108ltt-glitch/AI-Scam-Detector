def extract_features(tx):

    features = {}

    features["amount"] = tx["amount"]

    features["note_length"] = len(tx["note"])

    features["address_length"] = len(tx["to_address"])

    return list(features.values())