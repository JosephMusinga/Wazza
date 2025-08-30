import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Product } from "../endpoints/businesses/products_GET.schema";

const LOCAL_STORAGE_KEY = "floot-shopping-cart";

export type CartItem = {
  product: Product;
  quantity: number;
};

export type ShoppingCartState = {
  items: Record<string, CartItem>; // productId is the key
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getItem: (productId: number) => CartItem | undefined;
  totalItems: number;
  totalPrice: number;
  cartForBusiness: (businessId: number) => Record<string, CartItem>;
};

const ShoppingCartContext = createContext<ShoppingCartState | undefined>(
  undefined
);

export const ShoppingCartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<Record<string, CartItem>>({});

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);
        // Filter out any items with quantity <= 0 for defensive cleanup
        const cleanedCart = Object.entries(parsedCart).reduce((acc, [productId, cartItem]) => {
          if ((cartItem as CartItem).quantity > 0) {
            acc[productId] = cartItem as CartItem;
          }
          return acc;
        }, {} as Record<string, CartItem>);
        setItems(cleanedCart);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [items]);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems[product.id];
      const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;
      return {
        ...prevItems,
        [product.id]: { product, quantity: newQuantity },
      };
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prevItems) => {
      const newItems = { ...prevItems };
      delete newItems[productId];
      return newItems;
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prevItems) => {
      const existingItem = prevItems[productId];
      if (!existingItem) return prevItems;
      
      const clampedQuantity = Math.max(0, Math.min(99, quantity));
      
      if (clampedQuantity === 0) {
        // Remove item completely when quantity becomes 0
        const { [productId]: _, ...rest } = prevItems;
        return rest;
      }
      
      return {
        ...prevItems,
        [productId]: { ...existingItem, quantity: clampedQuantity },
      };
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems({});
  }, []);

  const getItem = useCallback(
    (productId: number) => {
      return items[productId];
    },
    [items]
  );

  const totalItems = useMemo(() => {
    return Object.values(items).reduce((sum, item) => {
      return item.quantity > 0 ? sum + item.quantity : sum;
    }, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return Object.values(items).reduce(
      (sum, item) => {
        return item.quantity > 0 ? sum + item.product.price * item.quantity : sum;
      },
      0
    );
  }, [items]);

  const cartForBusiness = useCallback(
    (businessId: number) => {
      return Object.entries(items).reduce((acc, [productId, cartItem]) => {
        if (cartItem.product.businessId === businessId) {
          acc[productId] = cartItem;
        }
        return acc;
      }, {} as Record<string, CartItem>);
    },
    [items]
  );

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItem,
    totalItems,
    totalPrice,
    cartForBusiness,
  };

  return (
    <ShoppingCartContext.Provider value={value}>
      {children}
    </ShoppingCartContext.Provider>
  );
};

export const useShoppingCart = (): ShoppingCartState => {
  const context = useContext(ShoppingCartContext);
  if (context === undefined) {
    throw new Error("useShoppingCart must be used within a ShoppingCartProvider");
  }
  return context;
};