import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(){
    console.log("Iniciando seed do banco de dados...")

    //lima a tabela antes de popular 
    await prisma.product.deleteMany();

    const products = await prisma.product.createMany({
        data:  [
            {
                title: "notebook",
                description: "Notebook gamer",
                price: 4500.00,
                imageUrl: "/images/notebook.png",
                isFeatured: true
            },
            {
                title: "Smartphone Avançado",
                description: "capture as melhores imagens",
                price: 45.00,  
                imageUrl: "/images/smartphone.png",
                isFeatured: false
            },
            {
                title: "Tablet Avançado",
                description: "capture as melhores imagens",
                price: 45.00,  
                imageUrl: "/images/tablet.png",
                isFeatured: false
            }

        ]
    })
    console.log(`${products.count} produtos criados com sucesso!`)

}
main()
    .catch((e) => {
        console.log("Erro ao popular o banco", e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })