import FilterOrderDialog from "../../../unlinked/FilterOrdersDialog";
import { AdjustmentsHorizontalIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { PageNavigation } from "../Frontpage/PageNavigation/PageNavigation";
import { useAppContext, useQueryStringContext } from "../../../../../Context";
import { OrderType, PaginatedQuery } from "../../../../../Types";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "@tanstack/react-router";
import Order from "./Order/Order";

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
                            <Order order={order} key={order.id} />
                        ))}
                    </div>
                    <PageNavigation queryKey={["store_orders"]} />
                </div>
            </div>
        )
    );
}
