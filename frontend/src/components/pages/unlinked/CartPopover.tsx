import AbstractPopover, { AbstractPopoverPanel, AbstractPopoverTrigger } from "../../elements/abstract/AbstractPopover";
import { Popover } from "@headlessui/react";
import React from "react";
import { useAppContext } from "../../../Context";
import { CartProductType, ProductType } from "../../../Types";

export default function CartPopover({ Trigger }: { Trigger: AbstractPopoverTrigger; open?: boolean }) {
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
    const { cart } = useAppContext();

    if (cart == null) {
        return;
    }

    return (
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
    );
};

function CartItem({ cartProduct }: { cartProduct: CartProductType }) {
    const { product, amount } = cartProduct;

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-12 gap-2 w-full text-gray-900">
                <div className="bg-gray-600 col-span-4 relative border border-gray-900">
                    <img
                        src={`/media/${product.images[0]}`}
                        className="absolute w-full h-full"
                        style={{ objectFit: "cover" }}
                        alt="prop"
                    ></img>
                </div>
                <div className="flex flex-col col-span-8 gap-2">
                    <div className="text-base leading-none line-clamp-2 font-medium">
                        {product.name}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <div
                            className={`
                                mixin-button-like 
                                mixin-button-sm 
                                theme-button-generic-white
                                justify-center 
                            `}
                        >
                            Display Information
                        </div>
                        <div
                            className={`
                                mixin-button-like 
                                mixin-button-sm 
                                theme-button-generic-white
                                justify-center 
                            `}
                        >
                            Update Cart Item
                        </div>
                        <div
                            className={`
                                mixin-button-like 
                                mixin-button-sm 
                                theme-button-generic-white
                                justify-center 
                            `}
                        >
                            Remove Cart Item
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-row gap-2 items-center">
                    <div className="text-sm">In Cart</div>
                    <input type="checkbox" defaultChecked />
                </div>
                <div className="flex flex-row gap-2 justify-end">
                    <div className="text-sm font-gray-600">x{amount}</div>
                    <div className="text-sm font-medium">{product.price}</div>
                </div>
            </div>
        </div>
    );
}
