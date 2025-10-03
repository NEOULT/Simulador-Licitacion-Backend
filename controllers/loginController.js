import fs from 'fs';
import path from 'path';

export const login = (req, res) => {
  const { user, password } = req.body;
  if (!user || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  const usersPath = path.join(process.cwd(), 'users.json');
  const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  if (user === data.user && password === data.password) {
    return res.json({ success: true, mensaje: 'Login exitoso' });
  } else {
    return res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }
};
