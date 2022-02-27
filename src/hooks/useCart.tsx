import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
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

interface ProductAvailableInStock {
  productId: number;
  amount: number;
}

class OutOfStockError extends Error {}

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
      toast.error('Erro na remoção do produto');
    }
  };

  
  const productAvailableInStock = async ({productId, amount}: ProductAvailableInStock) => {
    const response = await api.get<Stock[]>('/stock');
    const stock = response.data;
    const stockProduct = stock.filter(product => product.id === productId);
    if (stockProduct.length === 0 || stockProduct[0].amount < amount){
      throw new OutOfStockError();
    }
    return true;
  }
  
  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(!productAvailableInStock({productId, amount})) {
        throw new Error('Quantidade solicitada fora de estoque');
      }
      setCart(cart.map(product => {
        if(product.id === productId){
          product.amount = amount;
        }
        
        return product;
      }))
    } catch (error) {
      if (error instanceof OutOfStockError){
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro na adição do produto');
      }
    }
  };


  const addProduct = async (productId: number) => {
    try {
      const productFound = cart.filter(product => product.id === productId);
      if(productFound.length !== 0){
        const newAmount = productFound[0].amount+1;
        updateProductAmount({productId, amount: newAmount});
        return;
      }

      const response = await api.get<Product>(`/products/${productId}`)
      const product = response.data;
      setCart([...cart, {
        ...product,
        amount: 1
      }])
    } catch (error) {
      if (error instanceof OutOfStockError){
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        toast.error('Erro na alteração de quantidade do produto');
      }
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
