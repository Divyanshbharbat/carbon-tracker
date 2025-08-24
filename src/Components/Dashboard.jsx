import React, { useEffect, useState, useContext } from 'react';
import API from '../api';
import AuthContext from '../authContext';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const [receipts, setReceipts] = useState([]);

  const load = async () => {
    const res = await API.get('/trends', { headers: { Authorization: `Bearer ${token}` } });
    setReceipts(res.data.receipts);
  };

  useEffect(()=>{ if(token) load(); }, [token]);

  // prepare chart: x = date, y = total_co2_kg
  const data = {
    labels: receipts.map(r => new Date(r.createdAt).toLocaleDateString()),
    datasets: [
      { label: 'CO2 kg', data: receipts.map(r => r.total_co2_kg), fill: false }
    ]
  };

  return (
    <div style={{maxWidth:900, margin:'1rem auto'}}>
      <h3>Dashboard</h3>
      <div>
        <Line data={data} />
      </div>
      <div style={{marginTop:20}}>
        <h5>Receipts</h5>
        <ul>
          {receipts.slice().reverse().map(r => (
            <li key={r._id}>
              {new Date(r.createdAt).toLocaleString()} — {r.total_co2_kg} kg CO₂
              <ul>
                {r.items.map((it, idx) => <li key={idx}>{it.name} — {it.quantity} {it.unit} — {it.co2_kg} kg</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
