import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { PRICE_OVERRIDE_ROLES } from "../middlewares/role";
import { attachDisplayPrices, getViewerRole } from "../services/pricing";
import { parseFiniteNumber, parseNonNegativeInteger, parsePagination } from "../utils/validation";

interface AuthRequest extends Request {
    userId?: string;
}

const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};

// Purely the human-readable URL prefix — /product/[product] always resolves
// by the id suffix (see idFromSlug client-side), so this can be freely
// regenerated/edited without ever breaking an existing shared link.
const buildUniqueProductSlug = async (source: string, excludeId?: string) => {
    const base = generateSlug(source) || "product";
    let finalSlug = base;
    let counter = 1;
    while (await prisma.product.findFirst({ where: { slug: finalSlug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })) {
        finalSlug = `${base}-${counter++}`;
    }
    return finalSlug;
};

// Writes one PriceOverride row per role present in `priceByRole` with a
// valid (finite, > 0) value, and removes any override for a role that was
// sent back as empty/null/0 — so clearing a field in the admin form actually
// clears the override instead of leaving a stale price behind.
const savePriceOverrides = async (productId: string, priceByRole: Record<string, unknown> | undefined) => {
    if (!priceByRole || typeof priceByRole !== "object") return;
    await Promise.all(
        PRICE_OVERRIDE_ROLES.map(async (role) => {
            if (!(role in priceByRole)) return; // omitted entirely: leave existing override untouched
            const raw = priceByRole[role];
            const value = raw === "" || raw === null || raw === undefined ? null : parseFiniteNumber(raw);
            if (value !== null && value > 0) {
                await prisma.priceOverride.upsert({
                    where: { productId_role: { productId, role } },
                    update: { price: value },
                    create: { productId, role, price: value },
                });
            } else {
                await prisma.priceOverride.deleteMany({ where: { productId, role } });
            }
        })
    );
};

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { title, price, description, colors, sizes, discount, more_details, category, stock, images, videos, categoryId, subcategoryId, priceByRole, slug: requestedSlug, metaTitle, metaDescription } = req.body;
        if (typeof title !== "string" || !title.trim() || price === undefined || price === null || price === "") {
            return errorHandler(res, 400, "Please provide the required fields", true)
        }
        // Reject NaN/negative price or discount — a bad value here corrupts
        // every quote/order total downstream (they'd all silently become NaN).
        const priceNum = parseFiniteNumber(price);
        const discountNum = discount === undefined || discount === null || discount === "" ? 0 : parseFiniteNumber(discount);
        const stockNum = parseNonNegativeInteger(stock ?? 0);
        if (priceNum === null || priceNum <= 0) {
            return errorHandler(res, 400, "Price must be a valid number greater than 0", true)
        }
        if (discountNum === null || discountNum < 0 || discountNum > 100) {
            return errorHandler(res, 400, "Discount must be a valid number between 0 and 100", true)
        }
        if (stockNum === null) {
            return errorHandler(res, 400, "Stock must be a non-negative whole number", true)
        }

        const slug = await buildUniqueProductSlug(typeof requestedSlug === "string" && requestedSlug.trim() ? requestedSlug.trim() : title.trim());

        const newProduct = await prisma.product.create({
            data: { title: title.trim(), price: priceNum, description, colors, sizes, discount: discountNum, more_details, category, stock: stockNum, images, videos: videos || [],categoryId, subcategoryId, slug, metaTitle: metaTitle || null, metaDescription: metaDescription || null }
        });
        await savePriceOverrides(newProduct.id, priceByRole);
        return errorHandler(res, 200, "Tha product has been created successfully!", false, newProduct)
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};


