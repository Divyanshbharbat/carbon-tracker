import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  // if already logged in → go home
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) navigate('/home');
  }, [navigate]);

  const onSubmit = async (data) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/login`, data, {
        withCredentials: true,
      });

      if (res.data.message === 'success') {
        // just save token to localStorage
        localStorage.setItem('token', res.data.token);

        toast.success('Login Successful 🎉');
        navigate('/home');
      } else {
        toast.error(res.data.message || 'Invalid credentials ❌');
      }
    } catch (err) {
      toast.error('Something went wrong! ❌');
      console.error('Login error:', err);
    }
  };

  return (
    <div
      className="container-fluid d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #d7e1ec, #f4f9ff)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <Toaster />
      <div className="row w-100 justify-content-center align-items-center px-3">
        {/* Login Form */}
        <div className="col-lg-5 col-md-8" data-aos="fade-right">
          <div className="p-5 bg-white rounded-4 shadow-lg">
            <h2 className="text-center mb-3 fw-semibold text-primary">
              Login to Continue
            </h2>
            <p className="text-center text-muted mb-4" style={{ fontSize: '0.95rem' }}>
              Access your dashboard and explore features.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="form-group mb-4">
                <input
                  type="text"
                  {...register('username', { required: 'Username is required' })}
                  className="form-control form-control-lg"
                  placeholder="Username"
                  autoComplete="username"
                  style={{ backgroundColor: '#f2f6fc' }}
                />
                {errors.username && (
                  <p className="text-danger mt-2">{errors.username.message}</p>
                )}
              </div>

              <div className="form-group mb-4">
                <input
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="form-control form-control-lg"
                  placeholder="Password"
                  autoComplete="current-password"
                  style={{ backgroundColor: '#f2f6fc' }}
                />
                {errors.password && (
                  <p className="text-danger mt-2">{errors.password.message}</p>
                )}
              </div>

              <div className="mb-3 text-end">
                <NavLink to="/contact" className="text-decoration-none text-secondary">
                  Forgot password?
                </NavLink>
              </div>

              <div className="d-flex justify-content-between flex-wrap gap-2">
                <NavLink to="/signup" className="btn btn-outline-primary px-4">
                  Signup
                </NavLink>

                <button type="submit" className="btn btn-primary px-5">
                  Login
                </button>

                {/* ✅ Admin Login button */}
                <button
                  type="button"
                  className="btn btn-warning px-4 text-white"
                  onClick={() => navigate('/adminlogin')}
                >
                  Admin Login
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Illustration */}
        <div className="col-lg-6 mt-5 mt-lg-0 text-center" data-aos="fade-left">
          <img
            src="https://img.freepik.com/free-vector/login-concept-illustration_114360-739.jpg"
            alt="Login Illustration"
            className="img-fluid rounded-4 shadow-sm"
            style={{ maxHeight: '480px' }}
          />
          <p className="text-muted mt-3">
            Empowering communities through smart food donation systems.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
