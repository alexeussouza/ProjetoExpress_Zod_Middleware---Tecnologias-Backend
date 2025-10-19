import express, { type Request, type Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { z, ZodError } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variaveis de ambiente do arquivo .env
dotenv.config();

// cria uma instancia da aplicação express
const app = express();

// Cria uma instancia do cliente Prisma
const prisma = new PrismaClient();

app.use(express.json());

// Configura o CORS para permitir requisições do frontend
app.use(cors({ origin: 'http://localhost:5173' }));

// shema validação zod para o autenticação
const registerSchema = z.object({
    email : z.email('Email invalido.'),
    password: z.string().min(6, 'A senha deve ter no minimo 6 caracteres.'),
    name: z.string().optional()
    
});

const loginSchema = z.object({ 
    email: z.email('email invalido'),
    password: z.string().min(4, 'A senha deve ter no minimo 6 caracteres.')
});

//chave secreta para assinar o token JWT
const secret = process.env.JWT_SECRET;

// Verifica se a variavel de ambiente JWT_SECRET esta definida
if (!secret) {
  throw new Error('JWT_SECRET não está definido no .env');
}

// Interface para estender o objeto Request com dados do usuario autenticado
interface AuthRequest extends Request {
    user?: {
        id: number
        email: string
        name? : string | null
    }
}

// Middleware para autenticar o token JWT
// extrai o token do cabeçalho Authorization
// verifica se o token é valido
// busca a informacao do usuario no banco de dados
// anexa as informacoes do usuario ao objeto req

const authMiddleware = async (req: AuthRequest, res: Response, next: any) => {
    try {
        
        // extrai o token do cabeçalho Authorization
        const authHeader = req.headers.authorization;

        if(!authHeader) {
            return res.status(401).json({ message: 'Token de autenticacao nao fornecido.' });
        }                    

        // Header no formato 'Bearer token'
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token de autenticacao invalido. Erro no Split()' });
        }
        // verifica se o token é valido, valida a assinatura e expiração
        const decoded = jwt.verify(token, secret) as { userId: number };

        // busca a informacao do usuario no banco de dados
        const user = await prisma.user.findUnique({ 
            where: { id: decoded.userId },
            select: {       
                id: true,
                email: true,
                name: true, // seleciona apenas os campos necessarios, nao traz a senha
            },
        });

        if (!user) {
            return res.status(401).json({ message: 'Usuario nao encontrado.' });
        }

        // anexa as informacoes do usuario ao objeto req
        req.user = user;

        next(); // prossegue para o proximo middleware ou rota

    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: '*** Token de autenticacao invalido.' });
        }
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token de autenticacao expirado.' });
        }
        
        return res.status(500).json({ error: 'erro interno do servidor.' });
    }
};

/**
 * -POST /api/auth/register
 * - valida os dados de registro
 * - verifica se o email ja existe
 * - cria o usuario com a senha hasheada
 * - salva usuario no banco de dados
 * - retorna um token JWT
 */

app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
        //valida os dados de entrada
        const {email, password, name} = registerSchema.parse(req.body)

        //verifica se o email ja esta cadastrado
        const existingUser = await prisma.user.findUnique({ 
            where: { email } 
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Email ja cadastrado.' });
        }

        // cria hash da senha com 10 salts
        const hashedPassword = await bcrypt.hash(password, 10);

        // cria o usuario no banco de dados
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name ?? null,
            },
        });

        // cria o token JWT
        const token = jwt.sign(
            { userId: user.id},
            secret,
            { expiresIn: '7d' } // token valido por 7 dias, pode usar '1h' para 1 hora
        );

        // retorna o token JWT
        return res.status(201).json({
            message: 'Usuario criado com sucesso',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },  
        });

    }catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Erro de validacao', issues: error.issues });
            }
            return res.status(500).json({ message: 'Erro interno do servidor' });  

        }
    });

    // Define o endpoint de login
    app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
        //valida os dados de entrada
        const {email, password} = loginSchema.parse(req.body)

        //verifica se o email ja esta cadastrado
        const user = await prisma.user.findUnique({ 
            where: { email } 
        });

        if (!user) {
            return res.status(401).json({ error: 'Email ou senha incorretos' });
        }

        // compara a senha fornecida com a senha hasheada no banco de dados
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // gera o token JWT
        const token = jwt.sign(
            
            { userId: user.id },
            secret,
            { expiresIn: '7d' } // token valido por 7 dias
        );

        // retornar sucesso
        return res.status(200).json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        });

    }catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Erro de validacao', issues: error.issues });
            }
            return res.status(500).json({ message: 'Erro interno do servidor' });  

        }
    });

