import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter(product => product.id !== productId));
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      setCart(cart.map(product => {
        if(product.id === productId){
          product.amount = amount;
        }
        
        return product;
      }))
    } catch {
      // TODO
    }
  };


  const addProduct = async (productId: number) => {
    try {
      const productFound = cart.filter(product => product.id === productId);
      if(productFound.length !== 0){
        updateProductAmount({productId, amount: productFound[0].amount+1});
        return;
      }

      const response = await api.get<Product>(`/products/${productId}`)
      const product = response.data;
      setCart([...cart, {
        ...product,
        amount: 1
      }])
    } catch {
      // TODO
    }
  };

  useEffect(() => {
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
  }, [cart])

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
