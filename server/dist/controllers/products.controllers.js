"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderProducts = exports.getProductsByCategory = exports.searchProducts = exports.getAllProducts = exports.getAllProductDetails = exports.getProductsBySubcategory = exports.getProductDetails = exports.duplicateProduct = exports.deleteProduct = exports.updateProduct = exports.createProduct = void 0;
const client_1 = require("@prisma/client");
const errorHandler_1 = require("../utils/errorHandler");
const prisma_1 = require("../lib/prisma");
const pricing_1 = require("../services/pricing");
const validation_1 = require("../utils/validation");
const productCollections_1 = require("../constants/productCollections");
const isValidCollectionTag = (value) => typeof value === "string" && productCollections_1.PRODUCT_COLLECTION_TAGS.includes(value);
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
};
// Purely the human-readable URL prefix — /product/[product] always resolves
// by the id suffix (see idFromSlug client-side), so this can be freely
// regenerated/edited without ever breaking an existing shared link.
const buildUniqueProductSlug = async (source, excludeId) => {
    const base = generateSlug(source) || "product";
    let finalSlug = base;
    let counter = 1;
    while (await prisma_1.prisma.product.findFirst({ where: { slug: finalSlug, ...(excludeId ? { NOT: { id: excludeId } } : {}) } })) {
        finalSlug = `${base}-${counter++}`;
    }
    return finalSlug;
};
// Validates the admin form's variants payload (an array of {label, price}
// rows for the SIZE picker — different sizes/weights/pack options, each
// independently priced) before it's ever written to the database. Returns
// null for "no variants sent" (leave/clear, handled by the caller) or throws
// a plain string message for the first row that doesn't make sense.
const parseVariantsInput = (raw) => {
    if (raw === undefined || raw === null)
        return null;
    if (!Array.isArray(raw))
        throw new Error("Variants must be a list of {label, price} rows");
    return raw.map((v, idx) => {
        const label = typeof v?.label === "string" ? v.label.trim() : "";
        if (!label)
            throw new Error(`Variant #${idx + 1} needs a label (e.g. "180g" or "Set of 3")`);
        const price = (0, validation_1.parseFiniteNumber)(v?.price);
        if (price === null || price <= 0)
            throw new Error(`Variant "${label}" needs a price greater than 0`);
        const hasStock = v?.stock !== undefined && v?.stock !== null && v?.stock !== "";
        const parsedStock = hasStock ? (0, validation_1.parseNonNegativeInteger)(v.stock) : undefined;
        if (hasStock && parsedStock === null) {
            throw new Error(`Variant "${label}"'s stock must be a non-negative whole number`);
        }
        return parsedStock !== undefined && parsedStock !== null ? { label, price, stock: parsedStock } : { label, price };
    });
};
// Validates the admin form's swatches payload (an array of {name, image}
// rows for the image-based COLOR/FLAVOR picker) before it's ever written to
// the database. Same null-means-"not sent" / throws-a-message-on-bad-row
// contract as parseVariantsInput above.
const parseSwatchesInput = (raw) => {
    if (raw === undefined || raw === null)
        return null;
    if (!Array.isArray(raw))
        throw new Error("Swatches must be a list of {name, image} rows");
    return raw.map((s, idx) => {
        const name = typeof s?.name === "string" ? s.name.trim() : "";
        if (!name)
            throw new Error(`Swatch #${idx + 1} needs a name (e.g. "Red" or "Vanilla")`);
        const image = typeof s?.image === "string" ? s.image.trim() : "";
        if (!image)
            throw new Error(`Swatch "${name}" needs an image`);
        return { name, image };
    });
};
const createProduct = async (req, res) => {
    try {
        const { title, price, description, colors, sizes, discount, more_details, category, stock, images, videos, categoryId, subcategoryId, variants, swatchLabel, swatches, slug: requestedSlug, metaTitle, metaDescription, collectionTag } = req.body;
        if (typeof title !== "string" || !title.trim() || price === undefined || price === null || price === "") {
            return (0, errorHandler_1.errorHandler)(res, 400, "Please provide the required fields", true);
        }
        // Reject NaN/negative price or discount — a bad value here corrupts
        // every quote/order total downstream (they'd all silently become NaN).
        const priceNum = (0, validation_1.parseFiniteNumber)(price);
        const discountNum = discount === undefined || discount === null || discount === "" ? 0 : (0, validation_1.parseFiniteNumber)(discount);
        const stockNum = (0, validation_1.parseNonNegativeInteger)(stock ?? 0);
        if (priceNum === null || priceNum <= 0) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Price must be a valid number greater than 0", true);
        }
        if (discountNum === null || discountNum < 0 || discountNum > 100) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Discount must be a valid number between 0 and 100", true);
        }
        if (stockNum === null) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Stock must be a non-negative whole number", true);
        }
        if (collectionTag && !isValidCollectionTag(collectionTag)) {
            return (0, errorHandler_1.errorHandler)(res, 400, `Collection tag must be one of: ${productCollections_1.PRODUCT_COLLECTION_TAGS.join(", ")}`, true);
        }
        let variantRows;
        try {
            variantRows = parseVariantsInput(variants);
        }
        catch (e) {
            return (0, errorHandler_1.errorHandler)(res, 400, e.message, true);
        }
        let swatchRows;
        try {
            swatchRows = parseSwatchesInput(swatches);
        }
        catch (e) {
            return (0, errorHandler_1.errorHandler)(res, 400, e.message, true);
        }
        const swatchLabelTrimmed = typeof swatchLabel === "string" ? swatchLabel.trim() : "";
        if (swatchLabelTrimmed && (!swatchRows || swatchRows.length === 0)) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Add at least one swatch, or clear the Color/Flavor label", true);
        }
        if (!swatchLabelTrimmed && swatchRows && swatchRows.length > 0) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Name this picker (e.g. Color or Flavor) before adding swatches", true);
        }
        const slug = await buildUniqueProductSlug(typeof requestedSlug === "string" && requestedSlug.trim() ? requestedSlug.trim() : title.trim());
        // New products append to the end of the manual sort order rather than
        // all defaulting to 0, so they don't jump to the front of every list.
        const { _max } = await prisma_1.prisma.product.aggregate({ _max: { position: true } });
        const position = (_max.position ?? -1) + 1;
        const newProduct = await prisma_1.prisma.product.create({
            data: {
                title: title.trim(), price: priceNum, description, colors, sizes, discount: discountNum, more_details, category, stock: stockNum, images, videos: videos || [], categoryId, subcategoryId, slug, metaTitle: metaTitle || null, metaDescription: metaDescription || null, collectionTag: collectionTag || null,
                variants: variantRows && variantRows.length > 0 ? variantRows : undefined,
                swatchLabel: swatchLabelTrimmed || null,
                swatches: swatchRows && swatchRows.length > 0 ? swatchRows : undefined,
                position,
            }
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Tha product has been created successfully!", false, newProduct);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id, title, price, description, colors, sizes, discount, more_details, categoryId, subcategoryId, stock, images, videos, isActive, variants, swatchLabel, swatches, slug: requestedSlug, metaTitle, metaDescription, collectionTag } = req.body;
        if (typeof id !== "string" || !id.trim())
            return (0, errorHandler_1.errorHandler)(res, 400, "Product id is required", true);
        const existing = await prisma_1.prisma.product.findUnique({ where: { id } });
        if (!existing)
            return (0, errorHandler_1.errorHandler)(res, 404, "Product not found");
        // Same guard as create — only reject when the caller actually sent a
        // price/discount; omitted fields (undefined) leave the existing value.
        if (price !== undefined) {
            const priceNum = (0, validation_1.parseFiniteNumber)(price);
            if (priceNum === null || priceNum <= 0) {
                return (0, errorHandler_1.errorHandler)(res, 400, "Price must be a valid number greater than 0", true);
            }
        }
        if (discount !== undefined) {
            const discountNum = (0, validation_1.parseFiniteNumber)(discount);
            if (discountNum === null || discountNum < 0 || discountNum > 100) {
                return (0, errorHandler_1.errorHandler)(res, 400, "Discount must be a valid number between 0 and 100", true);
            }
        }
        if (stock !== undefined && (0, validation_1.parseNonNegativeInteger)(stock) === null) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Stock must be a non-negative whole number", true);
        }
        if (isActive !== undefined && typeof isActive !== "boolean") {
            return (0, errorHandler_1.errorHandler)(res, 400, "isActive must be a boolean", true);
        }
        if (title !== undefined && (typeof title !== "string" || !title.trim())) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Title cannot be blank", true);
        }
        // Empty string/null clears the tag; anything else must be a known value.
        if (collectionTag !== undefined && collectionTag && !isValidCollectionTag(collectionTag)) {
            return (0, errorHandler_1.errorHandler)(res, 400, `Collection tag must be one of: ${productCollections_1.PRODUCT_COLLECTION_TAGS.join(", ")}`, true);
        }
        // undefined = leave untouched; null/[] = clear; anything else validated below.
        let variantRows;
        try {
            variantRows = variants !== undefined ? parseVariantsInput(variants) : undefined;
        }
        catch (e) {
            return (0, errorHandler_1.errorHandler)(res, 400, e.message, true);
        }
        let swatchRows;
        try {
            swatchRows = swatches !== undefined ? parseSwatchesInput(swatches) : undefined;
        }
        catch (e) {
            return (0, errorHandler_1.errorHandler)(res, 400, e.message, true);
        }
        // Validate the label+swatches pair stays consistent, accounting for
        // whichever half of the pair this request actually touches.
        const swatchLabelProvided = swatchLabel !== undefined;
        const newSwatchLabelTrimmed = swatchLabelProvided ? (typeof swatchLabel === "string" ? swatchLabel.trim() : "") : undefined;
        const effectiveSwatchLabel = swatchLabelProvided ? newSwatchLabelTrimmed : (existing.swatchLabel || "");
        const effectiveSwatches = swatchRows !== undefined ? swatchRows : (Array.isArray(existing.swatches) ? existing.swatches : null);
        if (effectiveSwatchLabel && (!effectiveSwatches || effectiveSwatches.length === 0)) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Add at least one swatch, or clear the Color/Flavor label", true);
        }
        if (!effectiveSwatchLabel && effectiveSwatches && effectiveSwatches.length > 0) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Name this picker (e.g. Color or Flavor) before adding swatches", true);
        }
        // Slug only changes when the admin explicitly edits it — unlike the
        // title, it's never silently regenerated, since a live product link
        // may already be shared/indexed with the current text.
        const slug = typeof requestedSlug === "string" && requestedSlug.trim()
            ? await buildUniqueProductSlug(requestedSlug.trim(), id)
            : undefined;
        const updated = await prisma_1.prisma.product.update({
            where: { id },
            data: {
                title: typeof title === "string" ? title.trim() : undefined,
                price: price !== undefined ? (0, validation_1.parseFiniteNumber)(price) : undefined,
                description,
                colors,
                sizes,
                discount: discount !== undefined ? (0, validation_1.parseFiniteNumber)(discount) : undefined,
                more_details,
                categoryId,
                subcategoryId,
                stock: stock !== undefined ? (0, validation_1.parseNonNegativeInteger)(stock) : undefined,
                images,
                videos,
                isActive,
                slug,
                collectionTag: collectionTag !== undefined ? (collectionTag || null) : undefined,
                variants: variantRows !== undefined ? (variantRows && variantRows.length > 0 ? variantRows : client_1.Prisma.JsonNull) : undefined,
                swatchLabel: swatchLabelProvided ? (newSwatchLabelTrimmed || null) : undefined,
                swatches: swatchRows !== undefined ? (swatchRows && swatchRows.length > 0 ? swatchRows : client_1.Prisma.JsonNull) : undefined,
                metaTitle: metaTitle !== undefined ? (metaTitle || null) : undefined,
                metaDescription: metaDescription !== undefined ? (metaDescription || null) : undefined,
            },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Product updated successfully", false, updated);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 404, "Product id is required!");
        const existingProduct = await prisma_1.prisma.product.findUnique({ where: { id: id } });
        if (!existingProduct)
            return (0, errorHandler_1.errorHandler)(res, 404, "The product not found!");
        // Soft delete only — a hard delete would violate foreign key
        // constraints from any existing OrderItem/CartItem/Reviews rows, and
        // break every part of the pricing engine and order history that still
        // references this product. The rest of the app already filters on
        // deletedAt/isActive (trade catalogue, order builders, etc).
        const product = await prisma_1.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "The product has been deleted!", false, product);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.deleteProduct = deleteProduct;
const duplicateProduct = async (req, res) => {
    try {
        const { id } = req.body;
        if (typeof id !== "string" || !id.trim())
            return (0, errorHandler_1.errorHandler)(res, 400, "Product id is required", true);
        const source = await prisma_1.prisma.product.findUnique({ where: { id } });
        if (!source)
            return (0, errorHandler_1.errorHandler)(res, 404, "Product not found");
        const title = `${source.title} (Copy)`;
        const slug = await buildUniqueProductSlug(title);
        const { _max } = await prisma_1.prisma.product.aggregate({ _max: { position: true } });
        const position = (_max.position ?? -1) + 1;
        const duplicate = await prisma_1.prisma.product.create({
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
                more_details: source.more_details,
                slug,
                metaTitle: source.metaTitle,
                metaDescription: source.metaDescription,
                collectionTag: source.collectionTag,
                variants: source.variants,
                swatchLabel: source.swatchLabel,
                swatches: source.swatches,
                position,
            },
        });
        return (0, errorHandler_1.errorHandler)(res, 200, "Product duplicated successfully!", false, duplicate);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.duplicateProduct = duplicateProduct;
const getProductDetails = async (req, res) => {
    try {
        // ✅ Extract id from req.query (not req.params, not req.query alone)
        const { id } = req.body;
        console.log("Extracted id:", id, "type:", typeof id);
        if (!id || typeof id !== 'string') {
            return (0, errorHandler_1.errorHandler)(res, 400, "Valid product id is required");
        }
        const existingProduct = await prisma_1.prisma.product.findFirst({
            where: { id, isActive: true, deletedAt: null },
            include: { category: true, subcategory: true },
        });
        if (!existingProduct) {
            return (0, errorHandler_1.errorHandler)(res, 404, "Product not found");
        }
        const [withPrice] = (0, pricing_1.attachDisplayPrices)([existingProduct]);
        return (0, errorHandler_1.errorHandler)(res, 200, "Product retrieved successfully", false, withPrice);
    }
    catch (error) {
        console.error("Product details error:", error);
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error", true);
    }
};
exports.getProductDetails = getProductDetails;
const getProductsBySubcategory = async (req, res) => {
    try {
        const { subcategoryId } = req.body;
        if (!subcategoryId)
            return (0, errorHandler_1.errorHandler)(res, 400, "Subcategory ID required");
        const products = await prisma_1.prisma.product.findMany({
            where: { subcategoryId, isActive: true, deletedAt: null },
            orderBy: [{ position: "asc" }, { createdAt: "desc" }],
            include: { category: true, subcategory: true },
        });
        const withPrices = (0, pricing_1.attachDisplayPrices)(products);
        return (0, errorHandler_1.errorHandler)(res, 200, "Products fetched", false, withPrices);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "internal server error");
    }
};
exports.getProductsBySubcategory = getProductsBySubcategory;
const getAllProductDetails = async (req, res) => {
    try {
        const allProducts = await prisma_1.prisma.product.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        });
        if (!allProducts)
            return (0, errorHandler_1.errorHandler)(res, 404, "Products not found!");
        const withPrices = (0, pricing_1.attachDisplayPrices)(allProducts);
        return (0, errorHandler_1.errorHandler)(res, 200, "The product got successfully!", false, withPrices);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.getAllProductDetails = getAllProductDetails;
const getAllProducts = async (req, res) => {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
    const pagination = (0, validation_1.parsePagination)(page, limit);
    if (!pagination)
        return (0, errorHandler_1.errorHandler)(res, 400, "page and limit must be positive whole numbers (limit 100 max)", true);
    const parsedMin = minPrice === undefined ? null : (0, validation_1.parseFiniteNumber)(minPrice);
    const parsedMax = maxPrice === undefined ? null : (0, validation_1.parseFiniteNumber)(maxPrice);
    if ((minPrice !== undefined && (parsedMin === null || parsedMin < 0)) ||
        (maxPrice !== undefined && (parsedMax === null || parsedMax < 0)) ||
        (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax)) {
        return (0, errorHandler_1.errorHandler)(res, 400, "Invalid price range", true);
    }
    const where = { isActive: true, deletedAt: null };
    if (category)
        where.category = { slug: category };
    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (minPrice || maxPrice) {
        where.price = {};
        if (parsedMin !== null)
            where.price.gte = parsedMin;
        if (parsedMax !== null)
            where.price.lte = parsedMax;
    }
    let orderBy = [{ position: 'asc' }, { createdAt: 'desc' }];
    if (sort === 'price_asc')
        orderBy = { price: 'asc' };
    if (sort === 'price_desc')
        orderBy = { price: 'desc' };
    if (sort === 'popular')
        orderBy = { soldCount: 'desc' }; // if you have that field
    const products = await prisma_1.prisma.product.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
        include: { category: true },
    });
    const totalCount = await prisma_1.prisma.product.count({ where });
    res.json({ success: true, data: products, totalCount });
};
exports.getAllProducts = getAllProducts;
const searchProducts = async (req, res) => {
    try {
        const { q, category, subcategory, minPrice, maxPrice, inStock, absorbency, collectionTag, sort, page = "1", limit = "20" } = req.query;
        const pagination = (0, validation_1.parsePagination)(page, limit);
        if (!pagination)
            return (0, errorHandler_1.errorHandler)(res, 400, "page and limit must be positive whole numbers (limit 100 max)", true);
        const { skip, limit: take } = pagination;
        const parsedMin = minPrice === undefined ? null : (0, validation_1.parseFiniteNumber)(minPrice);
        const parsedMax = maxPrice === undefined ? null : (0, validation_1.parseFiniteNumber)(maxPrice);
        if ((minPrice !== undefined && (parsedMin === null || parsedMin < 0)) ||
            (maxPrice !== undefined && (parsedMax === null || parsedMax < 0)) ||
            (parsedMin !== null && parsedMax !== null && parsedMin > parsedMax)) {
            return (0, errorHandler_1.errorHandler)(res, 400, "Invalid price range", true);
        }
        let where = { isActive: true, deletedAt: null };
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
        // Collection tag filter — powers the home page's New Arrivals / Best
        // Seller / Combo Package strips and their "explore" links.
        if (collectionTag && typeof collectionTag === "string" && isValidCollectionTag(collectionTag)) {
            where.collectionTag = collectionTag;
        }
        // Price range
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (parsedMin !== null)
                where.price.gte = parsedMin;
            if (parsedMax !== null)
                where.price.lte = parsedMax;
        }
        // In stock
        if (inStock === "true") {
            where.stock = { gt: 0 };
        }
        // Sorting
        let orderBy = [{ position: "asc" }, { createdAt: "desc" }];
        const sortValue = sort;
        if (sortValue === "price_asc")
            orderBy = { price: "asc" };
        if (sortValue === "price_desc")
            orderBy = { price: "desc" };
        if (sortValue === "oldest")
            orderBy = { createdAt: "asc" };
        if (sortValue === "newest")
            orderBy = { createdAt: "desc" };
        const [products, totalCount] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                orderBy,
                skip,
                take,
                include: { category: true, subcategory: true } // include for frontend
            }),
            prisma_1.prisma.product.count({ where })
        ]);
        const totalNoPage = Math.ceil(totalCount / take);
        const withPrices = (0, pricing_1.attachDisplayPrices)(products);
        res.json({
            success: true,
            data: withPrices,
            totalNoPage,
            totalCount
        });
    }
    catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.searchProducts = searchProducts;
