import FilterOrderDialog from "../../../unlinked/FilterOrdersDialog";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { PageNavigation } from "../Frontpage/PageNavigation/PageNavigation";
import { useAppContext, useQueryStringContext } from "../../../../../Context";
import { OrderType, PaginatedQuery } from "../../../../../Types";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import { generateLabel } from "../../../../../utils";
import { OrderContext, useOrderContext } from "./_utils";
import ConfirmOrderDialog from "./ConfirmOrderDialog/ConfirmOrderDialog";
import AbstractDialog, { AbstractDialogTrigger } from "../../../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";

export default function Dashboard() {
    const { buildQueryString } = useQueryStringContext();

    const ordersQuery = useQuery<PaginatedQuery<OrderType>>({
        queryKey: ["store_orders"],
        throwOnError: true,
        queryFn: async () => {
            const response = await fetch(`/api/orders/list?${buildQueryString()}`, {
                method: "GET",
            });
            if (response.ok) {
                return response.json();
            }

            return Promise.reject();
        },
    });

    const { user } = useAppContext();

    if (user == null) {
        return <Navigate from={"/dashboard/"} to={"/"} />;
    }

    return (
        ordersQuery.isSuccess && (
            <div className="flex flex-row gap-4 p-4">
                <div className="flex flex-col grow gap-4 max-w-screen-lg w-full mx-auto">
                    <div className="flex flex-row items-center gap-4 text-gray-900">
                        <FilterOrderDialog
                            Trigger={({ onClick }) => (
                                <div
                                    className={`
                                        mixin-button-like
                                        mixin-button-base
                                        theme-button-generic-white
                                    `}
                                    onClick={onClick}
                                >
                                    <div>Filter</div>
                                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                </div>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 border-b border-t border-gray-900 overflow-hidden">
                        {ordersQuery.data.results.map((order) => (
                            <Order order={order} />
                        ))}
                    </div>
                    <PageNavigation queryKey={["store_orders"]} />
                </div>
            </div>
        )
    );
}

function Order({ order }: { order: OrderType }) {
    return (
        <OrderContext.Provider value={{ order }}>
            <div className="flex flex-col py-8 gap-4 col-span-1 relative mt-px">
                <div className="w-full relative border border-gray-900" style={{ aspectRatio: 0.711 }}>
                    <img
                        src={`/media/${order.archive.product.images[0]}`}
                        className="absolute w-full h-full"
                        style={{ objectFit: "cover" }}
                        alt="prop"
                    ></img>
                </div>
                <div>
                    <div className="text-sm text-gray-600">{generateLabel(order.status)}</div>
                    <div className="text-base text-gray-900 font-medium">{order.archive.product.name}</div>
                </div>
                <div className="flex flex-col gap-1">
                    <OrderInformationDisplayDialog
                        Trigger={({ onClick }) => (
                            <button
                                className={`
                                    mixin-button-like
                                    mixin-button-base
                                    theme-button-generic-white
                                    justify-center
                                `}
                                onClick={onClick}
                            >
                                Order Data
                            </button>
                        )}
                    />

                    {order.status === "pending" && (
                        <ConfirmOrderDialog
                            Trigger={({ onClick }) => (
                                <button
                                    className={`
                                    mixin-button-like
                                    mixin-button-base
                                    theme-button-generic-yellow
                                    justify-center
                                `}
                                    onClick={onClick}
                                >
                                    Add Shipping
                                </button>
                            )}
                        />
                    )}
                    {order.status !== "completed" && order.status !== "presumed_completed" && (
                        <button
                            className={`
                            mixin-button-like
                            mixin-button-base
                            theme-button-generic-white
                            justify-center
                        `}
                        >
                            Cancel Order
                        </button>
                    )}
                </div>
                <div
                    className="absolute h-0 border-b border-gray-900"
                    style={{ bottom: "-1px", left: "-5000px", right: "0px" }}
                ></div>
            </div>
        </OrderContext.Provider>
    );
}

function OrderInformationDisplayDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    const { order } = useOrderContext();

    const fields = [
        ["Order ID", `#${order.id}`],
        ["Amount", order.amount],
        ["Total", `$${order.amount * order.archive.product.price}`],
        ["Shipping Name", order.shipping_name],
        ["Shipping Address Primary", order.shipping_address_primary],
        ["Shipping Address Secondary", order.shipping_address_secondary],
        ["Shipping City", order.shipping_city],
        ["Shipping State", order.shipping_state],
        ["Shipping Zip", order.shipping_zip],
        ["Shipping Country", order.shipping_country],
    ];

    return (
        <AbstractDialog
            Trigger={Trigger}
            Panel={({ onClose }) => (
                <Dialog.Panel className="top-0 right-0 bottom-0 p-4 max-w-sm w-full max-h-full overflow-hidden bg-yellow-50 absolute text-gray-900 border-l border-gray-900 shadow">
                    <div className="flex flex-col gap-4 h-full overflow-auto">
                        <div className="flex flex-row items-center justify-between">
                            <div className="text-lg font-medium">Order Data</div>
                            <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                                <XMarkIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="flex flex-col bg-gray-100 border border-gray-900">
                            {fields.map(([fieldName, fieldValue], i) => (
                                <>
                                    {i > 0 && <hr className="app__x-divider"></hr>}
                                    <div className="flex flex-row flex-wrap gap-1 px-2 py-1 leading-none justify-between">
                                        <div className="">{fieldName}:</div>
                                        <div className="">{fieldValue}</div>
                                    </div>
                                </>
                            ))}
                        </div>
                    </div>
                </Dialog.Panel>
            )}
        />
    );
}