//Define a porta em que o servidor vai rodar
// Usamos 3001 para não conflitar com frontend que usa 5173 ou 3000
const PORT = 3001;

// define a rota inicial endpoint para o servidor
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Ola, mundo! Bem-vido a API do nosso catalago de produtos!' });
});

//Teste middleware de autenticação
app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
    return res.status(200).json({ 
        message: 'Acesso concedido ao usuario',
        user: req.user
        });
});


app.get('/api/products', async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany();
        return res.status(200).json(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/api/products/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'ID do produto invalido. Deve ser um numero inteiro positivo.' });
    }
    try {
        const product = await prisma.product.findUnique({ where: { id } })
        if (!product) {
            return res.status(404).json({ message: 'Produto nao encontrado.' });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        return res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

/* Define o schema de validação para o produto usando Zod */

export const createProductSchema = z.object({
    title: z.string().min(3, 'O nome deve ter no minimo 3 caracteres.'),
    description: z.string().min(10, 'A descricao deve ter no minimo 10 caracteres.'),
    price: z.coerce.number().positive('O preco deve ser maior que zero.'),
    imageUrl: z.string().min(1, 'A URL da imagem deve ser uma URL valida.'),
    isFeatured: z.coerce.boolean().optional().default(false),
    //coerce tenta converte o valor para o tipo desejado, antes de validar
});

export const updateProductSchema = createProductSchema.partial();

/**
 * Post /api/products
 */

app.post('/api/products', authMiddleware , async (req: Request, res: Response) => {
    try {
        
        const {title, description, price, imageUrl} = createProductSchema.parse(req.body); // valida os dados de entrada
        
        const product = await prisma.product.create({ 
            data: {title, description, price, imageUrl}
        });

        return res.status(201).json({
            message: 'Produto criado com sucesso',
            product });

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Erro de validacao',
                issues: error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message
                })),
            });

        }
        console.error('POST /api/products error:', error)
        return res.status(500).json({ message: 'Erro interno ao criar produto' });
    }
})

app.put('/api/products/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'ID do produto invalido. Deve ser um numero inteiro positivo.' });
    }
    try {

       const data: Prisma.ProductUpdateInput = {};

        if (req.body.title !== undefined) {
            data.title = { set: req.body.title };
        }
        if (req.body.description !== undefined) {
            data.description = { set: req.body.description };
        }
        if (req.body.price !== undefined) {
            data.price = { set: req.body.price };
        }
        if (req.body.imageUrl !== undefined) {
            data.imageUrl = { set: req.body.imageUrl };
        }
        if (req.body.isFeatured !== undefined) {
            data.isFeatured = { set: req.body.isFeatured };
        }
        const updatedProduct = await prisma.product.update({
            where: { id },
            data,
        });
        return res.status(200).json({
            message: 'Produto atualizado com sucesso',
            updatedProduct
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Erro de validacao',
                issues: error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                })),
            });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ message: 'Produto nao encontrado.' });
        }
        console.error(`PUT /api/products/${req.params.id} error:`, error);
        return res.status(500).json({ message: 'Erro interno ao atualizar produto' });
    }
});

app.delete('/api/products/:id', authMiddleware ,  async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id);
    
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: 'ID do produto invalido. Deve ser um numero inteiro positivo.' });
    }
    try {
        await prisma.product.delete({ where: { id } });
        return res.status(204).json({
            message: 'Produto deletado com sucesso'
        });

    } catch (error) {
        
        return res.status(500).json({ message: 'Erro interno ao deletar produto' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso em http://localhost:${PORT}`);
    
});
