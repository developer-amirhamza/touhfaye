// One-off catalog seed for the Touhfaye storefront relaunch — candles,
// jewellery and gift sets priced in BDT. Real photography exists only for
// the Eternal Rose / Heart Keepsake gift-box products (uploaded by the
// brand); every other product uses a brand-coloured placeholder image until
// real photos are uploaded through the admin product editor.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PLACEHOLDER = (name: string) => `/touhfaye/placeholders/${name}.svg`;
const REAL = (name: string) => `/touhfaye/${name}`;

async function upsertCategory(title: string, slug: string) {
  return prisma.category.upsert({
    where: { slug },
    update: { title },
    create: { title, slug },
  });
}

async function upsertSubcategory(title: string, slug: string, categoryId: string) {
  return prisma.subcategory.upsert({
    where: { categoryId_slug: { categoryId, slug } },
    update: { title },
    create: { title, slug, categoryId },
  });
}

async function main() {
  const candles = await upsertCategory("Candles", "candles");
  const jewellery = await upsertCategory("Jewellery", "jewellery");
  const giftSets = await upsertCategory("Gift Sets", "gift-sets");

  const amberVanilla = await upsertSubcategory("Amber & Vanilla", "amber-vanilla", candles.id);
  const floralFresh = await upsertSubcategory("Floral & Fresh", "floral-fresh", candles.id);
  const oudWoods = await upsertSubcategory("Oud & Woods", "oud-woods", candles.id);
  const couples = await upsertSubcategory("Couples", "couples", giftSets.id);

  type Seed = {
    title: string;
    price: number;
    categoryId: string;
    subcategoryId?: string;
    images: string[];
    description: string;
    pack: string;
    keyFeatures: string[];
    isFeatured?: boolean;
    stock?: number;
  };

  const products: Seed[] = [
    {
      title: "Premium Scented Candle",
      price: 480,
      categoryId: candles.id,
      subcategoryId: amberVanilla.id,
      images: [PLACEHOLDER("candle-amber")],
      description:
        "Amber glass with a brushed gold lid, poured with a warm vanilla-amber fragrance that carries across a room without crowding it. Boxed in kraft card, ready to hand over.",
      pack: "180g · burns 30+ hours",
      keyFeatures: ["Soy wax blend", "30+ hour burn", "Amber glass jar", "Kraft gift box included"],
    },
    {
      title: "Mandala Tin Candle",
      price: 250,
      categoryId: candles.id,
      subcategoryId: floralFresh.id,
      images: [PLACEHOLDER("candle-mandala")],
      description:
        "A printed mandala tin that travels well and looks good open or closed. Light florals over a clean base, with a lid that keeps the scent in between burns.",
      pack: "120g tin · burns 18 hours",
      keyFeatures: ["Soy wax blend", "18 hour burn", "Printed steel tin"],
      isFeatured: true,
    },
    {
      title: "Mandala Trio Combo",
      price: 560,
      categoryId: giftSets.id,
      subcategoryId: floralFresh.id,
      images: [PLACEHOLDER("candle-mandala")],
      description:
        "Three mandala tins in mixed prints with a fourth added free. The set our customers send most often when they are not sure which print someone will love.",
      pack: "3 tins + 1 free gift tin",
      keyFeatures: ["3 tins + 1 free", "18 hour burn each", "Gift wrap included"],
    },
    {
      title: "Premium Crafted Candle",
      price: 650,
      categoryId: candles.id,
      subcategoryId: oudWoods.id,
      images: [PLACEHOLDER("candle-oud")],
      description:
        "Matte black ceramic with a gold motif and a cork cap, made for gifting on special occasions. Deep oud and woods that settle into a room slowly.",
      pack: "200g · natural cork cap",
      keyFeatures: ["Matte ceramic vessel", "Natural cork cap", "35 hour burn"],
    },
    {
      title: "Mandala Collection Box",
      price: 1900,
      categoryId: giftSets.id,
      subcategoryId: floralFresh.id,
      images: [PLACEHOLDER("candle-mandala")],
      description:
        "Twelve tins, twelve prints, one printed keepsake box. Built for corporate gifting and family hampers where one candle will not go far enough.",
      pack: "12 tins · mixed prints",
      keyFeatures: ["12 tins", "Printed keepsake box", "Gift wrap included"],
    },
    {
      title: "Timeless Elegance Earrings — Blush",
      price: 390,
      categoryId: jewellery.id,
      images: [PLACEHOLDER("jewellery-earrings")],
      description:
        "Blush stones set in gold plate with pearl and glass drops. Light enough for a full evening, finished on a Touhfaye card so it can be gifted as it arrives.",
      pack: "Gold-plated · pearl drop",
      keyFeatures: ["18k gold-tone plating", "6.5cm drop", "Lightweight"],
    },
    {
      title: "Timeless Elegance Earrings — Ruby",
      price: 390,
      categoryId: jewellery.id,
      images: [PLACEHOLDER("jewellery-earrings")],
      description:
        "Deep ruby stones with cream pearl fringing. The pair that works with a red or maroon outfit without competing with it.",
      pack: "Gold-plated · pearl drop",
      keyFeatures: ["18k gold-tone plating", "6.5cm drop", "Lightweight"],
      isFeatured: true,
    },
    {
      title: "Timeless Elegance Earrings — Lilac",
      price: 390,
      categoryId: jewellery.id,
      images: [PLACEHOLDER("jewellery-earrings")],
      description: "Soft lilac druzy stones with pearl and frosted glass drops, warm gold setting throughout.",
      pack: "Gold-plated · pearl drop",
      keyFeatures: ["18k gold-tone plating", "6.5cm drop", "Lightweight"],
    },
    {
      title: "Timeless Elegance Earrings — Ivory Multi",
      price: 390,
      categoryId: jewellery.id,
      images: [PLACEHOLDER("jewellery-earrings")],
      description: "Ivory stones with a multicolour bead fringe, so one pair sits with several outfits.",
      pack: "Gold-plated · multicolour drop",
      keyFeatures: ["18k gold-tone plating", "6.5cm drop", "Lightweight"],
    },
    {
      title: "Bangle & Clutch Hamper",
      price: 2400,
      categoryId: giftSets.id,
      images: [PLACEHOLDER("giftset-hamper")],
      description:
        "Glass bangle stacks, gold-tone kada and a hand-beaded clutch packed together in one box. Assembled to order, so colours can be matched to an outfit.",
      pack: "Bangle stacks · beaded clutch",
      keyFeatures: ["Bangles + clutch", "Made to order", "Gift wrap included"],
    },
    {
      title: "Eternal Rose Jewellery Box",
      price: 1450,
      categoryId: giftSets.id,
      subcategoryId: couples.id,
      images: [REAL("rose-box-open-1.jpg"), REAL("rose-box-open-2.jpg")],
      description:
        "A lacquered red case that opens into two halves: a preserved rose under an acrylic dome on top, a lined drawer below holding a heart pendant on a fine chain. The rose needs no water and holds its colour for years.",
      pack: "Preserved rose · heart pendant",
      keyFeatures: ["Preserved rose", "Pendant included", "Lacquered wood case"],
      isFeatured: true,
    },
    {
      title: "Eternal Rose Gift Bag Set",
      price: 1750,
      categoryId: giftSets.id,
      subcategoryId: couples.id,
      images: [REAL("gift-set-flatlay.jpg"), REAL("rose-box-open-1.jpg")],
      description:
        "The rose box packed inside our ivory rope-handled bag with a gold heart clasp and a printed satin ribbon. Nothing left to wrap when it reaches you.",
      pack: "Rose box · rope bag · ribbon",
      keyFeatures: ["Box + bag included", "Printed satin ribbon", "Handwritten card"],
    },
    {
      title: "Heart Keepsake Box",
      price: 890,
      categoryId: giftSets.id,
      subcategoryId: couples.id,
      images: [REAL("rose-box-open-2.jpg")],
      description:
        "The red heart case on its own, for when you already have the piece to put inside. Folds open into three compartments with a pull-out drawer.",
      pack: "Empty case · fits pendant or ring",
      keyFeatures: ["Matte red finish", "Gold trim", "Lined drawer"],
    },
    {
      title: "Projection Pendant Necklace",
      price: 650,
      categoryId: jewellery.id,
      images: [PLACEHOLDER("jewellery-necklace")],
      description:
        "A rose-gold spiral pendant with a stone that projects a line of text when held to the light. Arrives in a drawer box, so it needs no further wrapping.",
      pack: "Rose gold · boxed",
      keyFeatures: ["Rose gold plating", "45cm chain", "Gift box included"],
    },
    {
      title: "Name Puzzle Heart Necklaces",
      price: 790,
      categoryId: jewellery.id,
      subcategoryId: couples.id,
      images: [PLACEHOLDER("jewellery-necklace")],
      description:
        "Two steel halves that lock into one heart, engraved with the names or the date you send us. Polished steel as standard, one half in black on request.",
      pack: "Pair · engraved to order",
      keyFeatures: ["2 necklaces", "Free engraving", "3–4 day lead time"],
    },
    {
      title: "Yin Yang Couple Pendants",
      price: 690,
      categoryId: jewellery.id,
      subcategoryId: couples.id,
      images: [PLACEHOLDER("jewellery-necklace")],
      description: "Black and white enamel halves on matching steel chains. Light, everyday pieces rather than occasion jewellery.",
      pack: "Pair · enamel and steel",
      keyFeatures: ["2 necklaces", "Enamel finish", "50cm chain"],
    },
    {
      title: "Birthstone Heart Ring",
      price: 420,
      categoryId: jewellery.id,
      images: [PLACEHOLDER("jewellery-ring")],
      description:
        "A fine gold-tone band with a heart-cut stone, open at the back so one size fits most. Twelve colours, one for each birth month.",
      pack: "Adjustable · 12 stone colours",
      keyFeatures: ["18k gold-tone plating", "Adjustable fit", "12 stone colours"],
    },
    {
      title: "Crystal Eternity Band",
      price: 520,
      categoryId: jewellery.id,
      images: [PLACEHOLDER("jewellery-bangle")],
      description:
        "Channel-set square crystals running the full circumference, on a stainless band that will not tarnish. Sold singly or stacked with the double-row version.",
      pack: "Single row · gold, rose or steel",
      keyFeatures: ["Stainless steel base", "4mm width", "3 tone options"],
    },
    {
      title: "Double Row Band",
      price: 620,
      categoryId: jewellery.id,
      images: [PLACEHOLDER("jewellery-bangle")],
      description:
        "The wider sibling of the eternity band, with two rows of crystals and a polished channel between them. Gold, rose gold or steel.",
      pack: "Two rows · 6mm",
      keyFeatures: ["Stainless steel base", "6mm width", "3 tone options"],
    },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { title: p.title, deletedAt: null } });
    const data = {
      title: p.title,
      price: p.price,
      discount: 0,
      stock: p.stock ?? 30,
      colors: [] as string[],
      sizes: [] as string[],
      categoryId: p.categoryId,
      subcategoryId: p.subcategoryId,
      images: p.images,
      description: p.description,
      pack: p.pack,
      keyFeatures: p.keyFeatures,
      isFeatured: p.isFeatured ?? false,
      isActive: true,
    };
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
    } else {
      await prisma.product.create({ data });
    }
  }

  const testimonials = [
    { name: "Nusrat J.", location: "Dhanmondi, Dhaka", quote: "The rose box arrived exactly like the photos — the packaging alone made it feel like a proper gift, not just an order.", rating: 5 },
    { name: "Tanvir A.", location: "Chattogram", quote: "Ordered the mandala trio for my mother. Same-day dispatch and the candles smell incredible, they last much longer than the usual ones.", rating: 5 },
    { name: "Farzana R.", location: "Uttara, Dhaka", quote: "Bought the earrings for a wedding and got so many compliments. Delivery to Dhaka took just a day.", rating: 5 },
    { name: "Shakib H.", location: "Sylhet", quote: "Corporate gifting order for 30 people, done in a week with our logo on the card. Will order again for Eid.", rating: 5 },
    { name: "Mim K.", location: "Bashundhara, Dhaka", quote: "Cash on delivery made it easy to trust the first order. The heart keepsake box is even nicer in person.", rating: 5 },
  ];

  for (const t of testimonials) {
    const existing = await prisma.testimonial.findFirst({ where: { name: t.name, quote: t.quote } });
    if (!existing) {
      await prisma.testimonial.create({ data: t });
    }
  }

  console.log(`Seeded ${products.length} products across 3 categories and ${testimonials.length} testimonials.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
