import React from "react";
import { Badge } from "../ui/badge";
import { tagColorStyles } from "@/data/tag-colors";

export default function CardProduct({ row }: { row: any }) {
  return (
    <div className="z-50 bg-white w-full space-y-[15px] relative">
      {/* hedaer */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium capitalize">{row.original.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-3">
            {row.original.description}
          </p>
        </div>
        <Badge className={tagColorStyles["GREEN"]}>
          {`Rp ${Number(row.original.price).toLocaleString()}`}
        </Badge>
      </div>

      {/* image render */}
      <div className="w-full relative rounded-md object-cover h-[200px] border border-slate-100">
        <img
          src={row.original.imageUrl}
          className="w-full h-full object-cover rounded-md"
          alt=""
        />
        <div className="absolute -bottom-5 right-2">
          <ImagesProduct productsImage={row.original.images} />
        </div>
      </div>

      {/* tags map */}
      <div className="flex justify-center gap-[5px] pt-6">
        {row.original.tags.map((tag: any, idx: any) => {
          return (
            <Badge
              key={idx}
              className={
                tagColorStyles[tag.color as keyof typeof tagColorStyles]
              }
            >
              {tag.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

const ImagesProduct = ({ productsImage }: { productsImage: any }) => {
  let imageLeft = productsImage.length - 3;
  return (
    <div className="flex -space-x-2">
      {productsImage.slice(0, 3).map((image: any, index: any) => (
        <div
          key={index}
          className="w-10 h-10 rounded-md overflow-hidden ring-background ring-2"
        >
          <img
            src={image.url}
            alt={image.id}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {imageLeft > 0 && (
        <div className="ring-background ring-2 rounded-md w-10 h-10 bg-gray-100 flex justify-center items-center">
          <span className="text-xs paragraph">+{imageLeft}</span>
        </div>
      )}
    </div>
  );
};
