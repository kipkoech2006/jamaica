# Jamaica Hotel & Restaurant

A mobile-first customer ordering portal and live waiter order dashboard built with React, Vite, Tailwind CSS, and Lucide icons.

## Run locally

1. Install frontend dependencies with `npm install`.
2. Start the Java API from `../java-backend` with `mvn spring-boot:run`.
3. Start the frontend with `npm run dev`.
4. Open `/order` to browse the menu and place an order, or `/waiter/dashboard` to manage incoming orders.

The Vite development server proxies `/api` requests to the Java API on port `8081`. The waiter dashboard refreshes orders every three seconds. Enable browser sound from the dashboard to hear a chime for new orders.

## WhatsApp setup

Set `VITE_WAITER_PHONE` in a local `.env` file to the restaurant's WhatsApp number, including the country code and without a leading `+` (for example, `2547XXXXXXXX`). The checkout field is prefilled from this setting and can be edited per order.

Location sharing requires browser permission and a secure context; `localhost` is supported during development. Customers can still place an order without sharing coordinates.

## Order API

- `GET /api/orders` lists recent orders.
- `POST /api/orders` creates an order from menu item IDs and quantities.
- `PUT /api/orders/{id}/status` updates an order to `PENDING`, `IN_PREPARATION`, `DELIVERED`, or `CANCELLED`.
