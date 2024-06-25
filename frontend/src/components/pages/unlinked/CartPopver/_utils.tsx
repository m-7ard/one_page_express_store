import { useAppContext } from "../../../../Context";
import { CartType } from "../../../../Types";
import { createUseContext } from "../../../../utils";

export const [CartPopoverContext, useCartPopoverContext] = createUseContext<{
    cart: CartType;
}>("useCartPopoverContext has to be used within <CartPopoverContext.Provider>");

export function CartWrapper({ children }: React.PropsWithChildren) {
    const { cart } = useAppContext();

    if (cart == null) {
        return;
    }

    return <CartPopoverContext.Provider value={{ cart }}>{children}</CartPopoverContext.Provider>;
}