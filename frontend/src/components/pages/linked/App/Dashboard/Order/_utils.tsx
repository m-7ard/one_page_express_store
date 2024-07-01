import { OrderShippingType, OrderType } from "../../../../../../Types";
import { createUseContext } from "../../../../../../utils";

export const [OrderContext, useOrderContext] = createUseContext<OrderType>("useOrderContext has to be used within <OrderContext.Provider>");
export const [OrderShippingDialogContext, useOrderShippingDialogContext] = createUseContext<OrderShippingType>("useOrderShippingDialogContext has to be used within <OrderContext.Provider>");
