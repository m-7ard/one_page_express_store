import { createContext, useContext } from "react";
import { CartProductType, CartType, FilterType, ProductType, UserType } from "./Types";
import { createUseContext } from "./utils";
import { apiFetchBodyDataUnit } from "./components/pages/unlinked/CartPopover";
import { FormErrors } from "./components/elements/forms/GenericForm";

interface AppContextInterface {
    user?: UserType;
    cart?: CartType;
    filters: FilterType[];
}

export const AppContext = createContext<AppContextInterface | null>(null);

export const useAppContext = (): AppContextInterface => {
    const AppContextValue = useContext(AppContext);

    if (AppContextValue == null) {
        throw new Error("useAppContext has to be used within <AppContext.Provider>");
    }

    return AppContextValue;
};

export const [AbstractDialogContext, useAbstractDialogContext] = createUseContext<{
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>("useAbstractDialogContext has to be used within <AbstractDialogContext.Provider>");

export const [QueryStringContext, useQueryStringContext] = createUseContext<{
    filterParams: React.MutableRefObject<Record<string, string>>;
    sortParams: React.MutableRefObject<Record<string, string>>;
    page_index: React.MutableRefObject<number>;
    buildQueryString: () => string;
}>("useQueryStringContext has to be used within <QueryStringContext.Provider>");

export const [ProductContext, useProductContext] = createUseContext<ProductType>(
    "useProductContext has to be used within <ProductContext.Provider>",
);

export const [UserCartContext, useUserCartContext] = createUseContext<{
    updateCartProductsUpdateData: ({ id, ...data }: Pick<CartProductType, "amount" | "id">) => void;
    errors: Record<number, FormErrors> | undefined;
    setCartProductUpdate: React.Dispatch<React.SetStateAction<Record<number, Pick<CartProductType, "amount">>>>;
    cartProductsCheckout: CartProductType[];
    setCartProductsCheckout: React.Dispatch<React.SetStateAction<CartProductType[]>>;
}>("useUserCartContext has to be used within <UserCartContext.Provider>");
