
import { basket, discreet, doctor, drop, home_post, home_post1, home_post2, repeat, return_box, speedy } from "@/assets"
import banner1 from "@/assets/banners/banner1.webp"
import banner2 from "@/assets/banners/banner2.webp"
import banner3 from "@/assets/banners/banner3.webp"
import banner4 from "@/assets/banners/banner4.webp"
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
        label: "Applications",
        icon: FaUsersGear,
        path: "/admin/applications",
    },
    {
        label: "Reports",
        icon: AiFillDashboard,
        path: "/admin/reports",
    },
    {
        label: "Pricing",
        icon: RiPriceTag2Fill,
        path: "/admin/pricing",
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
        label: "Articles",
        icon: RiArticleFill,
        path: "/admin/articles",
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
        label: "Training Sessions",
        icon: MdSchool,
        path: "/admin/training-sessions",
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
    },
    {
        label: "SC Billing",
        icon: MdReceiptLong,
        path: "/admin/sc-billing",
    },
    {
        label: "Portal Resources",
        icon: MdInventory,
        path: "/admin/portal-resources",
    },
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
    {
        label: "Advice & Support",
        options: [
            { label: "Understanding Incontinence", path: "/understanding-incontinence" },
            { label: "Living with Incontinence", path: "/living-with-incontinence" },
            { label: "Treatment & Management", path: "/treatment-management" },
            { label: "Exercise Zone", path: "/exercise-zone" },
            { label: "Carers & Specialists", path: "/carers-specialists" },
        ]
    },
    {
        label: "Company",
        options: [
            { label: "About Aidble", path: "/about-aidble" },
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

export const youarenotalone = {
  "section": "youarenotalone",
  "badge": "Did you know",
  "heading": "You are not the only one. Not even close.",
  "intro": "Over 7 million Australians live with incontinence, at every age from 40 to 100. Most improve it once they start. Bestiee is a judgement free place to start.",
  "stats": [
    {
      "value": "1 in 3",
      "description": "Australians over 15 experience incontinence. That is more than 7 million people."
    },
    {
      "value": "Age 51",
      "description": "Is the average age of Australian women affected. Almost 4 in 10 women live with it."
    },
    {
      "value": "7 in 10",
      "description": "People with incontinence are under 65. New mums and pelvic floor changes included."
    },
    {
      "value": "Most",
      "description": "Cases can be improved or managed. Many people wait years. You do not have to."
    }
  ],
  "carousel": {
    "heading": "What makes Bestiee different, at every age",
    "subtitle": "Swipe through. Product facts first, then a guide by age group.",
    "cardSuggestLabel": "WE SUGGEST",
    "cardCtaLabel": "View details →",
    "slides": [
      {
        "tag": "Built like activewear",
        "title": "The waistband is designed to move, not just sit there",
        "body": "Bestiee's stretchable waistband is built for squats, sprints and long days on your feet. It flexes with you rather than digging in or sagging, which is why it reads as activewear rather than medical wear.",
        "suggestedProduct": "Bestiee Active Pull Up Pants",
        "productId": "pullup",
        "hasPhoto": true
      },
      {
        "tag": "Up to 17 hours",
        "title": "One pair covers a full day, or a full night",
        "body": "Bestiee Active offers up to 17 hours of protection in a single pair. That is long enough for a full workday, an overnight flight, or a whole night of sleep without a 2am change.",
        "suggestedProduct": "Bestiee Active, M, L or XXL",
        "productId": "pullup",
        "hasPhoto": true
      },
      {
        "tag": "Dermatologically tested",
        "title": "Gentle enough for daily wear on sensitive skin",
        "body": "Every pair is dermatologically tested. The breathable, soft materials are designed for wearing every day, including on skin that reacts to most things.",
        "suggestedProduct": "Bestiee Active Pull Up Pants",
        "productId": "pullup",
        "hasPhoto": true
      },
      {
        "tag": "M, L and XXL",
        "title": "A tailored fit, not one size fits most",
        "body": "Bestiee comes in M, L and XXL, so the fit is actually yours. A closer fit means a slimmer, more discreet profile under everyday clothes, and a better seal at the legs.",
        "suggestedProduct": "Check the sizing guide",
        "productId": "pullup",
        "hasPhoto": true
      },
      {
        "tag": "Every age group",
        "title": "This is not only an older person's issue",
        "body": "Studies suggest incontinence affects people across every age group, not just older adults. Bestiee was designed with that full range in mind, from active twenty somethings to confident eighty somethings.",
        "suggestedProduct": "Bestiee Active Pull Up Pants",
        "productId": "pullup",
        "hasPhoto": true
      },
      {
        "tag": "Ages 40 to 55",
        "title": "It often starts after childbirth, not after 70",
        "body": "Almost 4 in 10 Australian women live with incontinence, and the average age is 51. Pelvic floor changes after pregnancy are the most common cause. Light pads inside your own underwear are usually all you need.",
        "suggestedProduct": "Incontinence Pads L",
        "productId": "pads",
        "hasPhoto": false
      },
      {
        "tag": "Pregnant & postnatal",
        "title": "Leaks during and after pregnancy are normal",
        "body": "Pressure on the bladder in the third trimester and the weeks after birth catches most women out. Choose a breathable light or moderate pad, change it often, and use a barrier cream to protect skin.",
        "suggestedProduct": "Incontinence Pads L, moderate",
        "productId": "pads",
        "hasPhoto": false
      },
      {
        "tag": "Ages 55 to 70",
        "title": "Pull up pants feel like underwear, not a nappy",
        "body": "This is the age most people switch. Pull up pants go on the same way as briefs, hold far more than a pad, and nothing shows or rustles under clothes. Most people use pads by day and pull ups at night.",
        "suggestedProduct": "Pull Up Pants, size M or L",
        "productId": "pullup",
        "hasPhoto": false
      },
      {
        "tag": "Ages 70 to 85",
        "title": "The right overnight product means everyone sleeps",
        "body": "Using a day product overnight is the single biggest cause of broken sleep and 2am sheet changes. An overnight rated pull up plus a bed pad underneath covers a full eight hours.",
        "suggestedProduct": "Pull Up Pants overnight + Bluey bed pads",
        "productId": "bluey",
        "hasPhoto": false
      },
      {
        "tag": "Ages 85 to 100",
        "title": "For carers: build the bed in layers",
        "body": "Protector, sheet, bluey, then a second sheet and bluey on top. At 2am you strip the top two layers and the bed underneath is already made. A change takes 30 seconds instead of 15 minutes.",
        "suggestedProduct": "Leak Proof Bed Bundle",
        "productId": "bundle",
        "hasPhoto": false
      },
      {
        "tag": "For men",
        "title": "Men need a different shape, not a bigger pad",
        "body": "Male anatomy needs a shield or guard shaped product rather than a symmetrical pad. Using the wrong shape is why many men conclude that nothing works. It is the shape, not the absorbency.",
        "suggestedProduct": "Pull Up Pants, unisex fit",
        "productId": "pullup",
        "hasPhoto": false
      }
    ]
  },
  "cta": {
    "label": "Find My Products →"
  }
}
export const banner_slides = [banner1, banner2, banner3, banner4]