import { Router } from "express";
import { addToCart, deleteCartItem, getCart, mergeCartAfterLogin, updateCartItem } from "../controllers/cart.controllers";
import { auth, optionalAuth } from "../middlewares/auth";


const router = Router()

// Cart works for BOTH guests and signed-in users — optionalAuth attaches the
// userId when logged in, otherwise the controller uses the guest cart cookie.
router.get("/get-cart", optionalAuth, getCart);
router.post("/add-cart", optionalAuth, addToCart);
router.put("/update-cart", optionalAuth, updateCartItem);
router.delete("/delete-cart", optionalAuth, deleteCartItem)

// Merge only makes sense once signed in.
router.post('/merge-cart', auth, mergeCartAfterLogin);



export default router;