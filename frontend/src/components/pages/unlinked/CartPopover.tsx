import AbstractPopover, { AbstractPopoverPanel, AbstractPopoverTrigger } from "../../elements/abstract/AbstractPopover";
import { Popover } from "@headlessui/react";
import React, { useCallback, useState } from "react";
import { UserCartContext, useAppContext, useUserCartContext } from "../../../Context";
import { CartProductType } from "../../../Types";
import ProductInformationDisplayDialog from "./ProductInformationDisplayDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FormErrors } from "../../elements/forms/GenericForm";
import { UsersUserAPIQuery } from "../linked/App/App";

export type apiFetchBodyDataUnit = Pick<CartProductType, "amount" | "id">;

export default function CartPopover({ Trigger }: { Trigger: AbstractPopoverTrigger }) {
    return (
        <AbstractPopover
            Trigger={Trigger}
            Panel={CartPopover.Panel}
            options={{
                placement: "bottom-end",
                strategy: "fixed",
                modifiers: [
                    {
                        name: "preventOverflow",
                        options: {
                            altAxis: true,
                        },
                    },
                ],
            }}
        />
    );
}

CartPopover.Panel = function CartPopover({
    setPopperElement,
    popper: { styles, attributes },
}: React.ComponentProps<AbstractPopoverPanel>) {
    const queryClient = useQueryClient();
    const { cart } = useAppContext();
    const [cartProductsUpdate, setCartProductUpdate] = useState<apiFetchBodyDataUnit[]>([]);
    const [errors, setErrors] = useState<FormErrors>();
    const updateCartProductsUpdateData = useCallback(
        ({ id, amount }: apiFetchBodyDataUnit) => {
            const cartProduct = cart?.products.find((cp) => cp.id === id);
            if (cartProduct == null) {
                throw `Cart product with id ${id} in user cart`;
            }
            if (cartProduct.amount === amount) {
                setCartProductUpdate((previous) => previous.filter((cp) => cp.id !== id));
                return;
            }
            setCartProductUpdate((previous) => [...previous, { id, amount }]);
        },
        [cart],
    );
    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("/api/cart/update_products", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(cartProductsUpdate),
            });

            if (response.ok) {
                return response;
            }

            const _errors = await response.json();
            setErrors(_errors);
            return Promise.reject()
        },
        onSuccess: () => {
            queryClient.setQueryData(["user_and_cart"], (previous: UsersUserAPIQuery) => {
                if (previous == null) {
                    return null;
                }

                return {
                    ...previous,
                    cart: {
                        ...previous.cart,
                        products: previous.cart.products.map((cp) => {
                            const overrideData = cartProductsUpdate.find(({ id }) => cp.id === id);
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

    if (cart == null) {
        return;
    }

    return (
        <UserCartContext.Provider value={{ updateCartProductsUpdateData, errors }}>
            <Popover.Panel
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
                as={"div"}
                className={"generic-panel"}
            >
                <div className="generic-panel__body">
                    <div className="generic-panel__title">Cart</div>
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
                            mixin-button-sm
                            theme-button-generic-green
                            ${cartProductsUpdate.length === 0 && "contrast-75 cursor-not-allowed"}
                            justify-center
                        `}
                        onClick={() => mutation.mutate()}
                    >
                        Update Cart
                    </button>
                    <hr className="app__x-divider"></hr>
                    <div>
                        <div className="flex flex-row justify-between">
                            <div className="text-base font-medium">Total</div>
                            <div className="text-base">$1000</div>
                        </div>
                        <div className="flex flex-row justify-between">
                            <div className="text-base font-medium">Shipping</div>
                            <div className="text-base">$5.99</div>
                        </div>
                    </div>
                    <hr className="app__x-divider"></hr>
                    <button
                        className={`
                        mixin-button-like
                        mixin-button-base
                        theme-button-generic-yellow
                        justify-center
                    `}
                    >
                        Checkout
                    </button>
                </div>
            </Popover.Panel>
        </UserCartContext.Provider>
    );
};

function CartItem({ cartProduct }: { cartProduct: CartProductType }) {
    const { product, amount } = cartProduct;
    const { updateCartProductsUpdateData, errors } = useUserCartContext();
    console.log(errors)
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
                        >
                            Remove Cart Item
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="text-sm">In Cart</div>
                <input type="checkbox" defaultChecked />
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
                        inputMode="numeric"
                        defaultValue={amount}
                        onChange={({ target: { value } }) => {
                            updateCartProductsUpdateData({ id: cartProduct.id, amount: parseInt(value) });
                        }}
                    ></input>
                </div>
                <div className="text-sm">x</div>
                <div className="text-sm font-medium">${product.price}</div>
            </div>
            {errors != null && (
                <div className="flex flex-col gap-0.5">

                </div>
            )}
  
        </div>
    );
}
