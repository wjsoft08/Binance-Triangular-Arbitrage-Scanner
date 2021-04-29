import { getWithExpiry, setWithExpiry } from "./localstorage-cache";
import ccxt, { Market, Ticker, binance } from "ccxt";
declare global {
  interface Window {
    ccxt: any;
  }
}
const binanceApi: binance = new ccxt.binance();

export async function getMarketsData() {
  console.log("getMarketsData Triggered");
  let marketsData: Record<string, Market | Ticker> | null = getWithExpiry(
    "marketsData"
  );
  if (!marketsData) {
    marketsData = await binanceApi.loadMarkets();
    setWithExpiry("marketsData", marketsData, 1000 * 60 * 5);
  }

  return marketsData;
}

export async function getTickersData() {
  let tickersData: Record<string, Market | Ticker> | null = getWithExpiry(
    "tickersData"
  );
  if (!tickersData) {
    tickersData = await binanceApi.fetchTickers();
    setWithExpiry("tickersData", tickersData, 1000 * 60 * 30);
  }

  return tickersData;
}
