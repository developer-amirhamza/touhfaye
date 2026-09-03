import { Request, Response } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { PRICE_OVERRIDE_ROLES } from "../middlewares/role";
import { attachDisplayPrices, getViewerRole } from "../services/pricing";

interface AuthRequest extends Request {
    userId?: string;
}

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
            const value = raw === "" || raw === null || raw === undefined ? null : Number(raw);
            if (value !== null && Number.isFinite(value) && value > 0) {
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
        const { title, price, description, colors, sizes, discount, more_details, category, stock, images,categoryId, subcategoryId, priceByRole } = req.body;
        if (!title || !price ) {
            return errorHandler(res, 400, "Please provide the required fields", true)
        }
        // Reject NaN/negative price or discount — a bad value here corrupts
        // every quote/order total downstream (they'd all silently become NaN).
        const priceNum = Number(price);
        const discountNum = Number(discount);
        if (!Number.isFinite(priceNum) || priceNum <= 0) {
            return errorHandler(res, 400, "Price must be a valid number greater than 0", true)
        }
        if (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > 100) {
            return errorHandler(res, 400, "Discount must be a valid number between 0 and 100", true)
        }

        const newProduct = await prisma.product.create({
            data: { title, price: priceNum, description, colors, sizes, discount: discountNum, more_details, category, stock, images,categoryId, subcategoryId }
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
            more_details, categoryId, subcategoryId, stock, images, isActive, priceByRole } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return errorHandler(res, 404, "Product not found");

    // Same guard as create — only reject when the caller actually sent a
    // price/discount; omitted fields (undefined) leave the existing value.
    if (price !== undefined) {
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        return errorHandler(res, 400, "Price must be a valid number greater than 0", true)
      }
    }
    if (discount !== undefined) {
      const discountNum = Number(discount);
      if (!Number.isFinite(discountNum) || discountNum < 0 || discountNum > 100) {
        return errorHandler(res, 400, "Discount must be a valid number between 0 and 100", true)
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title,
        price: price !== undefined ? Number(price) : undefined,
        description,
        colors,
        sizes,
        discount: discount !== undefined ? Number(discount) : undefined,
        more_details,
        categoryId,
        subcategoryId,
        stock,
        images,
        isActive,
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
export const getProductDetails = async (req: AuthRequest, res: Response) => {
    try {
        // ✅ Extract id from req.query (not req.params, not req.query alone)
        const { id } = req.body;

        console.log("Extracted id:", id, "type:", typeof id);

        if (!id || typeof id !== 'string') {
            return errorHandler(res, 400, "Valid product id is required");
        }

        const existingProduct = await prisma.product.findUnique({
            where: { id: id }
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
      where: { subcategoryId, isActive: true },
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
        const allProducts = await prisma.product.findMany({ where: { isActive: true } });
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
  const where: any = { isActive: true };
  if (category) where.category = { slug: category };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice as string);
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  if (sort === 'price_desc') orderBy = { price: 'desc' };
  if (sort === 'popular') orderBy = { soldCount: 'desc' }; // if you have that field

  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
    include: { category: true },
  });
  const totalCount = await prisma.product.count({ where });
  res.json({ success: true, data: products, totalCount });
};


export const searchProducts = async (req: AuthRequest, res: Response) => {
  try {
    const {
      q, category, minPrice, maxPrice, inStock, absorbency,
      sort,
      page = "1", limit = "20"
    } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    let where: any = { isActive: true };

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

    // Absorbency filter — free-text field on Product, matched exactly.
    if (absorbency && typeof absorbency === "string") {
      where.absorbency = absorbency;
    }

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
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
            where: { categoryId: id,  isActive: true },
            orderBy: { createdAt: "desc" },
        });
        const role = await getViewerRole(req.userId);
        const withPrices = await attachDisplayPrices(products, role, req.userId);
        return errorHandler(res, 200, "Products fetched", false, withPrices);
    } catch (error: any) {
        return errorHandler(res, 500, error.message);
    }
};