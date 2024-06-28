'use client'
import { BN } from '@coral-xyz/anchor';
import { Price, PriceFeed, PriceServiceConnection } from '@pythnetwork/price-service-client';
import { ApexOptions } from 'apexcharts';
import { OraclePrice } from 'flash-sdk';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
const hermesUrl = 'https://hermes.pyth.network'

import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });


const priceIds = [
  // You can find the ids of prices at https://pyth.network/developers/price-feed-ids
  "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d", // BTC/USD price id
];

const pythPriceServiceConnection = new PriceServiceConnection(hermesUrl, {
  priceFeedRequestConfig: {
    // Provide this option to retrieve signed price updates for on-chain contracts.
    // Ignore this option for off-chain use.
    binary: true,
  },
})


const seriesCount = 60;

const apexOptions: ApexOptions = {
  chart: {
    type: 'line',
    zoom: {
      enabled: true,
      type: 'xy'
    },
    animations: {
      enabled: true,
      easing: 'linear',
        dynamicAnimation: {
        enabled: true,
        speed: 1000,
      },
    },
    toolbar: {
      show: true,
    },
  },
  annotations: {
    yaxis: [
      {
        // y: 60,
        borderColor: '#00E396',
      },
    ],
  },
  tooltip: {
    enabled: true,
    onDatasetHover: {
      highlightDataSeries: true
    }
  },
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  title: {
    text: 'Sol/USD Price',
    align: 'left',
  },
  xaxis: {
    type: 'datetime',
  },
  yaxis: {
    labels: {
      formatter: (val) => val.toFixed(2),
    },
    title: { text: 'Sol/USD ' },
    stepSize:1
  },
  legend: {
    horizontalAlign: 'left',
  },
  fill:{
    type: 'solid'
  }
};

type TSeriesData = { x: number; y: number | null }[];
type TSeries = { data: TSeriesData }[];


export function RealTimeChart() {
  const [series, setSeries] = useState<TSeries>([]);
  const [options, setOptions] = useState<ApexOptions>(() => apexOptions);

  const addData = async (priceFeed: PriceFeed) => {
    try {
      const uncheckedPrice: Price = priceFeed.getPriceUnchecked();

      const priceOracle = new OraclePrice({
        price: new BN(uncheckedPrice.price),
        exponent: new BN(uncheckedPrice.expo),
        confidence: new BN(uncheckedPrice.conf),
        timestamp: new BN(uncheckedPrice.publishTime),
      })

      const localDate = new Date(priceOracle.timestamp.toString() * 1000); // Convert seconds to milliseconds

      const dataPt = {
        x: Number(priceOracle.timestamp.toString()) * 1000,
        y: Number(priceOracle.toUiPrice(2)),
      };

      setSeries((prevSeries) => {
        const newData = [...(prevSeries[0]?.data || []), dataPt];
        // Ensure the series data array does not exceed 120 items
        if (newData.length > seriesCount) {
          newData.shift(); // Remove the oldest item
        }

        // Calculate min and max values
        const prices: any = newData.map(d => d.y);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        // const yAxisMin = minPrice - (minPrice * 0.01);
        // const yAxisMax = maxPrice + (maxPrice * 0.01);
        const yAxisMin = Math.floor(minPrice-0.5)
        const yAxisMax = Math.ceil(maxPrice+0.5) 




        setOptions((prevOptions) => {
          if (prevOptions.yaxis?.min === yAxisMin && prevOptions.yaxis?.max == yAxisMax) {
            return prevOptions;
          }

          return {
            ...prevOptions,
            yaxis: {
              ...prevOptions.yaxis,
              min: yAxisMin,
              max: yAxisMax,
              
              
            },
          };
        });

        return [{ data: newData }];
      });

    } catch (error) {
      console.log(error)
    }
  };

  useEffect(() => {
    pythPriceServiceConnection.subscribePriceFeedUpdates(priceIds, (priceFeed: PriceFeed) => {
      addData(priceFeed)
    })
  }, [])


  return <ReactApexChart options={options} series={series} type="line" />;
}

export default function RealTimeChartTest() {
  return <RealTimeChart />;
}