import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

async function test(){
    //busca todos os produtos
    const produtos = await prisma.product.findMany()

    produtos.forEach(product => {

        //console.log(`${product.title} - R$ ${product.preco}`)
    })
}

test()