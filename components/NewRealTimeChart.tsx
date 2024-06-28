
'use client'
import React, { useEffect, useState } from 'react'
// import Chart from 'react-apexcharts'

import dynamic from "next/dynamic";
import { PriceFeed, PriceServiceConnection } from '@pythnetwork/price-service-client';
import { create } from 'zustand'

const l = [[Date.now(), getRandomInt(1, 10)]];

type Store = {
    data: number[][]
    append: (dataPoint: number[]) => void
}

const useDataStore = create<Store>()((set) => ({
  data: [[Date.now()-10000, 145]],
  append: (dataPoint: number[]) => set((state) => {
    // only have the last 100 items in the list
    return ({ data: [...state.data, dataPoint].slice(-100) })
  }),
}))

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const hermesUrl = 'https://hermes.pyth.network'

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


const options = {

    series: [
        {
            name: "High - 2013",
            data: [28, 29, 33, 36, 32, 32, 33]
        },
        {
            name: "Low - 2013",
            data: [12, 11, 14, 18, 17, 13, 13]
        }
    ],
    options: {
        chart: {
            height: 350,
            type: 'line',
            dropShadow: {
                enabled: true,
                color: '#000',
                top: 18,
                left: 7,
                blur: 10,
                opacity: 0.2
            },
            zoom: {
                enabled: false
            },
            toolbar: {
                show: false
            }
        },
        colors: ['#77B6EA', '#545454'],
        dataLabels: {
            enabled: true,
        },
        stroke: {
            curve: 'smooth'
        },
        title: {
            text: 'Average High & Low Temperature',
            align: 'left'
        },
        grid: {
            borderColor: '#e7e7e7',
            row: {
                colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
                opacity: 0.5
            },
        },
        markers: {
            size: 1
        },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            title: {
                text: 'Month'
            }
        },
        yaxis: {
            title: {
                text: 'Temperature'
            },
            min: 5,
            max: 40
        },
        legend: {
            position: 'top',
            horizontalAlign: 'right',
            floating: true,
            offsetY: -25,
            offsetX: -5
        }
    },
};

function getRandomInt(min: number, max: number) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export const NewRealTimeChart = () => {

    
    const kdata = [
        [1719560317766, 30.95],
        [1719560319770, 31.34],
        [1719560321772, 31.18],
        [1719560323774, 31.05],
    ];
    
    // const [data, setData] = useState([[Date.now(), getRandomInt(1, 10)]]);
    const { data, append } = useDataStore()
    const [minMax, setMinMax] = useState({min: 0, max: 0});

    const ok: ApexCharts.ApexOptions = {
        
        series: [{
            data: data
        }],
        chart: {
            id: 'realtime',
            height: '100vh',
            width: '100vw',
            type: 'line',
            animations: {
                enabled: false,
                easing: 'linear',
                dynamicAnimation: {
                    speed: 100
                }
            },
            toolbar: {
                show: false
            },
            // zoom: {
            //     type: 'x',
            //     enabled: true,
            //     autoScaleYaxis: true
            // },
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        },
        title: {
            text: 'Dynamic Updating Chart',
            align: 'left'
        },
        markers: {
            size: 0
        },
        xaxis: {
            type: 'datetime',
            
            // range: XAXISRANGE,
        },
        yaxis: {
            // max: 100
            min: minMax.min !== 0 ? minMax.min: undefined,
            max: minMax.max !== 0 ? minMax.max: undefined,

        },
        legend: {
            show: false
        },
        tooltip: {
            x: {
                format: 'HH:mm:ss' // Adjusted to show hours, minutes, seconds
            }
        },
    };
    
    useEffect(() => {
        // console.log('data :>> ', useDataStore.getState().data);

        pythPriceServiceConnection.subscribePriceFeedUpdates(priceIds, (priceFeed: PriceFeed) => {
            // addData(priceFeed)
            // console.log('priceFeed.getPriceUnchecked().price :>> ', priceFeed.getPriceUnchecked().publishTime*1000);
            // console.log('priceFeed.getPriceUnchecked().price :>> ', priceFeed.getPriceUnchecked().getPriceAsNumberUnchecked());
            const price = Number(priceFeed.getPriceUnchecked().getPriceAsNumberUnchecked().toFixed(5));
            let val = [priceFeed.getPriceUnchecked().publishTime * 1000, price]
            // console.log('data :>> ', useDataStore.getState().data);
           
            append(val);
            // let array = [...data, val]
            // setData(array);

            // if(useDataStore.getState().data.length > 10) {
            //     pythPriceServiceConnection.unsubscribePriceFeedUpdates(priceIds)
            // }
        })
    }, [])

    useEffect(() => {
      setInterval(() => {
        const latestPrice = useDataStore.getState().data[useDataStore.getState().data.length-1][1];
          console.log(' latestPrice * 0.99, :>> ', latestPrice + 1, latestPrice - 1);
        setMinMax({
            min: latestPrice - 0.4,
            max: latestPrice + 0.4,
        })
      }, 5000);
    
      return () => {
        
      }
    }, [])
    

    // useEffect(() => {
    //     const interval = setInterval(() => {
    //         const val = [Date.now(), getRandomInt(1, 10)];
    //         // console.log('val :>> ', val);
    //         let array = [...data, val]
    //         // array.shift();
    //         // console.log('array :>> ', array);
    //         append(val);
    //     }, 2000);
    //     return () => {
    //         window.clearInterval(interval); // clear the interval in the cleanup function
    //     };
    // }, []);


    return (
        <Chart options={ok} series={ok.series} type="line" width={'100%'} height={'100%'} />
    )
}
