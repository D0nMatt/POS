import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const { setToken } = useContext(AuthContext);
  const { email, password } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const { login } = useContext(AuthContext);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { email, password });
      login(res.data.user, res.data.token);
    } catch (err) {
      console.error('Error de login:', err.response.data);
      alert(`Error: ${err.response.data.msg || 'No se pudo iniciar sesión'}`);
    }
  };

  return (
    <section>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={onSubmit}>
        <div>
          <input
            type="email"
            placeholder="Correo Electrónico"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Contraseña"
            name="password"
            value={password}
            onChange={onChange}
            minLength="6"
            required
          />
        </div>
        <button type="submit">Entrar</button>
      </form>
    </section>
  );
}

export default Login;