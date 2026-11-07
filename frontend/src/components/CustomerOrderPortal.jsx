import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  ChevronRight,
  CircleAlert,
  Clock3,
  Coffee,
  CupSoda,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Utensils,
  X,
} from 'lucide-react';
import { useOrders } from '../context/orderContextValue';

/** @typedef {import('../types').MenuItem} MenuItem */
/** @typedef {import('../types').CustomerInfo} CustomerInfo */
/** @typedef {import('../types').Order} Order */

const categories = [
  { id: 'all', label: 'All dishes', icon: Utensils },
  { id: 'breakfast', label: 'Breakfast', icon: Coffee },
  { id: 'mains', label: 'Main meals', icon: ChefHat },
  { id: 'snacks', label: 'Snacks', icon: ShoppingBag },
  { id: 'drinks', label: 'Cold drinks', icon: CupSoda },
];

const formatKes = (amount) => new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
}).format(amount);

function categoryMatches(item, category) {
  const value = (item.category || '').toLowerCase();
  if (category === 'all') return true;
  if (category === 'breakfast') return value.includes('breakfast');
  if (category === 'mains') return value.includes('main') || value.includes('traditional');
  if (category === 'snacks') return value.includes('snack');
  return value.includes('cold') || value.includes('drink');
}

function Field({ label, className = '', ...props }) {
  return (
    <label className={`grid gap-2 text-sm font-medium text-[#383c34] ${className}`}>
      {label}
      <input
        className="min-h-12 w-full rounded-xl border border-[#e7e5dc] bg-white px-4 text-[15px] outline-none transition focus:border-[#52744c] focus:ring-4 focus:ring-[#52744c]/10"
        {...props}
      />
    </label>
  );
}

