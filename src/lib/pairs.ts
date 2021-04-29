import { getMarketsData } from "./exchange";
import ccxt, { Market, Ticker } from "ccxt";

export default async function () {
  const dict = <Record<string, string[]>>{};
  const marketsData: Record<string, Market> = <Record<string, Market>>(
    await getMarketsData()
  );
  Object.keys(marketsData).forEach((item: string) => {
    if (!marketsData[item].active || !marketsData[item].spot) {
      delete marketsData[item];
    }
  });

  const pairToMarket = <Record<string, string>>{};

  // Construction All Pairs in string
  // Filter wanted pairs here in future
  Object.keys(marketsData).forEach((e: string) => {
    const [p1, p2] = e.split("/");
    pairToMarket[e] = e;
    pairToMarket[`${p2}/${p1}`] = e;
  });

  // Construct Dict of all the pairs in array given a coin
  Object.keys(marketsData)
    .map((e) => e.split("/"))
    .flat()
    .forEach((e) => {
      const els = Object.keys(marketsData).filter(
        (elM) => marketsData[elM].base === e || marketsData[elM].quote === e
      );
      if (els.length > 0) {
        dict[e] = els;
      }
    });

  // pairs = all triangular conbinations
  // Modify this part for my abitrage algorith in future
  const pairs: string[][] = [];
  const hash = <Record<string, number[]>>{};
  const hashMarket = <Record<string, number[]>>{};

  Object.keys(dict).forEach((p1) => {
    dict[p1].forEach((e) => {
      const _p = e.split("/");
      const p2 = _p[0] === p1 ? _p[1] : _p[0];
      if (!dict[p2]) {
        return;
      }
      dict[p2]
        .filter((el) => el !== `${p1}/${p2}` && el !== `${p2}/${p1}`)
        .forEach((e2) => {
          const _p = e2.split("/");
          const p3 = _p[0] === p2 ? _p[1] : _p[0];
          if (!dict[p3]) {
            return;
          }
          if (
            dict[p3].filter(
              (el) => el === `${p1}/${p3}` || el === `${p3}/${p1}`
            ).length
          ) {
            pairs.push([p1, p2, p3, p1]);
            const id = pairs.length - 1;
            [p1, p2, p3].forEach((p) => {
              hash[p] = hash[p] || [];
              hash[p].push(id);
            });

            let symbol = pairToMarket[`${p1}/${p2}`];
            hashMarket[symbol] = hashMarket[symbol] || [];
            hashMarket[symbol].push(id);
            symbol = pairToMarket[`${p2}/${p3}`];
            hashMarket[symbol] = hashMarket[symbol] || [];
            hashMarket[symbol].push(id);
            symbol = pairToMarket[`${p1}/${p3}`];
            hashMarket[symbol] = hashMarket[symbol] || [];
            hashMarket[symbol].push(id);
          }
        });
    });
  });
  // console.log("pairs");
  // console.log(pairs);
  // console.log(hash);
  // console.log(hashMarket);

  function intersect(...arrs) {
    if (arrs.length > 2) {
      return intersect(arrs[0], intersect(...arrs.slice(1)));
    }
    return arrs[0].filter((value) => arrs[1].includes(value));
  }

  // // .map(e => pairs[e])
  // console.log((intersect(hash.BNB, hash.BTC, hash.USDT).map(e => pairs[e])))
  // console.log((intersect(intersect(hash.BNB, hash.BTC), hash.USDT).map(e => pairs[e])))

  function kCombinations(set, k) {
    let i;
    let j;
    let combs;
    let head;
    let tailcombs;

    // There is no way to take e.g. sets of 5 elements from
    // a set of 4.
    if (k > set.length || k <= 0) {
      return [];
    }

    // K-sized set has only one K-sized subset.
    if (k === set.length) {
      return [set];
    }

    // There is N 1-sized subsets in a N-sized set.
    if (k === 1) {
      combs = [];
      for (i = 0; i < set.length; i += 1) {
        combs.push([set[i]]);
      }
      return combs;
    }

    combs = [];
    for (i = 0; i < set.length - k + 1; i += 1) {
      // head is a list that includes only our current element.
      head = set.slice(i, i + 1);
      // We take smaller combinations from the subsequent elements
      tailcombs = kCombinations(set.slice(i + 1), k - 1);
      // For each (k-1)-combination we join it with the current
      // and store it to the set of k-combinations.
      for (j = 0; j < tailcombs.length; j += 1) {
        combs.push(head.concat(tailcombs[j]));
      }
    }
    return combs;
  }

  // .map(e => pairs[e])

  return {
    dict,
    hash,
    pairs,
    coinGroups: function coinGroups(coins) {
      return kCombinations(coins, 3);
    },
    intersect,
    ids2pair: function ids2pair(ids) {
      return ids.map((e) => pairs[e]);
    },

    pairToMarket,
    hashMarket
  };
}
