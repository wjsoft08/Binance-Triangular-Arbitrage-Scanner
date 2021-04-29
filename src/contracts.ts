export interface Socket {
  name: string;
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
