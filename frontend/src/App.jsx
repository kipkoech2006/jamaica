import { useEffect, useState } from 'react';
import { OrderProvider } from './context/OrderContext';
import { useOrders } from './context/orderContextValue';
import CustomerOrderPortal from './components/CustomerOrderPortal';
import WaiterDashboard from './components/WaiterDashboard';

function AppContent() {
  const [path, setPath] = useState(window.location.pathname);
  const { cart } = useOrders();
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const isDashboard = path === '/waiter/dashboard';

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextPath) => {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
      setPath(nextPath);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#20231e]">
      {isDashboard
        ? (
          <WaiterDashboard onNavigate={navigate} />
        )
        : (
          <CustomerOrderPortal
            onNavigate={navigate}
            cartCount={cartCount}
          />
        )}
    </div>
  );
}

function App() {
  return (
    <OrderProvider>
      <AppContent />
    </OrderProvider>
  );
}

export default App;
