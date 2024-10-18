import { gql, request } from "graphql-request";
import type { ChainEndpoints } from "../../adapters/types";
import { Adapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";

import { getTimestampAtStartOfDayUTC } from "../../utils/date";

const endpoints: ChainEndpoints = {
  [CHAIN.POLYGON_ZKEVM]:
    "https://api.studio.thegraph.com/query/46725/quickperp-subgraph/version/latest",
};
interface IFeeStat {
  cumulativeFeeUsd: string;
  feeUsd: string;
  id: string;
}

const fetch = (endpoint) => {
  return async (timestamp: number) => {
    const todaysTimestamp = getTimestampAtStartOfDayUTC(timestamp);
    const period = "daily";

    const graphQuery = gql`{
        feeStats(where: {timestamp: ${todaysTimestamp}, period: "${period}"}) {
          id
          timestamp
          period
          cumulativeFee
          cumulativeFeeUsd
          feeUsd
        }
      }`;

    const response = await request(endpoint, graphQuery);
    const feeStats: IFeeStat[] = response.feeStats;

    let dailyFeeUSD = BigInt(0);
    let totalFeeUSD = BigInt(0);

    feeStats.forEach((fee) => {
      dailyFeeUSD += BigInt(fee.feeUsd);
      totalFeeUSD += BigInt(fee.cumulativeFeeUsd);
    });

    const finalDailyFee = parseInt(dailyFeeUSD.toString()) / 1e30;
    const finalTotalFee = parseInt(totalFeeUSD.toString()) / 1e30;

    return {
      timestamp: todaysTimestamp,
      dailyFees: finalDailyFee.toString(),
      totalFees: finalTotalFee.toString(),
    };
  };
};

const adapter: Adapter = {
  version: 1,
  adapter: {
    [CHAIN.POLYGON_ZKEVM]: {
      fetch: fetch(endpoints[CHAIN.POLYGON_ZKEVM]),
      start: 1709251200,
      meta: {
        methodology: "All treasuryFee, poolFee and keeperFee are collected",
      },
    },
  },
};

export default adapter;