export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id, title, price, description, colors, sizes, discount,
            more_details, categoryId, subcategoryId, stock, images, videos, isActive, priceByRole,
            slug: requestedSlug, metaTitle, metaDescription } = req.body;

    if (typeof id !== "string" || !id.trim()) return errorHandler(res, 400, "Product id is required", true);
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, "Product not found");

    // Same guard as create — only reject when the caller actually sent a
    // price/discount; omitted fields (undefined) leave the existing value.
    if (price !== undefined) {
      const priceNum = parseFiniteNumber(price);
      if (priceNum === null || priceNum <= 0) {
        return errorHandler(res, 400, "Price must be a valid number greater than 0", true)
      }
    }
    if (discount !== undefined) {
      const discountNum = parseFiniteNumber(discount);
      if (discountNum === null || discountNum < 0 || discountNum > 100) {
        return errorHandler(res, 400, "Discount must be a valid number between 0 and 100", true)
      }
    }
    if (stock !== undefined && parseNonNegativeInteger(stock) === null) {
      return errorHandler(res, 400, "Stock must be a non-negative whole number", true);
    }
    if (isActive !== undefined && typeof isActive !== "boolean") {
      return errorHandler(res, 400, "isActive must be a boolean", true);
    }
    if (title !== undefined && (typeof title !== "string" || !title.trim())) {
      return errorHandler(res, 400, "Title cannot be blank", true);
    }

    // Slug only changes when the admin explicitly edits it — unlike the
    // title, it's never silently regenerated, since a live product link
    // may already be shared/indexed with the current text.
    const slug = typeof requestedSlug === "string" && requestedSlug.trim()
      ? await buildUniqueProductSlug(requestedSlug.trim(), id)
      : undefined;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: typeof title === "string" ? title.trim() : undefined,
        price: price !== undefined ? parseFiniteNumber(price) as number : undefined,
        description,
        colors,
        sizes,
        discount: discount !== undefined ? parseFiniteNumber(discount) as number : undefined,
        more_details,
        categoryId,
        subcategoryId,
        stock: stock !== undefined ? parseNonNegativeInteger(stock) as number : undefined,
        images,
        videos,
        isActive,
        slug,
        metaTitle: metaTitle !== undefined ? (metaTitle || null) : undefined,
        metaDescription: metaDescription !== undefined ? (metaDescription || null) : undefined,
      },
    });
    await savePriceOverrides(id, priceByRole);
    return errorHandler(res, 200, "Product updated successfully", false, updated);
  } catch (error: any) {
    return errorHandler(res, 500, error.message);
  }
};



export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        if (!id) return errorHandler(res, 404, "Product id is required!");
        const existingProduct = await prisma.product.findUnique({ where: { id: id } });
        if (!existingProduct) return errorHandler(res, 404, "The product not found!");

        // Soft delete only — a hard delete would violate foreign key
        // constraints from any existing OrderItem/CartItem/Reviews rows, and
        // break every part of the pricing engine and order history that still
        // references this product. The rest of the app already filters on
        // deletedAt/isActive (trade catalogue, order builders, etc).
        const product = await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        return errorHandler(res, 200, "The product has been deleted!", false, product);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};
export const duplicateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.body;
        if (typeof id !== "string" || !id.trim()) return errorHandler(res, 400, "Product id is required", true);

        const source = await prisma.product.findUnique({ where: { id } });
        if (!source) return errorHandler(res, 404, "Product not found");
        const sourcePriceOverrides = await prisma.priceOverride.findMany({ where: { productId: id } });

        const title = `${source.title} (Copy)`;
        const slug = await buildUniqueProductSlug(title);

        const duplicate = await prisma.product.create({
            data: {
                title,
                images: source.images,
                videos: source.videos,
                description: source.description,
                price: source.price,
                discount: source.discount,
                stock: source.stock,
                colors: source.colors,
                categoryId: source.categoryId,
                // Starts inactive so the duplicate can be reviewed/edited
                // before it appears alongside the original in the storefront.
                isActive: false,
                sizes: source.sizes,
                subcategoryId: source.subcategoryId,
                absorbency: source.absorbency,
                keyFeatures: source.keyFeatures,
                pack: source.pack,
                pricingNotes: source.pricingNotes,
                more_details: source.more_details as any,
                slug,
                metaTitle: source.metaTitle,
                metaDescription: source.metaDescription,
            },
        });

        if (sourcePriceOverrides.length > 0) {
            await prisma.priceOverride.createMany({
                data: sourcePriceOverrides.map((override) => ({
                    productId: duplicate.id,
                    role: override.role,
                    price: override.price,
                })),
            });
        }

        return errorHandler(res, 200, "Product duplicated successfully!", false, duplicate);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

export const getProductDetails = async (req: AuthRequest, res: Response) => {
    try {
        // ✅ Extract id from req.query (not req.params, not req.query alone)
        const { id } = req.body;

        console.log("Extracted id:", id, "type:", typeof id);

        if (!id || typeof id !== 'string') {
            return errorHandler(res, 400, "Valid product id is required");
        }

        const existingProduct = await prisma.product.findFirst({
            where: { id, isActive: true, deletedAt: null }
        });

        if (!existingProduct) {
            return errorHandler(res, 404, "Product not found");
        }

        const role = await getViewerRole(req.userId);
        const [withPrice] = await attachDisplayPrices([existingProduct], role, req.userId);
        return errorHandler(res, 200, "Product retrieved successfully", false, withPrice);
    } catch (error: any) {
        console.error("Product details error:", error);
        return errorHandler(res, 500, error.message || "Internal server error", true);
    }
};


export const getProductsBySubcategory = async (req: AuthRequest, res: Response) => {
  try {
    const { subcategoryId } = req.body;
    if (!subcategoryId) return errorHandler(res, 400, "Subcategory ID required");

    const products = await prisma.product.findMany({
      where: { subcategoryId, isActive: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { category: true, subcategory: true },
    });
    const role = await getViewerRole(req.userId);
    const withPrices = await attachDisplayPrices(products, role, req.userId);
    return errorHandler(res, 200, "Products fetched", false, withPrices);
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "internal server error");
  }
};


