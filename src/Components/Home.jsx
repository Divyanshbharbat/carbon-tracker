import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "aos/dist/aos.css";
import AOS from "aos";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import "../index.css"; // Poppins font imported here

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [carbonScore, setCarbonScore] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [carbonHistory, setCarbonHistory] = useState([]);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    const token = localStorage.getItem("token");

    axios
      .get("http://localhost:5000/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        fetchCarbonHistory(res.data._id, token);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/");
      });
  }, [navigate]);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("receipt", selectedFile);
      formData.append("userId", user._id);

      const res = await axios.post(
        "http://localhost:5000/api/carbon/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setCarbonScore(res.data.totalCarbon || 0);
      console.log("divynsh"+res.data)
      fetchCarbonHistory(user._id, token);
    } catch (err) {
      console.error(err);
      alert("Upload/analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const fetchCarbonHistory = async (userId, token) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/carbon/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(res.data)
      setCarbonHistory(res.data.carbonEntries || []);
    } catch (err) {
      console.error("Failed to fetch carbon history", err);
    }
  };

  // Average Carbon
  const avgCarbon =
    carbonHistory.length > 0
      ? (
          carbonHistory.reduce((acc, c) => acc + c.totalCarbon, 0) /
          carbonHistory.length
        ).toFixed(2)
      : 0;

  // Helper: pick color by time
  const getTimeColor = (dateStr) => {
    const hour = new Date(dateStr).getHours();
    if (hour >= 5 && hour < 11) return "rgba(30, 136, 229, 0.7)"; // Morning
    if (hour >= 11 && hour < 16) return "rgba(67, 160, 71, 0.7)"; // Afternoon
    if (hour >= 16 && hour < 21) return "rgba(255, 152, 0, 0.7)"; // Evening
    return "rgba(156, 39, 176, 0.7)"; // Night
  };

  // Group entries by entryDate
  const grouped = {};
  carbonHistory.forEach((entry) => {
    const dateKey = entry.entryDate; // YYYY-MM-DD
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  });

  const barLabels = Object.keys(grouped); // unique dates
  const maxEntries = Math.max(...Object.values(grouped).map(arr => arr.length));

  const colors = [
    "rgba(30, 136, 229, 0.7)",
    "rgba(67, 160, 71, 0.7)",
    "rgba(255, 152, 0, 0.7)",
    "rgba(156, 39, 176, 0.7)",
    "rgba(229, 57, 53, 0.7)"
  ];

  const datasets = [];
  for (let idx = 0; idx < maxEntries; idx++) {
    datasets.push({
      label: `Entry ${idx + 1}`,
      data: barLabels.map((date) => {
        const entry = grouped[date][idx];
        return entry ? entry.totalCarbon : 0;
      }),
      backgroundColor: colors[idx % colors.length],
      borderWidth: 1,
      borderRadius: 6,
    });
  }

  const barData = {
    labels: barLabels,
    datasets,
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { stepSize: 5 },
      },
    },
  };

  const pieData = {
    labels: ["Shopping", "Travel", "Food"],
    datasets: [
      {
        data: [
          carbonHistory.reduce(
            (acc, c) => acc + c.shopping.reduce((a, i) => a + i.carbon, 0),
            0
          ),
          carbonHistory.reduce(
            (acc, c) => acc + c.travel.reduce((a, i) => a + i.carbon, 0),
            0
          ),
          carbonHistory.reduce(
            (acc, c) => acc + c.food.reduce((a, i) => a + i.carbon, 0),
            0
          ),
        ],
        backgroundColor: ["#1E88E5", "#43A047", "#FB8C00"],
        hoverOffset: 10,
      },
    ],
  };

  return (
    <div className="container mt-5">
      {user ? (
        <>
          <div className="text-center mb-5" data-aos="fade-down">
            <h2 className="fw-bold" style={{ color: "#1565C0" }}>
              Welcome, {user.name} 🌍
            </h2>
            <p className="text-secondary">{user.email}</p>
          </div>

          <div
            className="card p-4 shadow-lg mb-5 border-0 rounded-4"
            data-aos="fade-up"
            style={{
              background: "linear-gradient(135deg, #E3F2FD, #BBDEFB)",
            }}
          >
            <h4 className="mb-3 fw-semibold text-primary">
              Upload your receipt to track Carbon Footprint
            </h4>
            <input
              type="file"
              accept="image/*,.pdf"
              className="form-control mb-3"
              onChange={handleFileChange}
            />
            <button
              className="btn text-white fw-bold"
              onClick={handleUpload}
              disabled={loading}
              style={{
                background: "linear-gradient(90deg, #1E88E5, #43A047)",
              }}
            >
              {loading ? "Analyzing..." : "Upload & Analyze"}
            </button>
          </div>

          {carbonScore > 0 && (
            <div
              className="card p-5 shadow-lg mb-5 border-0 rounded-4 text-center"
              data-aos="fade-up"
              style={{
                background: "linear-gradient(135deg, #F1F8E9, #E3F2FD)",
              }}
            >
              <h4 className="mb-2 fw-bold text-primary">
                🌱 Latest Carbon Score
              </h4>
              <h1 className="fw-bold" style={{ color: "#43A047" }}>
                {carbonScore} kg CO₂e
              </h1>
              <p className="text-muted">
                Average Carbon: {avgCarbon} kg CO₂e
              </p>
            </div>
          )}

          {carbonHistory.length > 0 && (
            <>
              <h4
                className="fw-bold text-primary text-center mb-4"
                data-aos="fade-up"
              >
                📈 Your Carbon Footprint Over Time
              </h4>
              <div className="row g-4">
                <div className="col-md-6" data-aos="fade-right">
                  <div className="card p-4 shadow-lg rounded-4">
                    <h5 className="fw-bold text-center mb-3 text-primary">
                      📊 Carbon Distribution
                    </h5>
                    <Pie data={pieData} />
                  </div>
                </div>
                <div className="col-md-6" data-aos="fade-left">
                  <div
                    className="card p-4 shadow-lg rounded-4"
                    style={{ height: "400px" }}
                  >
                    <h5 className="fw-bold text-center mb-3 text-primary">
                      📊 Carbon Over Time
                    </h5>
                    <Bar data={barData} options={barOptions} />
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-center text-muted">Loading...</p>
      )}
    </div>
  );
}

export default Home;
