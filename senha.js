"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jwt = require("jsonwebtoken");
var payload = { id: 123, nome: 'Alexandre' };
var secret = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'; // chave de 32+ caracteres
var token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log('Token JWT:', token);
