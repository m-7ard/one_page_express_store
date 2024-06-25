import { OrderType } from "../../../../../Types";
import { createUseContext } from "../../../../../utils";

export const [OrderContext, useOrderContext] = createUseContext<{
    order: OrderType;
}>("useOrderContext has to be used within <OrderContext.Provider>");
