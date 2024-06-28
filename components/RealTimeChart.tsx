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


const seriesCount = 530;

const apexOptions: ApexOptions = {
  chart: {
    type: 'line',
    // height: 350,
    zoom: {
      enabled: true,
      type:'xy'
    },
    animations: {
      enabled: true,
      easing: 'linear',
      // dynamicAnimation: {
      //   enabled: true,
      //   speed: 1000,
      // },
    },
    toolbar: {
      show: true,
    },
  },
  annotations: {
    yaxis: [
      {
        y: 60,
        borderColor: '#00E396',
        // label: {
        //   borderColor: '#00E396',
        //   style: {
        //     color: '#fff',
        //     background: '#00E396',
        //   },
        //   text: 'Y-axis annotation on 8800',
        // },
      },
    ],
  },
  tooltip: {
    enabled: true,
    // x:{
    //   show: true
    // },
    onDatasetHover:{
      highlightDataSeries: true
    }
  },
  // dataLabels: {
  //   enabled: true,
  //   distributed:true
  // },
  stroke: {
    curve: 'smooth',
    width: 1,
  },

  title: {
    text: 'Sol/USD Price',
    align: 'left',
  },
  xaxis: {
    type: 'datetime',
    labels: {
      // datetimeUTC: false,
      // formatter: function (val) {
      //   return new Date(val).toLocaleTimeString('en-US', {
      //     minute: '2-digit',
      //     second: '2-digit',
      //   });
      // },
      // datetimeFormatter: {
      //   minute: 'HH:mm',
      // },
    },
  },
  yaxis: {
    // min: 100,
    // max: 165,
    labels: {
      formatter: (val) => val.toFixed(2),
    },
    title: { text: 'Sol/USD ' },
    // floating: true
    // opposite: true,
  },
  legend: {
    horizontalAlign: 'left',
  },
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
        // Ensure the series data array does not exceed 60 items
        if (newData.length > seriesCount) {
          newData.shift(); // Remove the oldest item
        }
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
