import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { createUseContext } from "../../../../../utils";
import { CartProductType } from "../../../../../Types";
import { FormErrors } from "../../../../elements/forms/GenericForm";
import { useCallback, useState } from "react";
import ProductInformationDisplayDialog from "../../ProductInformationDisplayDialog";
import { InitialUserDataQuery } from "../../../linked/App/App";
import { useCartPopoverContext } from "../_utils";

const [CartItemsContext, useCartItemsContext] = createUseContext<{
    updateCartProductsUpdateData: ({ id, ...data }: Pick<CartProductType, "amount" | "id">) => void;
    errors: Record<number, FormErrors> | undefined;
    setCartProductUpdate: React.Dispatch<React.SetStateAction<Record<number, Pick<CartProductType, "amount">>>>;
    cartProductsCheckout: CartProductType[];
    setCartProductsCheckout: React.Dispatch<React.SetStateAction<CartProductType[]>>;
}>("useCartItemsContext has to be used within <CartItemsContext.Provider>");

export default function CartItems() {
    //
    const { cart } = useCartPopoverContext();

    //
    const queryClient = useQueryClient();

    //
    const [errors, setErrors] = useState<Record<CartProductType["id"], FormErrors>>();
    const [cartProductsCheckout, setCartProductsCheckout] = useState<CartProductType[]>(cart.products);

    //
    const [cartProductsUpdate, setCartProductUpdate] = useState<
        Record<CartProductType["id"], Pick<CartProductType, "amount">>
    >({});
    const updateCartProductsUpdateData = useCallback(
        ({ id, ...data }: Pick<CartProductType, "amount" | "id">) => {
            const cartProduct = cart.products.find((cp) => cp.id === id);
            if (cartProduct == null) {
                throw `Cart product with id "${id}" in user cart doesn't exist.`;
            }
            if (cartProduct.amount === data.amount) {
                setCartProductUpdate((previous) => {
                    const newState = { ...previous };
                    delete newState[id];
                    return newState;
                });
                return;
            }

            setCartProductUpdate((previous) => {
                const newState = { ...previous };
                newState[id] = data;
                return newState;
            });
        },
        [cart],
    );
    const updateMutation = useMutation({
        mutationFn: async () => {
            setErrors({});
            const response = await fetch("/api/cart/update_products", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(Object.entries(cartProductsUpdate).map(([id, data]) => ({ id, ...data }))),
            });

            if (response.ok) {
                return response;
            }

            setErrors(await response.json());
            return Promise.reject();
        },
        onSuccess: () => {
            queryClient.setQueryData(["user_and_cart"], (previous: InitialUserDataQuery) => {
                if (previous == null) {
                    return null;
                }

                return {
                    ...previous,
                    cart: {
                        ...previous.cart,
                        products: previous.cart.products.map((cp) => {
                            const overrideData = cartProductsUpdate[cp.id];
                            if (overrideData == null) {
                                return cp;
                            }

                            return {
                                ...cp,
                                ...overrideData,
                            };
                        }),
                    },
                };
            });
            setCartProductUpdate([]);
        },
    });

    return (
        <CartItemsContext.Provider
            value={{
                updateCartProductsUpdateData,
                errors,
                setCartProductUpdate,
                cartProductsCheckout,
                setCartProductsCheckout,
            }}
        >
            <div className="generic-panel__body">
                <div className="generic-panel__title">Cart</div>
                {cart.products.length > 0 && (
                    <>
                        <hr className="app__x-divider"></hr>
                        <div className="flex flex-col gap-2 max-h-96 overflow-auto pr-1">
                            {cart.products.map((cartProduct, i) => (
                                <>
                                    <CartItem key={cartProduct.id} cartProduct={cartProduct} />
                                    {i !== cart.products.length - 1 && <hr className="app__x-divider"></hr>}
                                </>
                            ))}
                        </div>
                        <button
                            className={`
                                mixin-button-like
                                mixin-button-base
                                theme-button-generic-green
                                ${Object.keys(cartProductsUpdate).length === 0 && "contrast-75 cursor-not-allowed"}
                                justify-center
                                ml-auto
                            `}
                            onClick={() => updateMutation.mutate()}
                        >
                            Update Cart
                        </button>
                    </>
                )}
                <hr className="app__x-divider"></hr>
                <div>
                    <div className="flex flex-row justify-between">
                        <div className="text-base font-medium">Total</div>
                        <div className="text-base">
                            $
                            {cart.products.reduce((acc, { amount, product, id }) => {
                                const inCheckout = cartProductsCheckout.find((cp) => cp.id === id) != null;
                                if (inCheckout) {
                                    return product.price * amount + acc;
                                }
                                return acc;
                            }, 0)}
                        </div>
                    </div>
                </div>
                <hr className="app__x-divider"></hr>
                <Link
                    as="button"
                    to={"/checkout"}
                    state={(previous) => ({ ...previous, cartProductsCheckout })}
                    className={`
                        mixin-button-like
                        mixin-button-base
                        theme-button-generic-yellow
                        ${cartProductsCheckout.length === 0 && "contrast-75 cursor-not-allowed"}
                        justify-center
                    `}
                >
                    Go To Checkout
                </Link>
            </div>
        </CartItemsContext.Provider>
    );
}

