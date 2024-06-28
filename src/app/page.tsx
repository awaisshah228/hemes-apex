import Image from "next/image";
import RealTimeChartTest from "../../components/RealTimeChart";
import { NewRealTimeChart } from "../../components/NewRealTimeChart";

export default function Home() {
  return (
   <main  className="App" style={{ width: 800, height: 600 }}>
    {/* <RealTimeChartTest /> */}
    <NewRealTimeChart />
   </main>
  );
}
