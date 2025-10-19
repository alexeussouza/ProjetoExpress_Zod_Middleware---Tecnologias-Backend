import * as jwt from 'jsonwebtoken';


const payload = { id: 123, nome: 'Alexandre' };
const secret = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'; // chave de 32+ caracteres
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log('Token JWT:', token);
