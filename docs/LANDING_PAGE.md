# Storefront landing page

The home page uses Satoshi throughout, including navigation, product cards,
forms, dialogs and footer. The bundled variable font is declared for weights
300–900, preloaded locally and uses font-display swap. Tailwind's default font
tokens and inherited body font use Satoshi; no external font request is needed.

Sections: configurable hero with a real catalog product, shopping benefits,
categories derived from actual products, searchable/type-filtered collection,
three-step shopping guide, optional customer reviews, optional store location,
optional FAQ, final catalog CTA and footer. Mobile navigation closes after
selection; all section links are anchored and keyboard accessible. Motion is
reduced when the visitor requests it. Hero title/image/overlay/CTA, colors,
contacts and footer continue to use Website Settings.

Reviews are managed at Dashboard → Pengaturan Website → Rating & ulasan
pelanggan. Publish only actual customer feedback. No sample testimonials are
seeded. Without entries, the section shows an honest empty state; it can also
be hidden. With entries, average stars and count are derived from those same
published reviews. There is no automatic purchase verification or rating added
to individual product cards.

Search matches product/category/tag content, category buttons filter the real
catalog, and zero/error states never invent inventory or reviews. Product
details and cart/account links retain the existing checkout flow. No database
migration or changes to orders/products are required.

Validation: TypeScript, production build and 13 regression tests pass. Browser
checks confirmed the local Satoshi font is loaded, desktop/mobile layouts have
no horizontal overflow, M650 search finds one matching product, Keyboard
category shows two matches, reset restores all nine catalog entries, and the
mobile menu closes and scrolls to the reviews anchor. The public settings API
returns empty reviews by default and rejects invalid ratings before saving.
