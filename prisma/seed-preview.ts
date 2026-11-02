import { PrismaClient, ProductType, TagColor } from "@prisma/client";

const prisma = new PrismaClient();

// Preview only. Images are illustrative stock photos, not exact product photography.
// This script creates only missing records and never edits existing products.
const previewProducts: Array<{
  slug: string; title: string; description: string; price: number;
  imageUrl: string; stock: number; type: ProductType; weight: number;
  category: { slug: string; name: string }; tags: { slug: string; name: string; color: TagColor }[];
}> = [
  { slug:"demo-preview-retro-controller", title:"Retro Controller Keychain", description:"A nostalgic gaming-inspired keychain for your backpack, keys, or desk setup. Lightweight and perfect for retro game fans.", price:39000, imageUrl:"https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=900&h=750&fit=crop", stock:28, type:"PHYSICAL", weight:75, category:{slug:"demo-accessories",name:"Accessories"}, tags:[{slug:"demo-retro",name:"Retro",color:"BLUE"},{slug:"demo-bestseller",name:"Bestseller",color:"AMBER"}]},
  { slug:"demo-preview-canvas-tote", title:"Creative Everyday Tote Bag", description:"A durable everyday canvas tote that brings a little creative personality to your daily essentials.", price:119000, imageUrl:"https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&h=750&fit=crop", stock:16, type:"PHYSICAL", weight:290, category:{slug:"demo-bags",name:"Bags"}, tags:[{slug:"demo-lifestyle",name:"Lifestyle",color:"SKY"},{slug:"demo-bestseller",name:"Bestseller",color:"AMBER"}]},
  { slug:"demo-preview-cyber-city-print", title:"Neon City Art Print", description:"A vibrant futuristic city art print to bring color and atmosphere to a gaming room or creative workspace.", price:89000, imageUrl:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900&h=750&fit=crop", stock:20, type:"PHYSICAL", weight:180, category:{slug:"demo-art-prints",name:"Art Prints"}, tags:[{slug:"demo-cyberpunk",name:"Cyberpunk",color:"VIOLET"},{slug:"demo-room-decor",name:"Room Decor",color:"CYAN"}]},
  { slug:"demo-preview-galaxy-stickers", title:"Galaxy Explorer Sticker Set", description:"A pack of vibrant, space-themed decorative stickers for laptops, journals and gaming accessories.", price:29000, imageUrl:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&h=750&fit=crop", stock:48, type:"PHYSICAL", weight:30, category:{slug:"demo-stickers",name:"Stickers"}, tags:[{slug:"demo-space",name:"Space",color:"INDIGO"},{slug:"demo-new",name:"New",color:"GREEN"}]},
  { slug:"demo-preview-desk-mat", title:"Midnight Gamer Desk Mat", description:"A large soft-surface desk mat for smooth mouse movement and a comfortable, organized gaming setup.", price:149000, imageUrl:"https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=900&h=750&fit=crop", stock:22, type:"PHYSICAL", weight:480, category:{slug:"demo-desk-setup",name:"Desk Setup"}, tags:[{slug:"demo-gaming",name:"Gaming",color:"BLUE"},{slug:"demo-room-decor",name:"Room Decor",color:"CYAN"}]},
  { slug:"demo-preview-space-poster", title:"Cosmic Voyage Poster", description:"A colorful cosmic poster to decorate a bedroom, studio, or game development space.", price:79000, imageUrl:"https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=900&h=750&fit=crop", stock:25, type:"PHYSICAL", weight:130, category:{slug:"demo-art-prints",name:"Art Prints"}, tags:[{slug:"demo-space",name:"Space",color:"INDIGO"},{slug:"demo-new",name:"New",color:"GREEN"}]},
  { slug:"demo-preview-pixel-icon-pack", title:"Pixel UI Icon Pack", description:"A collection of crisp UI-style game icons for use in personal mockups and digital design explorations. Demo listing.", price:59000, imageUrl:"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&h=750&fit=crop", stock:100, type:"DIGITAL", weight:0, category:{slug:"demo-digital-assets",name:"Digital Assets"}, tags:[{slug:"demo-digital",name:"Digital",color:"SKY"},{slug:"demo-ui-design",name:"UI Design",color:"PURPLE"}]},
  { slug:"demo-preview-wallpaper-bundle", title:"Dreamscape Wallpaper Bundle", description:"A sample collection of colorful wallpapers for desktop and mobile, created to preview digital product presentation.", price:45000, imageUrl:"https://images.unsplash.com/photo-1557683316-973673baf926?w=900&h=750&fit=crop", stock:100, type:"DIGITAL", weight:0, category:{slug:"demo-digital-assets",name:"Digital Assets"}, tags:[{slug:"demo-digital",name:"Digital",color:"SKY"},{slug:"demo-colorful",name:"Colorful",color:"PINK"}]},
  { slug:"demo-preview-gradient-backgrounds", title:"Soft Gradient Background Pack", description:"A bundle of soft, modern gradient backgrounds to preview graphics resources in the storefront.", price:35000, imageUrl:"https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=900&h=750&fit=crop", stock:100, type:"DIGITAL", weight:0, category:{slug:"demo-digital-assets",name:"Digital Assets"}, tags:[{slug:"demo-digital",name:"Digital",color:"SKY"},{slug:"demo-ui-design",name:"UI Design",color:"PURPLE"}]},
  { slug:"demo-preview-game-art-scenes", title:"Indie Game Scene Concept Pack", description:"A preview listing for creative scene concepts and visual references suitable for game design inspiration.", price:99000, imageUrl:"https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=900&h=750&fit=crop", stock:100, type:"DIGITAL", weight:0, category:{slug:"demo-digital-assets",name:"Digital Assets"}, tags:[{slug:"demo-gaming",name:"Gaming",color:"BLUE"},{slug:"demo-digital",name:"Digital",color:"SKY"}]},
  { slug:"demo-preview-studio-notebook", title:"Creative Studio Notebook", description:"A compact notebook for sketching character designs, planning projects, and collecting fresh ideas.", price:49000, imageUrl:"https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=900&h=750&fit=crop", stock:32, type:"PHYSICAL", weight:210, category:{slug:"demo-stationery",name:"Stationery"}, tags:[{slug:"demo-lifestyle",name:"Lifestyle",color:"SKY"},{slug:"demo-new",name:"New",color:"GREEN"}]},
  { slug:"demo-preview-headphone-stand", title:"Minimal Gaming Desk Accessory", description:"A modern desk accessory listing designed to demonstrate premium products and merchandising in the catalog.", price:129000, imageUrl:"https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=900&h=750&fit=crop", stock:12, type:"PHYSICAL", weight:350, category:{slug:"demo-desk-setup",name:"Desk Setup"}, tags:[{slug:"demo-gaming",name:"Gaming",color:"BLUE"},{slug:"demo-bestseller",name:"Bestseller",color:"AMBER"}]},
];

async function main() {
  if (process.env.CONFIRM_DEMO_SEED !== "yes") {
    throw new Error("Demo seed is opt-in. Set CONFIRM_DEMO_SEED=yes in the command before running.");
  }
  const count = await prisma.product.count({ where: { slug: { startsWith: "demo-preview-" } } });
  console.log(`🌱 Existing demo records: ${count}. Seeding missing demo products...`);
  let created = 0;
  let skipped = 0;
  for (const item of previewProducts) {
    if (await prisma.product.findUnique({ where: { slug: item.slug }, select: { id: true } })) {
      skipped++;
      continue;
    }
    await prisma.product.create({
      data: {
        slug: item.slug, title: item.title, description: item.description, price: item.price,
        imageUrl: item.imageUrl, stock: item.stock, type: item.type, weight: item.weight,
        isPublished: true,
        category: { connectOrCreate: { where: { slug: item.category.slug }, create: item.category } },
        tags: { connectOrCreate: item.tags.map(tag => ({
          where: { slug: tag.slug }, create: { slug: tag.slug, name: tag.name, color: tag.color },
        })) },
      },
    });
    created++;
  }
  console.log(`✅ Preview seed finished: ${created} created, ${skipped} already present.`);
  console.log("Images are illustrative; demo records are not real inventory. Run on a development/staging database only.");
}

main().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
