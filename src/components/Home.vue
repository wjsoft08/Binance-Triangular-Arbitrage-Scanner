<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <h1>{{ info.currentStatus }}</h1>
    <h1>Total combinations: {{ info.pairslen }} pairs</h1>
    <h1>Socket updates per second: {{ info.msgcount }}</h1>
    <h1>Combinations checked per second: {{ info.cyclescheckedPerSecond }}</h1>
    <h4 v-bind:key="index" v-for="(item, index) in bookTicker">{{ item }}</h4>
    <WinningTrades :winningTrades="winners" />
    <!-- <h1>{{ m }}</h1> -->
    <h4 v-for="(item, key) in m" v-bind:key="key">
      {{ key }} - Ask Price: {{ item.askPrice }} Bid Price: {{ item.bidPrice }}
    </h4>
    <!-- <button @click="incrementCounter">Press Me</button> -->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import dayjs from "dayjs";
import socketSubscribe from "../lib/socket";
import buildPairs from "../lib/pairs";
import buildProfitFunc from "../lib/profit";
import WinningTrades from "./WinningTrades.vue";
import { BookTicker, Socket } from "../contracts";

export interface Info {
  pairslen: number;
  msgcount: number;
  cycleschecked: number;
  cyclescheckedPerSecond: number;
  currentStatus: string;
  socket?: Socket;
}

@Component({
  components: {
    WinningTrades
  }
})
export default class Home extends Vue {
  @Prop() private msg!: string;
  m = {};

  bookTicker: BookTicker[] = [];

  info: Info = {
    pairslen: 0,
    msgcount: 0,
    cycleschecked: 0,
    cyclescheckedPerSecond: 0,
    currentStatus: "",
    socket: undefined
  };

  oldWinners = [];
  winners = [];
  tops = [];

  checkProfit: any;

  mounted() {
    console.log("mounted");
    const start = async () => {
      console.log("start");
      const socket = await socketSubscribe();
      const { hashMarket, pairs: allPairs } = await buildPairs();
      console.log("socket");
      console.log(socket);

      this.info.currentStatus = "Connecting to binance";
      this.info.pairslen = allPairs.length;
      this.info.socket = socket;
      setInterval(() => {
        this.info.msgcount = socket.msgcount;
        socket.msgcount = 0;
        this.info.cyclescheckedPerSecond = this.info.cycleschecked;
        this.info.cycleschecked = 0;
      }, 1000);

      this.checkProfit = await buildProfitFunc();

      const tick = () => {
        if (this.info.currentStatus === "Connecting to binance") {
          if (this.info.msgcount > 0) {
            this.info.currentStatus = "Working";
          }
        } else {
          this.info.currentStatus = "Working";
        }
        if (this.info.socket?.m) {
          this.m = this.info.socket?.m;
        }
        const startTime = +new Date();
        const uPair = socket.pairupdate;
        const markets = socket.m;
        socket.pairupdate = [];
        let pairsToTestHash: number[] = uPair
          .map((pair) => hashMarket[pair])
          .flat();
        let pairsToTest: string[][] = [...new Set(pairsToTestHash)]
          .map((id) => allPairs[id])
          .filter((e) => e);

        if (!pairsToTest.length) {
          setTimeout(tick, 50);
          return;
        }
        // const pairsToTest = allPairs.filter(p => intersect(p, u).length)
        let ret;
        try {
          this.info.cycleschecked += pairsToTest.length;
          ret = this.checkProfit(pairsToTest, markets);
          ret.sort((a, b) => b.profit.sub(a.profit));
          const w = ret.filter((e) => e.profit.gt(1));
          if (w.length) {
            this.winners = w;
            console.log(this.winners);
            w.forEach((e) => {
              e.time = dayjs().format();
              for (let k = 0; k < e.length - 1; k += 1) {
                delete socket.m[e[k] + "/" + e[k + 1]];
                delete socket.m[e[k + 1] + "/" + e[k]];
              }
            });
          }
        } catch (err) {
          console.error(err);
          console.log(pairsToTest);
        }

        console.log("cycle", +new Date() - startTime, "ms");
        if (this.winners.length) {
          console.log(this.winners);
          this.info.currentStatus = "Profitable cycles found!";
          // halt 30 seconds
          setTimeout(() => {
            this.info.currentStatus = "Working";
            this.oldWinners = this.winners;
            this.winners = [];
            tick();
          }, 1000 * 10);
          return;
        }
        this.tops = ret.slice(0, 10);
        setTimeout(tick, 50);
      };
      setTimeout(tick, 1000);
      // return () => {};
    };
    start();
  }
}
</script>

<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
