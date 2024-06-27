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
    type: 'area',
    // height: 350,
    zoom: {
      enabled: false,
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
      show: false,
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
    enabled: false,
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    curve: 'straight',
    width: 1,
  },

  title: {
    text: 'Sol/USD Price',
    align: 'left',
  },
  xaxis: {
    type: 'datetime',
    // labels: {
    //   format: 'HH:mm', // Change this format as needed
    // }
    // tickAmount: 6,
    // range: seriesCount,
    // labels: {
    //   formatter: (val) => (seriesCount - Number(val)).toFixed(0) + 'X',
    // },
  },
  yaxis: {
    min: 0,
    // max: 100,
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

const getInitialSeries = async () => {
  const series: TSeriesData = [];

  const priceUpdates = await pythPriceServiceConnection.getLatestPriceFeeds(priceIds);
  if (!priceUpdates?.length) {
    // series.push({ x: new Date().getTime(), y: null});

    return [{ data: series }]
  }
  const priceFeed: PriceFeed = priceUpdates[0]
  const uncheckedPrice: Price = priceFeed.getPriceUnchecked();
  const uncheckedEmaPrice: Price = priceFeed.getEmaPriceUnchecked();

  const priceOracle = new OraclePrice({
    price: new BN(uncheckedPrice.price),
    exponent: new BN(uncheckedPrice.expo),
    confidence: new BN(uncheckedPrice.conf),
    timestamp: new BN(uncheckedPrice.publishTime),
  })

  // let init: number[];
  // if (initValues.length > seriesCount) {
  //   const len = initValues.length;
  //   init = initValues.slice(len - seriesCount, len);
  // } else {
  //   init = initValues;
  // }

  // const start = seriesCount - init.length;
  // for (let i = 1; i <= seriesCount; i++) {
  //   const diff = i - start - 1;
  series.push({ x: Number(priceOracle.timestamp.toString()) * 1000, y: Number(priceOracle.toUiPrice(2)) });
  // }
  return [{ data: series }];
};

type Props = {
  initValues: number[];
  valueRef: MutableRefObject<number | null>;
};

export function RealTimeChart() {
  const [series, setSeries] = useState<TSeries>([]);
  //const [series, setSeries] = useState<TSeries>([{ name: 'test', data: [] }]);
  const [options, setOptions] = useState<ApexOptions>(() => apexOptions);
  const needAdd = useRef(false);
  const needSlice = useRef(false);

  // useEffect(() => {
  //   (async () => {
  //     const data = await getInitialSeries()
  //     setSeries(data)

  //   }
  //   )()
  // }, [])

  const setAnimation = useCallback<(value: boolean) => void>(
    (value) => {
      const newOption = {
        ...options,
        chart: {
          ...options.chart,
          animations: { ...options.chart?.animations, enabled: value },
        },
      };
      setOptions(newOption);
    },
    [options]
  );

  const addData = useCallback(async (priceFeed: PriceFeed) => {


    try {
      const uncheckedPrice: Price = priceFeed.getPriceUnchecked();
      const uncheckedEmaPrice: Price = priceFeed.getEmaPriceUnchecked();

      const priceOracle = new OraclePrice({
        price: new BN(uncheckedPrice.price),
        exponent: new BN(uncheckedPrice.expo),
        confidence: new BN(uncheckedPrice.conf),
        timestamp: new BN(uncheckedPrice.publishTime),
      })


      const localDate = new Date(priceOracle.timestamp.toString() * 1000); // Convert seconds to milliseconds

      // Format the date to a readable string
      const formattedDate = localDate.toLocaleString();

      console.log(priceOracle.toUiPrice(2));
      console.log(priceOracle.timestamp.toString())
      console.log(`Timestamp (local date): ${formattedDate}`);




      let locDt;
      if(!series.length){
        const seriesLoc:TSeries = await getInitialSeries()
        locDt=seriesLoc[0]?.data
      }else{
        locDt= series[0]?.data
      }
      let dt = [...locDt];
      // dt.forEach((x) => x.x--);
      dt.push({ x: Number(priceOracle.timestamp.toString()) * 1000, y: Number(priceOracle.toUiPrice(2)) });
      // 차트 포인트 없애기 위해 조기화
      //이걸 넣으니 시리즈 slice시 챠트 새로고침 현상 발생하여 삭제
      //dt[0].y = 0;
      // console.log(dt.length);

      setSeries([{ data: [...dt] }]);





      // Check if the timestamp already exists

      console.log(series)

      // 차트 포인트 없애기 위해 조기화
      //이걸 넣으니 시리즈 slice시 챠트 새로고침 현상 발생하여 삭제
      //dt[0].y = 0;
      console.log(dt.length);

      setSeries([{ data: [...dt] }]);

    } catch (error) {
      console.log(error)
    }

    // const priceUpdates = await pythPriceServiceConnection.getLatestPriceFeeds(priceIds);
    // const priceFeed: PriceFeed = priceUpdates[0]

  }, [series]);

  useEffect(() => {
    const timer = setInterval(() => {
      const len = series[0]?.data.length ?? 0 // ;
      if (len > seriesCount * 2) {

        //1
        // The data to be added this time will be added after the data has been cut. -> 4 times
        needSlice.current = true;
        setAnimation(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [addData, series, setAnimation]);

  useEffect(() => {
    const aniEnable = options.chart?.animations?.enabled;

    if (!aniEnable) {
      if (needSlice.current) {
        needSlice.current = false;

        let dt = [...series[0].data];
        // 2. The data is cut when the animation is stopped.
        dt = dt.slice(seriesCount, dt.length);
        const newSeries = { ...series[0], data: dt };
        setSeries([newSeries]);
      } else {
        //  3. After the animation was stopped, the data was cut and updated with the series.
        // Set the flag to replay the animation again and save the previously unsaved data
        needAdd.current = true;
        setAnimation(true);
      }
    } else {
      //// 4. Add the data that you didn't want to add to the series.


    }
  }, [addData, options.chart?.animations?.enabled, series, setAnimation]);

  useEffect(() => {


    pythPriceServiceConnection.subscribePriceFeedUpdates(priceIds, (priceFeed: PriceFeed) => {


      addData(priceFeed)



    })
  }, [])



  return <ReactApexChart options={options} series={series} type="line" />;
}

export default function RealTimeChartTest() {
  //const initValues = [50, 50, 50, 10];
  //const lastValue = 50;


  return <RealTimeChart  />;
}
