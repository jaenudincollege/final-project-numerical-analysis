import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import Papa from "papaparse";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./App.css";

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const App = () => {
  const [data, setData] = useState([]);
  const [provinsi, setProvinsi] = useState("");
  const [jenjang, setJenjang] = useState("");
  const [predictionYears, setPredictionYears] = useState(1);
  const [filteredData, setFilteredData] = useState([]);
  const [years, setYears] = useState([]);
  const [values, setValues] = useState([]);
  const [predictedValues, setPredictedValues] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/data.csv");
      const text = await response.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setData(
            result.data.map((row) => ({
              Provinsi: row.Provinsi.trim(),
              "Jenjang Pendidikan": row["Jenjang Pendidikan"].trim(),
              Tahun: parseInt(row.Tahun, 10),
              "Tingkat Penyelesaian": parseFloat(row["Tingkat Penyelesaian"]),
            }))
          );
        },
      });
    };
    fetchData();
  }, []);

  const provinsiList = Array.from(new Set(data.map((d) => d.Provinsi))).sort();
  const jenjangList = ["SD", "SMP", "SMA"];

  const filterData = () => {
    const filtered = data.filter(
      (d) => d.Provinsi === provinsi && d["Jenjang Pendidikan"] === jenjang
    );

    if (filtered.length === 0) {
      setFilteredData([]);
      setYears([]);
      setValues([]);
      setPredictedValues([]);
      return;
    }

    const x = filtered.map((d) => d.Tahun).sort((a, b) => a - b);
    const y = filtered.map((d) => d["Tingkat Penyelesaian"]);

    const regression = calculateLinearRegression(x, y);
    const futureYears = Array.from(
      { length: predictionYears },
      (_, i) => Math.max(...x) + i + 1
    );
    const futurePredictions = futureYears.map(
      (year) => regression.slope * year + regression.intercept
    );

    setFilteredData(filtered);
    setYears([...x, ...futureYears]);
    setValues([...y, ...futurePredictions]);
    setPredictedValues(futurePredictions);
  };

  const calculateLinearRegression = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  };

  useEffect(() => {
    if (provinsi && jenjang) {
      filterData();
    }
  }, [provinsi, jenjang, predictionYears, data]);

  return (
    <div className="App">
      <header>
        <h1>Aplikasi Analisis dan Prediksi</h1>
      </header>
      <main>
        <div className="filters">
          <label>
            Provinsi:
            <select
              value={provinsi}
              onChange={(e) => setProvinsi(e.target.value)}
            >
              <option value="">Pilih Provinsi</option>
              {provinsiList.map((prov, index) => (
                <option key={index} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </label>
          <label>
            Jenjang Pendidikan:
            <select
              value={jenjang}
              onChange={(e) => setJenjang(e.target.value)}
            >
              <option value="">Pilih Jenjang</option>
              {jenjangList.map((jenj, index) => (
                <option key={index} value={jenj}>
                  {jenj}
                </option>
              ))}
            </select>
          </label>
          <label>
            Prediksi Tahun:
            <select
              value={predictionYears}
              onChange={(e) => setPredictionYears(parseInt(e.target.value, 10))}
            >
              {Array.from({ length: 5 }, (_, i) => i + 1).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
        {values.length > 0 && (
          <>
            <div className="chart">
              <Line
                data={{
                  labels: years,
                  datasets: [
                    {
                      label: "Tingkat Penyelesaian",
                      data: values,
                      borderColor: "blue",
                      fill: false,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
            <div className="table">
              <table>
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th>Tingkat Penyelesaian</th>
                  </tr>
                </thead>
                <tbody>
                  {years.map((year, i) => (
                    <tr key={i}>
                      <td>{year}</td>
                      <td>
                        {values[i].toFixed(2)}
                        {i >= years.length - predictedValues.length &&
                          " (Prediksi)"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {values.length === 0 && (
          <p className="no-data">
            Data tidak ditemukan untuk kombinasi yang dipilih.
          </p>
        )}
      </main>
    </div>
  );
};

export default App;
