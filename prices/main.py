from fastapi import FastAPI
import yfinance as yf

app = FastAPI()


@app.get("/price/{ticker}")
async def get_ticker_price(ticker):
    price = yf.Ticker(ticker).info["currentPrice"]
    return {
        "price": price,
    }
