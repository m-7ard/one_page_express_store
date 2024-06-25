import { useRef, useState } from "react";
import { HistoryState, Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { CartProductType, CartType, OrderType } from "../../../../../Types";
import { createUseContext } from "../../../../../utils";
import { ArrowUturnLeftIcon } from "@heroicons/react/24/solid";
import Fieldset from "../../../../elements/forms/Fieldset";
import { z } from "zod";
import { FormCharFieldWidget } from "../../../../elements/forms/widgets/FormCharFieldWidget";
import { useCartPopoverContext } from "../_utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { InitialUserDataQuery } from "../../../linked/App/App";
import ProductInformationDisplayDialog from "../../ProductInformationDisplayDialog";

type APIErrorFormat = {
    cartProducts:
        | {
              formErrors: string[];
              fieldErrors: {
                  [x: string]: string[] | undefined;
              };
          }
        | undefined;
    formData:
        | {
              formErrors: string[];
              fieldErrors: {
                  shipping_name?: string[] | undefined;
                  shipping_address_primary?: string[] | undefined;
                  shipping_address_secondary?: string[] | undefined;
                  shipping_city?: string[] | undefined;
                  shipping_state?: string[] | undefined;
                  shipping_zip?: string[] | undefined;
                  shipping_country?: string[] | undefined;
              };
          }
        | undefined;
} & (
    | {
          promptUpdatedCartProducts: true;
          updatedCartProducts: CartProductType[];
      }
    | {
          promptUpdatedCartProducts: false;
      }
);

const SHIPPING_DATA = [
    "shipping_name",
    "shipping_address_primary",
    "shipping_address_secondary",
    "shipping_city",
    "shipping_state",
    "shipping_zip",
    "shipping_country",
] as const;

const [CheckoutContext, useCheckoutContext] = createUseContext<{
    errors?: APIErrorFormat;
}>("useCheckoutContext has to be used within <CheckoutContext.Provider>");

export function Checkout() {
    //
    const queryClient = useQueryClient();
    const navigate = useNavigate({ from: "/checkout" });
    const {
        location: { state },
    } = useRouterState();
    const customState = state as { cartProductsCheckout: CartProductType[] } & HistoryState;
    const [cartProductsCheckout, setCartProductsCheckout] = useState(customState.cartProductsCheckout);

    //
    const { cart } = useCartPopoverContext();
    const formRef = useRef<HTMLFormElement | null>(null);
    const [errors, setErrors] = useState<APIErrorFormat>();

    //
    const checkoutMutation = useMutation({
        mutationFn: async ({ form }: { form: HTMLFormElement }) => {
            const response = await fetch("/api/orders/checkout", {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify({
                    cartProducts: cartProductsCheckout,
                    formData: Object.fromEntries(new FormData(form).entries()),
                }),
            });
            if (response.ok) {
                return await response.json();
            }

            const errors: APIErrorFormat = await response.json();
            setErrors(errors);
            if (errors.promptUpdatedCartProducts) {
                setCartProductsCheckout((previous) => {
                    return errors.updatedCartProducts.reduce<CartProductType[]>((acc, cp) => {
                        const inCheckout = previous.find(({ id }) => cp.id === id)!;

                        acc.push({
                            ...cp,
                            amount: inCheckout.amount,
                        });

                        return acc;
                    }, []);
                });
            }
            return Promise.reject(errors);
        },
        onSuccess: (data: OrderType[]) => {
            queryClient.setQueryData<OrderType[]>(["orders"], (previous) => {
                if (previous == null) {
                    return;
                }

                return [...previous, ...data];
            });
            navigate({ to: "/" });
        }
    });

    if (cartProductsCheckout == null) {
        return <Navigate to={"/"} />;
    }

    return (
        <CheckoutContext.Provider value={{ errors }}>
            <div className="generic-panel__body">
                <div className="flex flex-row gap-2 items-center justify-between">
                    <div className="generic-panel__title">Checkout</div>
                    <Link to={"/"} className="flex flex-row gap-2 items-center hover:underline mixin-button-like">
                        <ArrowUturnLeftIcon className="w-4 h-4" />
                        <div className="text-base font-medium">Back</div>
                    </Link>
                </div>
                <hr className="app__x-divider"></hr>
                <div className="flex flex-col gap-2 max-h-48 overflow-auto pr-1">
                    {cartProductsCheckout.map((cp, i) => (
                        <>
                            <CheckoutItem cartProduct={cp} />
                            {i !== cart.products.length - 1 && <hr className="app__x-divider"></hr>}
                        </>
                    ))}
                </div>
                {errors?.promptUpdatedCartProducts === true && (
                    <button
                        className={`
                            mixin-button-like
                            mixin-button-base
                            theme-button-generic-yellow
                            justify-center
                        `}
                        onClick={() => {
                            setErrors(undefined);
                        }}
                    >
                        Confirm Product Data
                    </button>
                )}
                <hr className="app__x-divider"></hr>
                <form ref={formRef} className="flex flex-col gap-2 max-h-48 overflow-auto pr-1">
                    <Fieldset
                        errors={errors?.formData}
                        fields={SHIPPING_DATA.map((name) => {
                            return {
                                name,
                                widget: FormCharFieldWidget({ initial: "test" }),
                            };
                        })}
                    />
                </form>
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
                <button
                    className={`
                        mixin-button-like
                        mixin-button-base
                        theme-button-generic-yellow
                        justify-center
                        ${errors?.promptUpdatedCartProducts === true && "contrast-75 cursor-not-allowed"}
                    `}
                    onClick={() => {
                        if (formRef.current == null) {
                            throw new Error("Form for formdata is null.");
                        }

                        if (errors?.promptUpdatedCartProducts === true) {
                            return;
                        }

                        checkoutMutation.mutate({ form: formRef.current });
                    }}
                >
                    Checkout
                </button>
            </div>
        </CheckoutContext.Provider>
    );
}

function CheckoutItem({ cartProduct }: { cartProduct: CartProductType }) {
    //
    const { product, amount } = cartProduct;

    //
    const { errors } = useCheckoutContext();
    const fieldErrors = errors?.cartProducts?.fieldErrors?.[cartProduct.id.toString()];

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2 w-full text-gray-900">
                <div className="relative w-12 h-12 border border-gray-900 bg-gray-400 shrink-0">
                    <img
                        src={`/media/${product.images[0]}`}
                        className="absolute w-full h-full"
                        style={{ objectFit: "cover" }}
                        alt="prop"
                    ></img>
                </div>
                <div className="flex flex-col justify-center">
                    <div className="flex flex-row grow gap-2 overflow-hidden items-center">
                        <div className="text-base leading-none truncate font-medium">{product.name}</div>
                        <div className="flex flex-row gap-2 justify-end shrink-0 ml-auto">
                            <div className="text-sm">{amount}</div>
                            <div className="text-sm">x</div>
                            <div className="text-sm font-medium">${product.price}</div>
                        </div>
                    </div>
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
                </div>
            </div>
            {fieldErrors != null && (
                <div className="space-y-0.5">
                    {fieldErrors.map((message) => (
                        <div className="text-sm leading-none text-red-700">&bull; {message}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