export const getAllProductDetails = async (req: AuthRequest, res: Response) => {
    try {
        const allProducts = await prisma.product.findMany({ where: { isActive: true, deletedAt: null } });
        if (!allProducts) return errorHandler(res, 404, "Products not found!");
        const role = await getViewerRole(req.userId);
        const withPrices = await attachDisplayPrices(allProducts, role, req.userId);
        return errorHandler(res, 200, "The product got successfully!", false, withPrices);
    } catch (error: any) {
        return errorHandler(res, 500, error.message || "Internal server error!", true);
    }
};

export const getAllProducts = async (req: Request, res: Response) => {
  const { category, search, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
  const pagination = parsePagination(page, limit);
  if (!pagination) return errorHandler(res, 400, "page and limit must be positive whole numbers (limit 100 max)", true);
  const parsedMin = minPrice === undefined ? null : parseFiniteNumber(minPrice);
  const parsedMax = maxPrice === undefined ? null : parseFiniteNumber(maxPrice);
  if ((minPrice !== undefined && (parsedMin === null || parsedMin < 0)) ||
      (maxPrice !== undefined && (parsedMax === null || parsedMax < 0)) ||
      (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax)) {
    return errorHandler(res, 400, "Invalid price range", true);
  }
  const where: any = { isActive: true, deletedAt: null };
  if (category) where.category = { slug: category };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (parsedMin !== null) where.price.gte = parsedMin;
    if (parsedMax !== null) where.price.lte = parsedMax;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'popular') orderBy = { soldCount: 'desc' }; // if you have that field

  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: pagination.skip,
    take: pagination.limit,
    include: { category: true },
  });
  const totalCount = await prisma.product.count({ where });
  res.json({ success: true, data: products, totalCount });
};


export const searchProducts = async (req: AuthRequest, res: Response) => {
  try {
    const {
      q, category, subcategory, minPrice, maxPrice, inStock, absorbency,
      sort,
      page = "1", limit = "20"
    } = req.query;

    const pagination = parsePagination(page, limit);
    if (!pagination) return errorHandler(res, 400, "page and limit must be positive whole numbers (limit 100 max)", true);
    const { skip, limit: take } = pagination;

    const parsedMin = minPrice === undefined ? null : parseFiniteNumber(minPrice);
    const parsedMax = maxPrice === undefined ? null : parseFiniteNumber(maxPrice);
    if ((minPrice !== undefined && (parsedMin === null || parsedMin < 0)) ||
        (maxPrice !== undefined && (parsedMax === null || parsedMax < 0)) ||
        (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax)) {
      return errorHandler(res, 400, "Invalid price range", true);
    }

    let where: any = { isActive: true, deletedAt: null };

    // Search on title and description
    if (q && typeof q === "string") {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      ];
    }

    // Category filter — `category` is the Category id.
    if (category && typeof category === "string") {
      where.categoryId = category;
    }

    // Subcategory filter — `subcategory` is the Subcategory id.
    if (subcategory && typeof subcategory === "string") {
      where.subcategoryId = subcategory;
    }

    // Absorbency filter — free-text field on Product, matched exactly.
    if (absorbency && typeof absorbency === "string") {
      where.absorbency = absorbency;
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (parsedMin !== null) where.price.gte = parsedMin;
      if (parsedMax !== null) where.price.lte = parsedMax;
    }

    // In stock
    if (inStock === "true") {
      where.stock = { gt: 0 };
    }

    // Sorting
    let orderBy: any = { createdAt: "desc" };
    const sortValue = sort as string;
    if (sortValue === "price_asc") orderBy = { price: "asc" };
    if (sortValue === "price_desc") orderBy = { price: "desc" };
    if (sortValue === "oldest") orderBy = { createdAt: "asc" };
    if (sortValue === "newest") orderBy = { createdAt: "desc" };

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { category: true, subcategory: true } // include for frontend
      }),
      prisma.product.count({ where })
    ]);

    const totalNoPage = Math.ceil(totalCount / take);
    const role = await getViewerRole(req.userId);
    const withPrices = await attachDisplayPrices(products, role, req.userId);

    res.json({
      success: true,
      data: withPrices,
      totalNoPage,
      totalCount
    });
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductsByCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.body;
        if (!id) return errorHandler(res, 400, "Category ID required");

        const products = await prisma.product.findMany({
            where: { categoryId: id, isActive: true, deletedAt: null },
            orderBy: { createdAt: "desc" },
        });
        const role = await getViewerRole(req.userId);
        const withPrices = await attachDisplayPrices(products, role, req.userId);
        return errorHandler(res, 200, "Products fetched", false, withPrices);
    } catch (error: any) {
        return errorHandler(res, 500, error.message);
    }
};