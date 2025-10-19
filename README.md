Projeto Node.js com TypeScript, Express, Docker e Prisma
Este projeto utiliza Node.js com TypeScript, Express para gerenciamento de servidor, Docker para containerização e Prisma como ORM para interação com banco de dados.

📦 Inicialização do Projeto
1 . Crie o projeto Node.js:

---
npm init
---
2. Instale o Express:

---
npm install express
---
O Express traz diversas ferramentas para lidar com servidores.

3. Instale as dependências de desenvolvimento:

---
npm install -D typescript @types/node @types/express tsx
---
4. Configure o TypeScript:

---
npx tsc --init
---
5. Crie a pasta src e o arquivo server.ts com as configurações do servidor.

No arquivo server.ts, adicione:

---
app.use(express.json());
---
Isso permite interpretar o corpo da requisição como JSON. Sem isso, req.body será undefined.

6. 🐳 Configuração Docker

Verifique se o Docker está instalado:

---
docker --version
docker-compose --version
---
Para subir os containers:

---
docker-compose up -d
---
7. 🧬 Configuração Prisma

Instale o Prisma como dependência de desenvolvimento:

---
npm install -D prisma
---
8. Instale o cliente Prisma:

---
npm install @prisma/client
---

9. Inicialize o Prisma:

---
npx prisma init
---
Isso criará a pasta prisma, o arquivo schema.prisma e o .env para configurar a URL do banco de dados.

10. Realize a primeira migração:

---
npx prisma migrate dev --name init
---
11. O comando migrate dev cria uma nova migração e --name init define o nome da mesma.

Visualize o banco de dados com:

---
npx prisma studio
---
🌱 Seed do Banco de Dados
Foi adicionado um atalho no package.json para rodar o seed:

---
json
"scripts": {
  "seed": "npx prisma db seed"
}
---
12. Para popular o banco, execute:

---
npm run seed
---
Certifique-se de que o arquivo seed.ts esteja devidamente configurado.

instalar o bcryptjs e jsonwebtoken
---
npm install bcrypt jsonwebtoken


instalar os tipos para as bibliotecas
---
npm install @types/bcryptjs  @types/jsonwebtoken


criar o modelo para usuario no modelo prisma
---
```
model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  password    String   // sera armazenado com hash, nunca texto puro
  name        String?  // campo opcional
  createdAt   DateTime @default(now()) 
  updatedAt   DateTime @updatedAt 

  @@map("users") // Nome da tabela no banco de dados sera "users"
}
```

Apos criar o modelo deve rodar o comando para rodar a migration
---
npx prisma migrate dev --name create-users

Rodar o npm studio para visualizar a tabela. 
---

Crie o arquivo .env na raiz do projeto e Instale o pacote dotenv
---
import dotenv from 'dotenv';
dotenv.config();

8º const secret = process.env.JWT_SECRET
