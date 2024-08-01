import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [exptoken, setExptoken] = useState("");
  const [user, setUser] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    refreshToken();
    getUsers();
  }, []);

  const refreshToken = async () => {
    try {
      const response = await axios.get("http://localhost:5000/token");
      setToken(response.data.accessToken);
      const decoded = jwtDecode(response.data.accessToken);
      //   console.log(decoded); 
      setName(decoded.name);
      setExptoken(decoded.exp);
    } catch (error) {
      //if error direct ke login
      if (error.response) {
        navigate("/");
      }
    }
  };

  const axiosJWT = axios.create(); //setiap request token, harus memakai axiosJWT

  //mengecek token expired
  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      // bandingkan current date dengan exp token
      if (exptoken * 1000 < currentDate.getTime()) {
        //jika expired maka refresh token
        const response = await axios.get("http://localhost:5000/token");
        config.headers.Authorization = `Bearer ${response.data.accessToken}`;
        setToken(response.data.accessToken);
        const decoded = jwtDecode(response.data.accessToken);
        //   console.log(decoded);
        setName(decoded.name);
        setExptoken(decoded.exp);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const getUsers = async () => {
    const response = await axiosJWT.get("http://localhost:5000/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setUser(response.data);
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <h1>Testing login register api</h1>
        <h2>Name : {name}</h2>
        <button onClick={getUsers} className="button is-info">
          Get Users
        </button>
        <table className="table is-striped is-fullwidth">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {user.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
