
import { basket, discreet, doctor, drop, home_post, home_post1, home_post2, repeat, return_box, speedy } from "@/assets"
import { FaHome, FaNewspaper } from "react-icons/fa"
import { FaCartFlatbedSuitcase, FaUsersGear } from "react-icons/fa6";
import { RiArticleFill, RiPriceTag2Fill } from "react-icons/ri"
import { AiFillDashboard, AiFillProduct } from "react-icons/ai";
import { GrArticle } from "react-icons/gr";
import { MdCategory, MdReviews, MdTaskAlt, MdOutlinePendingActions, MdSchool, MdForum, MdHelp, MdReceiptLong, MdInventory } from "react-icons/md"







export const adminNavItems = [
    {
        label: "Dashboard",
        path: "/admin",
        icon: AiFillDashboard,
    },
    {
        label: "Team Tasks",
        icon: MdTaskAlt,
        path: "/admin/tasks",
    },
    {
        label: "Waitlist",
        icon: MdOutlinePendingActions,
        path: "/admin/waitlist",
    },
    {
        label: "All Users",
        icon: FaUsersGear,
        path: "/admin/users"
    },
    {
        label: "Reports",
        icon: AiFillDashboard,
        path: "/admin/reports",
    },
    {
        label: "Orders",
        icon: FaCartFlatbedSuitcase,
        path: "/admin/orders"
    },
    {
        label: "Products",
        icon: AiFillProduct,
        path: "/admin/products",
    },

    {
        label: "Blogs",
        icon: GrArticle,
        path: "/admin/blogs"
        // ]
    },
    {
        label: "Categories",
        icon: MdCategory,
        path: "/admin/categories",
    },
        {
        label: "Subcategories",
        icon: MdCategory,
        path: "/admin/subcategories",
    },
    {
        label: "Enquiries",
        icon: FaNewspaper,
        path: "/admin/enquiries",
    },
    {
        label: "Reviews",
        icon: MdReviews,
        path: "/admin/reviews",
    },
    {
        label: "Testimonials",
        icon: MdReviews,
        path: "/admin/testimonials",
    },
    {
        label: "Contact",
        icon: FaNewspaper,
        path: "/admin/admin-contact",
    },
    {
        label: "Reddit Feed",
        icon: MdForum,
        path: "/admin/reddit-posts",
    },
    {
        label: "FAQs",
        icon: MdHelp,
        path: "/admin/faqs",
    }
]

export const footer_nav_items = [
    {
        label: "Shop Now",
        options: [
            { label: "Men", path: "/men" },
            { label: "Women", path: "/women" },
            { label: "Family Carers", path: "/family-carers" },
            { label: "Product Finder", path: "/product-finder" },
        ]
    },
    // {
    //     label: "Advice & Support",
    //     options: [
    //         { label: "Understanding Incontinence", path: "/understanding-incontinence" },
    //         { label: "Living with Incontinence", path: "/living-with-incontinence" },
    //         { label: "Treatment & Management", path: "/treatment-management" },
    //         { label: "Exercise Zone", path: "/exercise-zone" },
    //         { label: "Carers & Specialists", path: "/carers-specialists" },
    //     ]
    // },
    {
        label: "Company",
        options: [
            { label: "About Touhfaye", path: "/about-aidble" },
            { label: "Sustainability", path: "/sustainability" },
            { label: "Professionals", path: "/professionals" },
            { label: "Privacy Policy", path: "/privacy-policy" },
            { label: "Delivery & Returns", path: "/delivery-returns" },
        ]
    },
    {
        label: "Get in touch",
        options: [
            { label: "Send us a message", path: "/contact-us" },
            { label: "Facebook", path: "/facebook" },
            { label: "Instagram", path: "/support-coordination" },
            { label: "Facebook", path: "/assist-in-self-care" },
            { label: "Whatsapp", path: "/assist-in-transport" },
        ]
    },

]

export const infographic_cards = {
    hero: [
        { label: "Product Finder", subtitle: "Find what suits you best", icon: drop, path: "/products" },
        { label: "Get Advice", subtitle: "Evidence-based care guides", icon: doctor, path: "/blog" },
        { label: "Shop Now", subtitle: "Browse our full range", icon: basket, path: "/products" },
    ],
    policies: [
        { label: "Easy Ordering", subtitle: "Simple checkout process", icon: repeat, path: "/" },
        { label: "Direct Delivery", subtitle: "Fast Australia-wide shipping", icon: speedy, path: "/" },
        { label: "Discreet Packaging", subtitle: "Private & confidential", icon: discreet, path: "/" },
        { label: "Easy Returns", subtitle: "Hassle-free returns", icon: return_box, path: "/" },
    ]
}

export const home_posts = [
    {
        title: "Explore TENA's Incontinence Range", subtitle: "",
        buttons: [{ label: "Shop Now", path: "/products" }],
        image: home_post,
        paragraph: "TENA offers a range of incontinence pads and products that provide expert protection, ensuring you stay secure, dry, and odour-free day and night."
    },
    {
        title: "Advice & Support", subtitle: "Our Community",
        buttons: [{ label: "Learn more", path: "/blog" }],
        image: home_post1,
        paragraph: "Understand more about incontinence, including its causes and treatment options, will enable you to make an informed decision about your choices"
    },
    {
        title: "Use our Product Finder to choose what suits you best", subtitle: "",
        buttons: [{ label: "Shop now", path: "/products" }, { label: "Learn more", path: "/products" }],
        image: home_post2,
        paragraph: " This Product Finder has been designed to identify the most suitable product based on the answers to the questions about your situation."
    }

]