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
      console.log(res.data.carbonEntries)
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

  // Pie Chart Data
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

  // Bar Chart Gradient
  const barGradient = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#1E88E5");
    gradient.addColorStop(1, "#43A047");
    return gradient;
  };

  const barData = {
    labels: carbonHistory.map((c) =>
      new Date(c.date).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    ),
    datasets: [
      {
        label: "Carbon Footprint (kg CO₂e)",
        data: carbonHistory.map((c) => c.totalCarbon),
        backgroundColor: (context) => barGradient(context.chart.ctx),
        borderColor: "#1565C0",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 2 },
      },
    },
  };

  // Helper to get background color by time
  const getTimeColor = (dateStr) => {
    const hour = new Date(dateStr).getHours();
    if (hour >= 5 && hour < 11) return "#E3F2FD"; // Morning - light blue
    if (hour >= 11 && hour < 16) return "#E8F5E9"; // Afternoon - light green
    if (hour >= 16 && hour < 21) return "#FFF3E0"; // Evening - light orange
    return "#F3E5F5"; // Night - light purple
  };

  return (
    <div className="container mt-5">
      {user ? (
        <>
          {/* User Info */}
          <div className="text-center mb-5" data-aos="fade-down">
            <h2 className="fw-bold" style={{ color: "#1565C0" }}>
              Welcome, {user.name} 🌍
            </h2>
            <p className="text-secondary">{user.email}</p>
          </div>

          {/* Upload Receipt */}
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

          {/* Latest Carbon Score */}
          {carbonScore > 0 && (
            <div
              className="card p-5 shadow-lg mb-5 border-0 rounded-4 text-center"
              data-aos="fade-up"
              style={{
                background: "linear-gradient(135deg, #F1F8E9, #E3F2FD)",
              }}
            >
              <h4 className="mb-2 fw-bold text-primary">🌱 Latest Carbon Score</h4>
              <h1 className="fw-bold" style={{ color: "#43A047" }}>
                {carbonScore} kg CO₂e
              </h1>
              <p className="text-muted">Average Carbon: {avgCarbon} kg CO₂e</p>
            </div>
          )}

          {/* Carbon History Cards */}
          {carbonHistory.length > 0 && (
            <>
              <h4
                className="fw-bold text-primary text-center mb-4"
                data-aos="fade-up"
              >
                📈 Your Carbon Footprint Over Time
              </h4>

              <div className="row g-4 mb-5">
                {carbonHistory.map((entry, idx) => {
                  const formattedDate = new Date(entry.date).toLocaleString([], {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const maxCarbon = 20;
                  const percent = Math.min(
                    (entry.totalCarbon / maxCarbon) * 100,
                    100
                  );
                  const bgColor = getTimeColor(entry.date);

                  return (
                    <div
                      className="col-md-4"
                      key={idx}
                      data-aos="fade-up"
                      data-aos-delay={idx * 100}
                    >
                      <div
                        className="card shadow-sm p-3 rounded-4 h-100 card-hover"
                        style={{ background: bgColor }}
                      >
                        <h6 className="fw-bold text-secondary">{formattedDate}</h6>
                        <p className="fw-bold text-success">
                          {entry.totalCarbon} kg CO₂e
                        </p>
                        <div
                          className="progress rounded-pill"
                          style={{ height: "20px" }}
                        >
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${percent}%`,
                              background: `linear-gradient(90deg, #1E88E5, #43A047)`,
                            }}
                            aria-valuenow={entry.totalCarbon}
                            aria-valuemin="0"
                            aria-valuemax={maxCarbon}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts */}
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
