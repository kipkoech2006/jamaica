import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Check,
  ChefHat,
  CircleAlert,
  Clock3,
  MapPin,
  RefreshCw,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useOrders } from '../context/orderContextValue';

/** @typedef {import('../types').Order} Order */
/** @typedef {import('../types').OrderStatus} OrderStatus */

const columns = [
  { id: 'PENDING', label: 'Pending', color: 'bg-[#f0b34e]', tint: 'bg-[#f8f1e4]', action: 'IN_PREPARATION', actionLabel: 'Start preparing' },
  { id: 'IN_PREPARATION', label: 'In preparation', color: 'bg-[#78916c]', tint: 'bg-[#edf1e9]', action: 'DELIVERED', actionLabel: 'Mark delivered' },
  { id: 'DELIVERED', label: 'Delivered', color: 'bg-[#658b72]', tint: 'bg-[#eaf1eb]' },
  { id: 'CANCELLED', label: 'Cancelled', color: 'bg-[#bd7663]', tint: 'bg-[#f5ece8]' },
];

const formatKes = (amount) => new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
}).format(amount);

function formatTime(value) {
  if (!value) return 'Just now';
  return new Intl.DateTimeFormat('en-KE', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function orderTotal(order) {
  return order.items?.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0) || 0;
}

function orderLocation(order) {
  if (order.orderType === 'DELIVERY') return order.deliveryAddress || 'Delivery';
  return order.tableNumber ? `Table ${order.tableNumber}` : 'Table order';
}

/**
 * @param {{
 *   order: Order,
 *   column: typeof columns[number],
 *   onStatusChange: (id: number, status: OrderStatus) => Promise<void>,
 *   updating: boolean
 * }} props
 */
function OrderCard({ order, column, onStatusChange, updating }) {
  const canCancel = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';

  return (
    <article className="rounded-2xl border border-[#e9e7df] bg-white p-4 shadow-[0_3px_14px_rgba(47,64,42,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold">#{order.id}</span>
            <span className="text-[11px] text-[#85877f]">{formatTime(order.createdAt)}</span>
          </div>
          <p className="mt-1 text-[13px] font-semibold text-[#41453c]">{order.customerName}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${column.tint} text-[#596451]`}>
          {order.orderType === 'DELIVERY' ? 'Delivery' : 'Dine in'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f7f6f1] px-3 py-2.5 text-xs font-semibold text-[#51564b]">
        <MapPin size={14} className="shrink-0 text-[#73876b]" />
        <span className="truncate">{orderLocation(order)}</span>
      </div>
      <a href={`tel:${order.phoneNumber}`} className="mt-2 inline-flex min-h-11 items-center text-xs text-[#74776d] underline decoration-[#d7d6cd] underline-offset-2 hover:text-[#314e35]">
        {order.phoneNumber}
      </a>

      <div className="mt-2 divide-y divide-[#f0efe9] border-y border-[#f0efe9]">
        {order.items?.map((item, index) => (
          <div key={`${item.menuItemId}-${index}`} className="flex items-start justify-between gap-3 py-2.5 text-xs">
            <span className="min-w-0 text-[#55594f]"><strong className="mr-1.5 text-[#30342c]">{item.quantity}×</strong>{item.name}</span>
            <span className="shrink-0 font-medium tabular-nums text-[#55594f]">{formatKes(Number(item.price) * item.quantity)}</span>
          </div>
        ))}
        {order.notes && <p className="py-2.5 text-xs leading-5 text-[#777a71]"><span className="font-semibold text-[#55594f]">Note:</span> {order.notes}</p>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium text-[#787b72]">Order total</span>
        <span className="text-sm font-bold tabular-nums text-[#314e35]">{formatKes(orderTotal(order))}</span>
      </div>

      {(order.latitude != null && order.longitude != null) && (
        <a
          href={`https://maps.google.com/?q=${order.latitude},${order.longitude}`}
          target="_blank"
          rel="noreferrer"
          className="touch-target mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#e2e7dc] bg-[#f4f6f0] text-xs font-semibold text-[#4c6546] transition hover:bg-[#e9eee4] active:scale-[0.99]"
        >
          <MapPin size={14} /> Open customer location
        </a>
      )}

      {column.action && (
        <button
          type="button"
          disabled={updating}
          onClick={() => onStatusChange(order.id, column.action)}
          className="touch-target mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#314e35] px-3 text-xs font-bold text-white transition hover:bg-[#243d28] active:scale-[0.99] disabled:opacity-60"
        >
          <Check size={15} /> {updating ? 'Updating…' : column.actionLabel}
        </button>
      )}
      {canCancel && (
        <button
          type="button"
          disabled={updating}
          onClick={() => onStatusChange(order.id, 'CANCELLED')}
          className="mt-1.5 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-semibold text-[#a2604d] transition hover:bg-[#faf0eb] disabled:opacity-60"
        >
          <X size={13} /> Cancel order
        </button>
      )}
    </article>
  );
}

function WaiterDashboard({ onNavigate }) {
  const { orders, ordersLoading, ordersError, changeOrderStatus } = useOrders();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [filter, setFilter] = useState('PENDING');
  const [updatingId, setUpdatingId] = useState(null);
  const [updateError, setUpdateError] = useState('');
  const [newOrderToast, setNewOrderToast] = useState('');
  const knownOrderIds = useRef(null);
  const audioContext = useRef(null);

  useEffect(() => {
    if (ordersLoading) return;
    if (knownOrderIds.current === null) {
      knownOrderIds.current = new Set(orders.map((order) => order.id));
      return;
    }

    const newOrders = orders.filter((order) => !knownOrderIds.current.has(order.id));
    if (newOrders.length > 0) {
      const newest = newOrders[0];
      setNewOrderToast(`New order received from ${orderLocation(newest)} · ${newest.customerName}`);
      if (soundEnabled && audioContext.current?.state === 'running') {
        const context = audioContext.current;
        const start = context.currentTime;
        [660, 880].forEach((frequency, index) => {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = 'sine';
          oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(0.0001, start + index * 0.16);
          gain.gain.exponentialRampToValueAtTime(0.16, start + index * 0.16 + 0.025);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + index * 0.16 + 0.18);
          oscillator.connect(gain);
          gain.connect(context.destination);
          oscillator.start(start + index * 0.16);
          oscillator.stop(start + index * 0.16 + 0.2);
        });
      }
    }
    knownOrderIds.current = new Set(orders.map((order) => order.id));
  }, [orders, ordersLoading, soundEnabled]);

  useEffect(() => {
    if (!newOrderToast) return undefined;
    const timerId = window.setTimeout(() => setNewOrderToast(''), 6500);
    return () => window.clearTimeout(timerId);
  }, [newOrderToast]);

  const enableSound = async () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Audio is not supported in this browser.');
      if (!audioContext.current || audioContext.current.state === 'closed') {
        audioContext.current = new AudioContextClass();
      }
      await audioContext.current.resume();
      setSoundEnabled(true);
    } catch (error) {
      setUpdateError(error.message || 'Could not enable notification sound.');
    }
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    setUpdateError('');
    try {
      await changeOrderStatus(id, status);
    } catch (error) {
      setUpdateError(error.message || 'Could not update this order. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleColumns = columns.filter((column) => column.id === filter);

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <header className="sticky top-0 z-30 border-b border-[#e9e7de] bg-[#f7f5ef]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-7 lg:h-20">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => onNavigate('/order')} aria-label="Back to customer menu" className="touch-target grid size-11 place-items-center rounded-xl border border-[#e3e1d8] bg-white transition hover:border-[#bac7b3]">
              <ArrowLeft size={17} />
            </button>
            <span className="grid size-10 place-items-center rounded-2xl bg-[#314e35] text-[#f3c568]"><UtensilsCrossed size={18} /></span>
            <div>
              <p className="font-display text-[16px] font-semibold leading-tight">Jamaica Hotel</p>
              <p className="text-[10px] font-medium tracking-[0.12em] text-[#81847b] uppercase">Service dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 text-xs text-[#70756a] sm:inline-flex">
              <RefreshCw size={13} className="text-[#71846b]" /> Live · refreshes every 3 sec
            </span>
            <button
              type="button"
              onClick={enableSound}
              className={`touch-target flex items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition active:scale-[0.98] sm:px-4 ${soundEnabled ? 'border-[#cddac5] bg-[#edf2e8] text-[#456441]' : 'border-[#e3e1d8] bg-white text-[#666a60] hover:border-[#cbd4c4]'}`}
            >
              {soundEnabled ? <Bell size={15} /> : <BellOff size={15} />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound on' : 'Enable sound'}</span>
              <span className="sm:hidden">{soundEnabled ? 'Sound on' : 'Sound'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 pb-14 pt-7 sm:px-7 sm:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#74816d] uppercase">Kitchen &amp; floor</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-[38px]">Order dashboard</h1>
            <p className="mt-2 text-sm text-[#787b72]">Stay on top of every table, from first ticket to delivery.</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#e6e5dc] bg-white px-3.5 py-2.5 text-xs text-[#666b60]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#78a36f] opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-[#57835a]" />
            </span>
            Orders update automatically
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {columns.map((column) => {
            const count = orders.filter((order) => order.status === column.id).length;
            return (
              <button
                type="button"
                key={column.id}
                onClick={() => setFilter(column.id)}
                className={`touch-target flex items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.99] sm:p-4 ${filter === column.id ? 'border-[#becbb6] bg-white shadow-sm' : 'border-[#eae8df] bg-white/55 hover:bg-white'}`}
              >
                <span className={`size-2.5 rounded-full ${column.color}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-[#73766d] sm:text-xs">{column.label}</span>
                  <span className="mt-0.5 block text-xl font-bold tabular-nums">{count}</span>
                </span>
              </button>
            );
          })}
        </div>

        {ordersError && (
          <p role="alert" className="mt-5 flex items-center gap-2 rounded-xl border border-[#ead6c8] bg-[#fff9f3] px-4 py-3 text-sm text-[#8b4e37]">
            <CircleAlert size={16} /> {ordersError}
          </p>
        )}
        {updateError && (
          <p role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#ead6c8] bg-[#fff9f3] px-4 py-3 text-sm text-[#8b4e37]">
            <span className="flex items-center gap-2"><CircleAlert size={16} /> {updateError}</span>
            <button type="button" onClick={() => setUpdateError('')} aria-label="Dismiss error" className="touch-target grid size-11 shrink-0 place-items-center rounded-lg hover:bg-[#f8eee6]"><X size={15} /></button>
          </p>
        )}

        <div className="mt-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold">{columns.find((column) => column.id === filter)?.label} orders</h2>
            <span className="rounded-full bg-[#ebece4] px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#666a60]">
              {orders.filter((order) => order.status === filter).length}
            </span>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-[#878980] sm:flex"><Clock3 size={14} /> Newest first</span>
        </div>

        {ordersLoading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[270px] animate-pulse rounded-2xl border border-[#eeece5] bg-white/75" />)}
          </div>
        ) : visibleColumns.map((column) => {
          const columnOrders = orders
            .filter((order) => order.status === column.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          return (
            <section key={column.id} aria-label={`${column.label} orders`} className="mt-4">
              {columnOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d8d8cc] bg-white/40 px-5 py-12 text-center">
                  <ChefHat className="mx-auto text-[#8f9b86]" size={27} />
                  <p className="mt-3 text-sm font-semibold text-[#55594f]">All clear for now</p>
                  <p className="mt-1 text-xs text-[#85877f]">New orders will appear here automatically.</p>
                </div>
              ) : (
                <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      column={column}
                      onStatusChange={updateStatus}
                      updating={updatingId === order.id}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </main>

      {newOrderToast && (
        <div role="status" aria-live="polite" className="toast-enter fixed top-[84px] right-4 left-4 z-50 mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-[#cad7c1] bg-white p-4 shadow-[0_14px_40px_rgba(28,48,29,0.16)] sm:right-7 sm:left-auto">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#e9f1e5] text-[#4c7248]"><Bell size={17} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#73816a] uppercase">Incoming order</p>
            <p className="mt-1 text-sm leading-5 font-semibold text-[#31352d]">{newOrderToast}</p>
          </div>
          <button type="button" onClick={() => setNewOrderToast('')} aria-label="Dismiss notification" className="touch-target grid size-11 shrink-0 place-items-center rounded-lg text-[#76796f] hover:bg-[#f3f2ec]"><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

export default WaiterDashboard;
