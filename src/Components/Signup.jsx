import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useNavigate, NavLink } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import AOS from 'aos';
import 'aos/dist/aos.css';


const Signup = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);
useEffect(()=>{
 let y= localStorage.getItem("token")
  if(y){
    navigate("/home")
  }
},[])

  const onSubmit = async (data) => {
    try {
      
      const response = await axios.post(`http://localhost:5000/api/signup`, data,{
        withCredentials:true,
      });
      
      // const response = await axios.post(`http://localhost:5000/api/signup`, data,{
      //   withCredentials:true,
      // });
      console.log(response)
      if (response.data.message === 'success') {
        toast.success("Account created successfully 🎉");
        setTimeout(() => navigate("/login"), 1000);
      }
      if (response.data === 'fail') {
        toast.error("Email already Exists ");
        
      }
     
    } catch (error) {
      toast.error("Something went wrong❌");
      console.error(error);
    }
  };

  return (
    <div
      className="container-fluid d-flex align-items-center"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #c2e9fb, #e0f7fa)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}
    >
      <Toaster />
      <div className="row w-100 justify-content-center align-items-center px-3">
        {/* Left Side - Signup Form */}
        <div className="col-lg-5 col-md-8" data-aos="fade-right">
          <div className="p-5 bg-white rounded-4 shadow-lg">
            <h2 className="text-center mb-3 fw-semibold text-primary">Create Your Account</h2>
            <p className="text-center text-muted mb-4" style={{ fontSize: "0.95rem" }}>
              Join our community and start your journey with us.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group mb-4">
                <input
                  type="text"
                  {...register("name", { required: "Username is required" })}
                  className="form-control form-control-lg"
                  placeholder="Username"
                  style={{ backgroundColor: "#f2f6fc" }}
                />
                {errors.username && <p className="text-danger mt-2">{errors.username.message}</p>}
              </div>

              <div className="form-group mb-4">
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  className="form-control form-control-lg"
                  placeholder="Email"
                  style={{ backgroundColor: "#f2f6fc" }}
                />
                {errors.email && <p className="text-danger mt-2">{errors.email.message}</p>}
              </div>

              <div className="form-group mb-4">
                <input
                  type="password"
                  {...register("password", { required: "Password is required", minLength: 6 })}
                  className="form-control form-control-lg"
                  placeholder="Password"
                  style={{ backgroundColor: "#f2f6fc" }}
                />
                {errors.password && <p className="text-danger mt-2">{errors.password.message}</p>}
              </div>

              <div className="d-flex justify-content-between">
                <NavLink to="/login" className="btn btn-outline-primary ">Login</NavLink>
                <button type="submit" className="btn btn-primary  ">Signup</button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className="col-lg-6 mt-5 mt-lg-0 text-center" data-aos="fade-left">
          <img
            src="https://img.freepik.com/free-vector/account-concept-illustration_114360-3766.jpg?t=st=1712747557~exp=1712751157~hmac=b801d1622e1be891418b9ac8b6254ce7e4ff88e10967c63d69cb95a8cfc96b5e&w=740"
            alt="Signup Visual"
            className="img-fluid rounded-4 shadow-sm"
            style={{ maxHeight: '480px' }}
          />
          <p className="text-muted mt-3">
            Secure and simple onboarding for your experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;