function CartItem({ cartProduct }: { cartProduct: CartProductType }) {
    //
    const queryClient = useQueryClient();

    //
    const { product, amount } = cartProduct;
    const {
        updateCartProductsUpdateData,
        errors,
        setCartProductUpdate,
        setCartProductsCheckout,
        cartProductsCheckout,
    } = useCartItemsContext();

    //
    const localErrors = errors?.[cartProduct.id];
    const formErrors = localErrors?.formErrors ?? [];
    const fieldErrors = localErrors?.fieldErrors ?? {};

    //
    const removeCartItem = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/cart/remove_product/${cartProduct.id}`, {
                method: "POST",
            });

            if (response.ok) {
                return response;
            }
        },
        onSuccess: () => {
            queryClient.setQueryData(["user_and_cart"], (previous: InitialUserDataQuery) => {
                if (previous == null) {
                    return null;
                }

                return {
                    ...previous,
                    cart: {
                        ...previous.cart,
                        products: previous.cart.products.filter((cp) => cp.id !== cartProduct.id),
                    },
                };
            });
            setCartProductUpdate({});
        },
    });

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-12 gap-2 w-full text-gray-900">
                <div className="bg-gray-600 col-span-4 min-h-full border border-gray-900">
                    <div className="relative aspect-square max-w-full min-h-full ">
                        <img
                            src={`/media/${product.images[0]}`}
                            className="absolute w-full h-full"
                            style={{ objectFit: "cover" }}
                            alt="prop"
                        ></img>
                    </div>
                </div>
                <div className="flex flex-col col-span-8 gap-2">
                    <div className="text-base leading-none line-clamp-2 font-medium break-all">{product.name}</div>
                    <div className="flex flex-col gap-0.5 mt-auto">
                        <ProductInformationDisplayDialog
                            Trigger={({ onClick }) => (
                                <button
                                    className={`
                                        mixin-button-like 
                                        mixin-button-sm
                                        theme-button-generic-white
                                        justify-center 
                                    `}
                                    onClick={onClick}
                                >
                                    Display Information
                                </button>
                            )}
                            product={product}
                        />
                        <button
                            className={`
                                mixin-button-like 
                                mixin-button-sm
                                theme-button-generic-white
                                justify-center 
                            `}
                            onClick={() => removeCartItem.mutate()}
                        >
                            Remove Cart Item
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="text-sm">In Cart</div>
                <input
                    type="checkbox"
                    defaultChecked={cartProductsCheckout.find(({ id }) => cartProduct.id === id) != null}
                    onChange={({ target: { checked } }) => {
                        if (checked) {
                            setCartProductsCheckout((previous) => [...previous, cartProduct]);
                        } else {
                            setCartProductsCheckout((previous) => previous.filter(({ id }) => id !== cartProduct.id));
                        }
                    }}
                />
                <div
                    className={`
                        mixin-char-input-like
                        mixin-char-input-sm
                        theme-input-generic-white
                        max-w-12
                        w-12
                        ml-auto
                    `}
                >
                    <input
                        type="text"
                        defaultValue={amount}
                        onChange={({ target: { value } }) => {
                            updateCartProductsUpdateData({ id: cartProduct.id, amount: parseInt(value) });
                        }}
                    ></input>
                </div>
                <div className="text-sm">x</div>
                <div className="text-sm font-medium">${product.price}</div>
            </div>
            {localErrors != null && (
                <>
                    {formErrors.map((message, i) => (
                        <div className="flex flex-col gap-0.5 p-2 border border-dashed border-gray-900 bg-red-100">
                            <div className="text-sm leading-none font-medium">{message}</div>
                        </div>
                    ))}
                    {Object.entries(fieldErrors).map(([field, messages]) => (
                        <div className="flex flex-col border border-dashed border-gray-900 bg-red-100">
                            <div>
                                <div className="text-sm font-medium capitalize leading-none p-2">{field}</div>
                                <hr className="app__x-divider border-dashed"></hr>
                                <div className="space-y-0.5 p-2">
                                    {messages?.map((message) => (
                                        <div className="text-sm leading-none">&bull; {message}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
