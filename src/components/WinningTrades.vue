<template>
  <div class="winningTrades">
    <h1 v-if="winningTrades.length > 0">Winning Trades</h1>
    <div v-for="(item, key) in winningTrades" v-bind:key="key">
      <div class="chain">
        <h4>
          Chain: {{ item.chain[0] }} → {{ item.chain[1] }} →
          {{ item.chain[2] }} → {{ item.chain[3] }}
        </h4>
        <div class="trade" v-for="(o, key) in item.orders" v-bind:key="key">
          <div v-if="o.side === 'buy'">
            Use {{ o.total }}
            <b style="color: black">{{ o.market.split("/")[1] }}</b>
            to <b style="color: #02c076">BUY</b> {{ o.amount }}
            <b style="color: black">{{ o.market.split("/")[0] }}</b>
            in market {{ o.market }} @{{ o.price }}
            <b style="color: black">{{ o.market.split("/")[1] }}</b>
          </div>

          <div v-else-if="o.side === 'sell'">
            <b style="color: #f84960">SELL</b> {{ o.amount }}
            <b style="color: black">{{ o.market.split("/")[0] }}</b>
            to get {{ o.total }}
            <b style="color: black">{{ o.market.split("/")[1] }}</b>
            in market
            {{ o.market }} @{{ o.price }}
            <b style="color: black">{{ o.market.split("/")[1] }}</b>
          </div>
        </div>
        <h4 />
        Total profit (counting all binance BNB fees)
        {{ item.profit.sub(1).mul(100).toFixed(4) }}%
        <h4 />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { BookTicker, Socket } from "../contracts";

export interface WinningTrade {
  pairslen: number;
  msgcount: number;
  cycleschecked: number;
  cyclescheckedPerSecond: number;
  currentStatus: string;
  socket?: Socket;
}

@Component
export default class WinningTrades extends Vue {
  @Prop() private winningTrades!: any[];

  mounted() {
    console.log("mounted");
    console.log("winningTrades");
    console.log(this.winningTrades);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.winningTrades {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.chain {
  border-color: black;
  border-width: 1px;
  border-style: solid;
  margin: 10px;
  width: fit-content;
  align-self: center;
  justify-content: center;
  padding: 10px;
}
</style>