function QuantityControl({ quantity, onDecrease, onIncrease, label }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#e8e7df] bg-white p-1">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={`Remove one ${label}`}
        className="touch-target grid size-11 place-items-center rounded-full text-[#53584e] transition hover:bg-[#f1f1e9] active:scale-95"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums">{quantity}</span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`Add one ${label}`}
        className="touch-target grid size-11 place-items-center rounded-full bg-[#314e35] text-white transition hover:bg-[#243d28] active:scale-95"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function CustomerOrderPortal({ onNavigate, cartCount }) {
  const {
    cart,
    addToCart,
    changeQuantity,
    clearCart,
    submitOrder,
  } = useOrders();
  const [menuItems, setMenuItems] = useState(/** @type {MenuItem[]} */ ([]));
  const [menuLoading, setMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [submittedOrder, setSubmittedOrder] = useState(/** @type {Order | null} */ (null));
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [customer, setCustomer] = useState(/** @type {CustomerInfo} */ ({
    customerName: '',
    phoneNumber: '',
    orderType: 'TABLE',
    tableNumber: '',
    deliveryAddress: '',
    notes: '',
    waiterPhone: import.meta.env.VITE_WAITER_PHONE || '',
  }));

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/menu', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Menu request failed (${response.status})`);
        return response.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('The menu response was not a list.');
        setMenuItems(data);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setMenuError('We couldn’t load the menu. Please try again in a moment.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setMenuLoading(false);
      });

    return () => controller.abort();
  }, []);

  const visibleItems = useMemo(
    () => menuItems.filter((item) => categoryMatches(item, activeCategory)),
    [menuItems, activeCategory],
  );
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);

  const updateCustomer = (event) => {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const getLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Location sharing is not available in this browser.');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationLoading(false);
      },
      (error) => {
        const messages = {
          1: 'Location permission was denied. You can still add your address or table number.',
          2: 'Your location could not be determined. Try again or enter your address.',
          3: 'Location request timed out. Please try again.',
        };
        setLocationError(messages[error.code] || 'Unable to get your location. Please enter your address.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const beginCheckout = () => {
    setCartOpen(false);
    setOrderError('');
    setCheckoutOpen(true);
  };

  const formatOrderMessage = (order) => {
    const itemLines = cart.map((item) => (
      `• ${item.quantity} × ${item.name} — ${formatKes(Number(item.price) * item.quantity)}`
    ));
    const orderLocation = customer.orderType === 'TABLE'
      ? `Table: ${customer.tableNumber}`
      : `Delivery address: ${customer.deliveryAddress}`;
    const mapLink = coordinates
      ? `\nLocation: https://maps.google.com/?q=${coordinates.latitude},${coordinates.longitude}`
      : '';

    return [
      `*New order #${order.id} — Jamaica Hotel & Restaurant*`,
      '',
      `Customer: ${customer.customerName}`,
      `Phone: ${customer.phoneNumber}`,
      orderLocation,
      customer.notes ? `Notes: ${customer.notes}` : '',
      '',
      '*Order:*',
      ...itemLines,
      `*Total: ${formatKes(cartTotal)}*`,
      mapLink,
    ].filter(Boolean).join('\n');
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    setOrderError('');
    setSubmitting(true);

    const { waiterPhone, ...customerInfo } = customer;
    const orderPayload = {
      ...customerInfo,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      items: cart.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
    };

    try {
      const createdOrder = await submitOrder(orderPayload);
      setSubmittedOrder(createdOrder);
      const phone = waiterPhone.replace(/\D/g, '');
      const message = encodeURIComponent(formatOrderMessage(createdOrder));
      setWhatsappUrl(`https://wa.me/${phone}?text=${message}`);
      setCheckoutOpen(false);
      setCartOpen(false);
      setCoordinates(null);
    } catch (error) {
      setOrderError(error.message || 'Your order could not be sent. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const startNewOrder = () => {
    setSubmittedOrder(null);
    setWhatsappUrl('');
    setCustomer((current) => ({
      ...current,
      customerName: '',
      phoneNumber: '',
      tableNumber: '',
      deliveryAddress: '',
      notes: '',
    }));
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#e9e7de] bg-[#f7f5ef]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-7 lg:h-20">
          <a
            href="/order"
            onClick={(event) => { event.preventDefault(); onNavigate('/order'); }}
            className="flex min-h-11 items-center gap-3"
          >
            <span className="grid size-10 place-items-center rounded-2xl bg-[#314e35] text-[#f3c568]">
              <Utensils size={19} />
            </span>
            <span>
              <span className="block font-display text-[17px] font-semibold leading-tight tracking-tight">Jamaica Hotel</span>
              <span className="text-[11px] font-medium tracking-[0.16em] text-[#7b7e73] uppercase">Restaurant</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs font-medium text-[#66705f] sm:flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#78a36f] opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-[#57835a]" />
              </span>
              Taking orders
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/waiter/dashboard')}
              className="touch-target hidden items-center gap-2 rounded-xl border border-[#e3e1d8] px-4 text-sm font-semibold text-[#43483e] transition hover:border-[#314e35] hover:text-[#314e35] sm:flex"
            >
              Staff view <ArrowRight size={15} />
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="touch-target relative grid size-11 place-items-center rounded-full bg-[#314e35] text-white transition hover:bg-[#243d28] active:scale-95"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full border-2 border-[#f7f5ef] bg-[#efbb58] text-[10px] font-bold text-[#25251f]">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-5 sm:px-7 sm:pt-8 lg:pb-16 lg:pt-10">
        <section className="relative isolate overflow-hidden rounded-[28px] bg-[#29462f] px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-14 lg:py-[58px]">
          <div className="hero-glow pointer-events-none absolute -right-20 -top-36 -z-10 size-[420px] rounded-full" />
          <div className="hero-glow-secondary pointer-events-none absolute -bottom-48 right-[20%] -z-10 size-[340px] rounded-full" />
          <div className="relative max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-[#f3cb7e] uppercase">
              <span className="size-1.5 rounded-full bg-[#f3cb7e]" />
              Fresh from our kitchen
            </span>
            <h1 className="font-display text-[38px] leading-[1.06] font-medium tracking-[-0.045em] sm:text-5xl lg:text-[60px]">
              Good food,<br className="sm:hidden" /> made for you.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70 sm:text-base">
              Made with care, served with a little sunshine. Find your favourite and we’ll get it started.
            </p>
            <a href="#menu" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#f3cb7e] px-5 text-sm font-bold text-[#283c2b] transition hover:bg-[#ffda92] active:scale-[0.98]">
              Explore the menu <ArrowDown size={16} />
            </a>
          </div>
          <div className="pointer-events-none absolute -right-4 bottom-[-64px] hidden size-[300px] items-center justify-center rounded-full border border-white/10 sm:flex lg:right-[6%] lg:size-[370px]">
            <div className="flex size-[250px] items-center justify-center rounded-full border border-white/10 bg-white/[0.03] lg:size-[310px]">
              <span className="food-orbit flex size-[190px] items-center justify-center rounded-full bg-[#f0c77c] text-[#29462f] shadow-2xl shadow-black/20 lg:size-[230px]">
                <span className="flex size-[152px] items-center justify-center rounded-full border-[10px] border-[#f6e5bb] bg-[#e8a74e] lg:size-[184px]">
                  <Utensils size={58} strokeWidth={1.15} />
                </span>
              </span>
            </div>
          </div>
        </section>

        <section id="menu" className="scroll-mt-24 pt-9 sm:pt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.17em] text-[#74816d] uppercase">Made fresh, just for you</p>
              <h2 className="mt-2 font-display text-[28px] font-semibold tracking-tight sm:text-3xl">The menu</h2>
            </div>
            <span className="mb-1 hidden items-center gap-1.5 text-xs text-[#73766d] sm:flex">
              <Clock3 size={14} /> Prepared to order
            </span>
          </div>

          <nav aria-label="Menu categories" className="hide-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-7 sm:px-0">
            {categories.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setActiveCategory(id)}
                aria-pressed={activeCategory === id}
                className={`touch-target flex shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition active:scale-[0.98] ${
                  activeCategory === id
                    ? 'border-[#314e35] bg-[#314e35] text-white shadow-sm'
                    : 'border-[#e5e3d9] bg-white/70 text-[#676b61] hover:border-[#b6c4ac] hover:bg-white'
                }`}
              >
                <Icon size={15} strokeWidth={1.8} /> {label}
              </button>
            ))}
          </nav>

          {menuLoading ? (
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-[180px] animate-pulse rounded-2xl border border-[#eeece5] bg-white/70" />
              ))}
            </div>
          ) : menuError ? (
            <div role="alert" className="mt-7 flex items-center gap-3 rounded-2xl border border-[#ead6c8] bg-[#fff9f3] p-5 text-sm text-[#8b4e37]">
              <CircleAlert size={19} /> {menuError}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-dashed border-[#d8d8cc] px-5 py-12 text-center text-sm text-[#777a71]">
              No dishes in this category just yet.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {visibleItems.map((item, index) => {
                const cartItem = cart.find((entry) => entry.id === item.id);
                return (
                  <article
                    key={item.id}
                    className="menu-item-card group flex min-h-[148px] flex-col justify-between rounded-2xl border border-[#eae8df] bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#cbd4c4] hover:shadow-[0_12px_30px_rgba(47,64,42,0.07)] sm:min-h-[164px] sm:p-5"
                    style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex rounded-full bg-[#f1f3eb] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#597153]">
                          {item.category}
                        </span>
                        <h3 className="mt-3 text-[15px] leading-5 font-semibold tracking-[-0.015em] text-[#292c26]">{item.name}</h3>
                        {item.description && (
                          <p className="mt-1.5 line-clamp-2 text-xs leading-[1.55] text-[#82847c]">{item.description}</p>
                        )}
                      </div>
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f7f5ef] text-[#718469]">
                        {item.category?.toLowerCase().includes('drink') ? <CupSoda size={17} /> : <Utensils size={17} />}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[15px] font-bold tabular-nums text-[#314e35]">{formatKes(Number(item.price))}</span>
                      {cartItem ? (
                        <QuantityControl
                          quantity={cartItem.quantity}
                          label={item.name}
                          onDecrease={() => changeQuantity(item.id, -1)}
                          onIncrease={() => addToCart(item)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(item)}
                          className="touch-target inline-flex items-center gap-1.5 rounded-xl bg-[#f0f3eb] px-3.5 text-xs font-bold text-[#314e35] transition hover:bg-[#e2eadc] active:scale-95"
                        >
                          <Plus size={15} /> Add
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-14 border-t border-[#e7e5dc] py-6 text-center text-xs text-[#83857d] sm:mt-16">
          Good food, good company. <span className="mx-1.5 text-[#b8b8ac]">·</span> Jamaica Hotel &amp; Restaurant
        </footer>
      </main>

      {itemCount > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed right-4 bottom-[84px] z-30 flex min-h-14 items-center gap-3 rounded-2xl bg-[#314e35] px-4 text-white shadow-[0_10px_28px_rgba(27,51,31,0.3)] transition hover:bg-[#243d28] active:scale-[0.98] sm:right-7 sm:bottom-7 lg:bottom-8"
        >
          <span className="grid size-8 place-items-center rounded-xl bg-white/15"><ShoppingBag size={17} /></span>
          <span className="text-left">
            <span className="block text-xs font-semibold">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            <span className="text-sm font-bold tabular-nums">{formatKes(cartTotal)}</span>
          </span>
          <ChevronRight className="ml-1 text-white/70" size={18} />
        </button>
      )}

      <nav aria-label="Mobile navigation" className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-[#e8e6dd] bg-[#fbfaf6]/95 px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-xl sm:hidden">
        <a href="#menu" className="grid min-h-12 place-items-center gap-0.5 text-[10px] font-semibold text-[#314e35]">
          <Utensils size={19} /><span>Menu</span>
        </a>
        <button type="button" onClick={() => setCartOpen(true)} className="grid min-h-12 place-items-center gap-0.5 text-[10px] font-semibold text-[#5e6359] active:text-[#314e35]">
          <span className="relative"><ShoppingBag size={19} />{cartCount > 0 && <span className="absolute -right-2 -top-1 grid size-3.5 place-items-center rounded-full bg-[#e6bb6d] text-[8px] text-[#25251f]">{cartCount}</span>}</span>
          <span>My cart</span>
        </button>
        <button type="button" onClick={() => onNavigate('/waiter/dashboard')} className="grid min-h-12 place-items-center gap-0.5 text-[10px] font-semibold text-[#5e6359] active:text-[#314e35]">
          <ChefHat size={19} /><span>Staff</span>
        </button>
      </nav>

      {cartOpen && (
        <div className="overlay-backdrop fixed inset-0 z-50 flex items-end justify-center bg-[#182019]/45 sm:items-center sm:p-5" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCartOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="cart-title" className="sheet-enter max-h-[88vh] w-full overflow-y-auto rounded-t-[28px] bg-[#fbfaf6] p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-lg sm:rounded-[26px] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#818578] uppercase">Your selection</p>
                <h2 id="cart-title" className="mt-1 font-display text-2xl font-semibold">Your cart</h2>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} aria-label="Close cart" className="touch-target grid size-11 place-items-center rounded-full hover:bg-[#eeece5]"><X size={19} /></button>
            </div>
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingBag className="mx-auto text-[#8f9b86]" size={28} />
                <p className="mt-3 font-semibold">Your cart is waiting</p>
                <p className="mt-1 text-sm text-[#777a71]">Add something delicious from the menu.</p>
                <button type="button" onClick={() => setCartOpen(false)} className="mt-5 min-h-11 rounded-xl bg-[#314e35] px-5 text-sm font-semibold text-white">Browse menu</button>
              </div>
            ) : (
              <>
                <div className="mt-6 divide-y divide-[#eeece5]">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-4 first:pt-0">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">{item.name}</h3>
                        <p className="mt-1 text-xs text-[#7b7e74]">{formatKes(Number(item.price))} each</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <QuantityControl
                          quantity={item.quantity}
                          label={item.name}
                          onDecrease={() => changeQuantity(item.id, -1)}
                          onIncrease={() => addToCart(item)}
                        />
                        <span className="w-[76px] text-right text-sm font-semibold tabular-nums">{formatKes(Number(item.price) * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-[#e8e6de] pt-4">
                  <span className="text-sm font-semibold text-[#60645b]">Total</span>
                  <span className="text-xl font-bold tabular-nums text-[#314e35]">{formatKes(cartTotal)}</span>
                </div>
                <div className="mt-5 grid grid-cols-[auto_1fr] gap-3">
                  <button type="button" onClick={clearCart} className="touch-target rounded-xl border border-[#e3e1d8] px-4 text-sm font-semibold text-[#74776d] transition hover:bg-[#f0eee7]">Clear</button>
                  <button type="button" onClick={beginCheckout} className="touch-target flex items-center justify-center gap-2 rounded-xl bg-[#314e35] px-5 text-sm font-bold text-white transition hover:bg-[#243d28] active:scale-[0.99]">
                    Continue to details <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {checkoutOpen && (
        <div className="overlay-backdrop fixed inset-0 z-[60] flex items-end justify-center bg-[#182019]/50 sm:items-center sm:p-5" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCheckoutOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" className="sheet-enter max-h-[94vh] w-full overflow-y-auto rounded-t-[28px] bg-[#fbfaf6] p-5 pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-xl sm:rounded-[26px] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <button type="button" onClick={() => { setCheckoutOpen(false); setCartOpen(true); }} className="mb-3 inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-[#72766c] hover:text-[#314e35]">
                  <ArrowLeft size={14} /> Back to cart
                </button>
                <h2 id="checkout-title" className="font-display text-2xl font-semibold">Where should we bring it?</h2>
                <p className="mt-1 text-sm text-[#797c72]">A few details and we’ll get your order on its way.</p>
              </div>
              <button type="button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout" className="touch-target grid size-11 shrink-0 place-items-center rounded-full hover:bg-[#eeece5]"><X size={19} /></button>
            </div>

            <form onSubmit={handleSubmitOrder} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" name="customerName" autoComplete="name" placeholder="e.g. Alex Kimani" value={customer.customerName} onChange={updateCustomer} required />
                <Field label="Phone number" name="phoneNumber" type="tel" autoComplete="tel" placeholder="+254 7XX XXX XXX" value={customer.phoneNumber} onChange={updateCustomer} required />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-[#383c34]">How would you like your order?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'TABLE', label: 'Dine in', hint: 'Bring it to my table' },
                    { value: 'DELIVERY', label: 'Delivery', hint: 'Bring it to my location' },
                  ].map((choice) => (
                    <button
                      type="button"
                      key={choice.value}
                      aria-pressed={customer.orderType === choice.value}
                      onClick={() => setCustomer((current) => ({ ...current, orderType: choice.value }))}
                      className={`touch-target rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] ${customer.orderType === choice.value ? 'border-[#6f8b65] bg-[#eef2e9] ring-2 ring-[#6f8b65]/15' : 'border-[#e7e5dc] bg-white hover:border-[#cbd4c4]'}`}
                    >
                      <span className="block text-sm font-semibold">{choice.label}</span>
                      <span className="mt-0.5 block text-xs text-[#777a71]">{choice.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
              {customer.orderType === 'TABLE' ? (
                <Field label="Table number" name="tableNumber" type="text" inputMode="numeric" placeholder="e.g. 12" value={customer.tableNumber} onChange={updateCustomer} required />
              ) : (
                <Field label="Delivery address" name="deliveryAddress" autoComplete="street-address" placeholder="Building, street, and area" value={customer.deliveryAddress} onChange={updateCustomer} required />
              )}
              <label className="grid gap-2 text-sm font-medium text-[#383c34]">
                Notes <span className="font-normal text-[#898b83]">(optional)</span>
                <textarea
                  name="notes"
                  rows="2"
                  placeholder="Anything we should know?"
                  value={customer.notes}
                  onChange={updateCustomer}
                  className="w-full resize-y rounded-xl border border-[#e7e5dc] bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-[#a3a49c] focus:border-[#52744c] focus:ring-4 focus:ring-[#52744c]/10"
                />
              </label>

              <div className="rounded-2xl border border-[#e5e7db] bg-[#f2f3ec] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#54704b]"><MapPin size={17} /></span>
                    <div>
                      <p className="text-sm font-semibold">Share your location</p>
                      {coordinates
                        ? <p className="mt-1 text-xs text-[#5f7257]">Location attached · {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}</p>
                        : <p className="mt-1 text-xs leading-5 text-[#777a71]">Optional — helps our team find you faster.</p>}
                    </div>
                  </div>
                  <button type="button" disabled={locationLoading} onClick={getLocation} className="touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#d8ddd1] bg-white px-3.5 text-xs font-semibold text-[#40583b] transition hover:bg-[#f8faf5] disabled:opacity-60">
                    <LocateFixed size={15} /> {locationLoading ? 'Finding you…' : coordinates ? 'Update location' : 'Use my location'}
                  </button>
                </div>
                {locationError && <p role="alert" className="mt-3 text-xs leading-5 text-[#974f39]">{locationError}</p>}
              </div>

              <Field
                label="Restaurant WhatsApp number"
                name="waiterPhone"
                type="tel"
                placeholder="254 7XX XXX XXX"
                value={customer.waiterPhone}
                onChange={updateCustomer}
                required
              />
              <p className="-mt-2 text-xs leading-5 text-[#81847b]">Include country code, without the + sign. Set <code className="rounded bg-[#eeece5] px-1">VITE_WAITER_PHONE</code> to prefill this field.</p>

              {orderError && <p role="alert" className="rounded-xl bg-[#fff0e9] px-4 py-3 text-sm text-[#934e37]">{orderError}</p>}

              <div className="mt-1 flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <span className="text-sm text-[#73766c]">{itemCount} {itemCount === 1 ? 'item' : 'items'} · Total</span>
                <span className="text-lg font-bold tabular-nums text-[#314e35]">{formatKes(cartTotal)}</span>
              </div>
              <button type="submit" disabled={submitting || cart.length === 0} className="touch-target flex items-center justify-center gap-2 rounded-xl bg-[#314e35] px-5 text-sm font-bold text-white transition hover:bg-[#243d28] active:scale-[0.99] disabled:cursor-wait disabled:opacity-60">
                {submitting ? 'Sending your order…' : 'Send order via WhatsApp'} <ArrowRight size={16} />
              </button>
              <p className="text-center text-[11px] leading-5 text-[#8a8c84]">Your order will be shared with our team and opened in WhatsApp.</p>
            </form>
          </section>
        </div>
      )}

      {submittedOrder && whatsappUrl && (
        <div className="overlay-backdrop fixed inset-0 z-[70] flex items-end justify-center bg-[#182019]/50 sm:items-center sm:p-5">
          <section role="dialog" aria-modal="true" aria-labelledby="submitted-title" className="sheet-enter w-full rounded-t-[28px] bg-[#fbfaf6] p-6 pb-[max(24px,env(safe-area-inset-bottom))] text-center shadow-2xl sm:max-w-sm sm:rounded-[26px] sm:p-8">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#e9f1e5] text-[#4c7248]"><Check size={26} /></span>
            <h2 id="submitted-title" className="mt-4 font-display text-2xl font-semibold">Order #{submittedOrder.id} is in!</h2>
            <p className="mt-2 text-sm leading-6 text-[#74776d]">Your order has been sent to the kitchen. Share the order summary with our team on WhatsApp to confirm.</p>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="touch-target mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#314e35] px-5 text-sm font-bold text-white transition hover:bg-[#243d28] active:scale-[0.99]">
              Open WhatsApp <ArrowRight size={16} />
            </a>
            <button type="button" onClick={startNewOrder} className="mt-3 min-h-11 w-full rounded-xl text-sm font-semibold text-[#6d7167] transition hover:bg-[#f0eee7]">Start another order</button>
          </section>
        </div>
      )}
    </>
  );
}

export default CustomerOrderPortal;
