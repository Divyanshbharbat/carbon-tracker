import React, { useState, useContext } from 'react';
import API from '../api';
import AuthContext from '../authContext';

export default function UploadReceipt({ onUploaded }) {
  const [file,setFile] = useState(null);
  const { token } = useContext(AuthContext);

  const submit = async (e) => {
    e.preventDefault();
    if(!file) return alert('Choose file');
    const fd = new FormData();
    fd.append('file', file);
    const res = await API.post('/receipts/upload', fd, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
    alert('Analyzed: ' + res.data.receipt.total_co2_kg + ' kg CO2');
    onUploaded && onUploaded(res.data.receipt);
  }

  return (
    <div style={{margin:'1rem 0'}}>
      <h4>Upload receipt</h4>
      <form onSubmit={submit}>
        <input type="file" accept="image/*,application/pdf" onChange={e=>setFile(e.target.files[0])} />
        <button className="btn btn-success mt-2">Upload & Analyze</button>
      </form>
    </div>
  );
}
