import { ProductType } from "../../../../Types";
import EditProductDialog from "../../Product/edit/EditProductDialog";
import { ProductContext } from "../../../../Context";
import InformationDisplayDialog from "../../Product/info/ProductInformationDisplayDialog";
import DeleteProductDialog from "../../Product/delete/DeleteProductDialog";

export default function Product({ name, price, images, description, kind, specification, id }: ProductType) {
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
                    <div className="text-base text-gray-900 text-semibold">{name}</div>
                    <div className="text-sm text-gray-900">{price}$</div>
                </div>
                <div className="flex justify-center leading-none transition-colors items-center px-4 py-2 cursor-pointer bg-yellow-300 hover:bg-yellow-400 border border-gray-900">
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
                <div
                    className="absolute h-0 border-b border-gray-900"
                    style={{ bottom: "-1px", left: "-5000px", right: "0px" }}
                ></div>
            </div>
        </ProductContext.Provider>
    );
}