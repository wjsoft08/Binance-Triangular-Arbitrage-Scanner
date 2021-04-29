import { getMarketsData } from "./exchange";
import { Market } from "ccxt";

export interface Ret {
  name: string;
  // Define m
  m: Record<string, unknown>;
  socket: WebSocket | undefined;
  update: [];
  pairupdate: string[];
  last: number;
  msgcount: number;
  heartbeat?: number;
  reset?: () => void;
}

export interface BookTicker {
  last: number;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
}

export default async function subscribe(
  params = ["!bookTicker"],
  filter = ["USDT", "BUSD"]
) {
  const marketsData: Record<string, Market> = <Record<string, Market>>(
    await getMarketsData()
  );
  const marketsIds: Record<string, string> = {};
  const marketsIdsR: Record<string, unknown> = {};

  Object.keys(marketsData).forEach((pair: string) => {
    // if (marketsData[pair].info.symbol.includes("DAI")) {
    marketsIds[marketsData[pair].info.symbol] = pair;
    marketsIds[pair] = marketsData[pair].info.symbol;
    // }
  });
  //   console.log("marketsIds");
  //   console.log(marketsIds);
  let tickersParams = params;
  tickersParams = params;
  if (params[0] !== "!bookTicker") {
    tickersParams = params
      .map((e: string) => marketsIdsR[e])
      .filter((e) => e)
      .map((e) => `${e.toLowerCase()}@bookTicker`);
  }

  console.log("tickersParams");
  console.log(tickersParams);
  const m = <Record<string, BookTicker>>{};

  const ret: Ret = {
    name: "binance",
    m,
    socket: undefined,
    update: [],
    pairupdate: [],
    last: +new Date(),
    msgcount: 0
  };

  const last = <Record<string, any>>{};
  function incoming(dataStr: any) {
    ret.msgcount += 1;
    const data = JSON.parse(dataStr.data);
    if (
      data.stream &&
      (data.stream.split("@")[1] === "bookTicker" ||
        data.stream === "!bookTicker")
    ) {
      const { u, s, b, a, B, A } = data.data;
      const volBid = parseFloat(B);
      const volAsk = parseFloat(A);

      if (!volBid || !volAsk || !A || !B) {
        delete m[s];
        return;
      }

      ret.last = +new Date();
      if (last[s] && u < last[s]) {
        delete m[s];
        return;
      }
      last[s] = u;
      let name: string = s;
      name = marketsIds[s];

      if (name !== undefined) {
        if (!ret.pairupdate.includes(name)) {
          ret.pairupdate.push(name);
        }

        m[name] = {
          last: ret.last,
          bidPrice: b,
          bidQty: B,
          askPrice: a,
          askQty: A
        };
      }
    }
  }

  function getSocket() {
    const ws = new WebSocket("wss://stream.binance.com/stream");

    ws.onopen = () => {
      console.log("binance socket connected");
      ws.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: tickersParams,
          id: 1
        })
      );
    };

    ws.onmessage = incoming;
    /*
	ws.on('ping', () => {
	  ws.pong();
	});
	ret.heartbeat = setInterval(() => {
	  if (ws.readyState === WebSocket.OPEN) {
		ws.ping();
	  }
	}, 5000);
	*/
    return ws;
  }

  ret.socket = getSocket();

  ret.socket.onclose = () => {
    Object.keys(ret.m).forEach((item) => {
      delete ret.m[item];
    });

    console.log("Binance WebSocket connection disconnected");
    clearInterval(ret.heartbeat);
    setTimeout(() => {
      ret.socket = getSocket();
    }, 100);
  };

  ret.reset = () => {
    ret.socket?.close();
  };
  return ret;
}
