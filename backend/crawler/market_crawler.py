import requests

def get_market_data():

    url = "https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT"
    response = requests.get(url)
    data = response.json()

    markets = [{
        "symbol": data["symbol"],
        "price": data["price"]
    }]

    return markets