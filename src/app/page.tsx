import Image from "next/image";
import RealTimeChartTest from "../../components/RealTimeChart";

export default function Home() {
  return (
   <main  className="App" style={{ width: 800, height: 400 }}>
    <RealTimeChartTest />
   </main>
  );
}
