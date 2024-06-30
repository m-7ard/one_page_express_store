import { OrderType } from "../../../../../../Types";
import { createUseContext } from "../../../../../../utils";

export const [OrderContext, useOrderContext] = createUseContext<OrderType>("useOrderContext has to be used within <OrderContext.Provider>");
