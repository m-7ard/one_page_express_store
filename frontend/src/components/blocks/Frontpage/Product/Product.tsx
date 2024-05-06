import { ProductType } from "../../../../Types";
import EditProductDialog from "./EditProductDialog";
import { ProductContext, useAppContext } from "../../../../Context";
import DeleteProductDialog from "./DeleteProductDialog";
import App from "../Frontpage";
import InformationDisplayDialog from "./ProductInformationDisplayDialog";

export default function Product({ name, price, images, description, kind, specification, id }: ProductType) {
    const { user } = useAppContext();

    return (
        <ProductContext.Provider value={{ name, price, images, description, kind, specification, id }}>
            <div className="flex flex-col py-8 gap-4 col-span-1 relative mt-px">
                <div className="bg-gray-600 w-full relative border border-gray-900" style={{ aspectRatio: 0.711 }}>
                    <img
                        src={`/media/${images[0]}`}
                        className="absolute w-full h-full"
                        style={{ objectFit: "cover" }}
                        alt="prop"
                    ></img>
                </div>
                <div>
                    <div className="text-sm text-gray-600">{kind}</div>
                    <div className="text-base text-gray-900 font-medium">{name}</div>
                    <div className="text-sm text-gray-900">{price}$</div>
                </div>
                <div className={`${App.BaseButtonClassNames} justify-center bg-yellow-300 hover:bg-yellow-400`}>
                    Add to Cart
                </div>
                <div>
                    <InformationDisplayDialog
                        Trigger={({ onClick }) => (
                            <div
                                className="text-xs text-gray-900 hover:underline cursor-pointer w-fit"
                                onClick={onClick}
                            >
                                Display Information
                            </div>
                        )}
                        description={description}
                        images={images}
                        specification={specification}
                    />
                </div>
                {user?.is_admin === true && (
                    <div>
                        <EditProductDialog
                            Trigger={({ onClick }) => (
                                <div
                                    className="text-xs text-gray-900 hover:underline cursor-pointer w-fit"
                                    onClick={onClick}
                                >
                                    Edit
                                </div>
                            )}
                        />
                        <DeleteProductDialog
                            Trigger={({ onClick }) => (
                                <div
                                    className="text-xs text-gray-900 hover:underline cursor-pointer w-fit"
                                    onClick={onClick}
                                >
                                    Delete
                                </div>
                            )}
                        />
                    </div>
                )}
                <div
                    className="absolute h-0 border-b border-gray-900"
                    style={{ bottom: "-1px", left: "-5000px", right: "0px" }}
                ></div>
            </div>
        </ProductContext.Provider>
    );
}