const getProductsByCategory = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id)
            return (0, errorHandler_1.errorHandler)(res, 400, "Category ID required");
        const products = await prisma_1.prisma.product.findMany({
            where: { categoryId: id, isActive: true, deletedAt: null },
            orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        });
        const withPrices = (0, pricing_1.attachDisplayPrices)(products);
        return (0, errorHandler_1.errorHandler)(res, 200, "Products fetched", false, withPrices);
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message);
    }
};
exports.getProductsByCategory = getProductsByCategory;
// Admin only: persists the product list's drag-and-drop order. Takes the
// full list of ids in their new order and assigns each one a position equal
// to its index — simplest correct approach, since the admin list always
// sends every row it has (no partial reorders).
const reorderProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string" || !id.trim())) {
            return (0, errorHandler_1.errorHandler)(res, 400, "ids must be a list of product ids", true);
        }
        await prisma_1.prisma.$transaction(ids.map((id, index) => prisma_1.prisma.product.update({ where: { id }, data: { position: index } })));
        return (0, errorHandler_1.errorHandler)(res, 200, "Product order updated", false, { count: ids.length });
    }
    catch (error) {
        return (0, errorHandler_1.errorHandler)(res, 500, error.message || "Internal server error!", true);
    }
};
exports.reorderProducts = reorderProducts;
