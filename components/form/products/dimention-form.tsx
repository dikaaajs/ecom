import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormDataProductType } from "@/types/product/form-data";

type DimentionFormType = {
  formData: FormDataProductType;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function DimentionFrom({
  formData,
  handleInputChange,
}: DimentionFormType) {
  return (
    <div className="grid gap-4 py-2">
      {/* weight */}
      <div className="grid gap-2">
        <Label htmlFor="weight">Weight (gram)</Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          placeholder="10"
          value={formData.weight ?? ""}
          onChange={handleInputChange}
        />
      </div>

      {/* length */}
      <div className="grid gap-2">
        <Label htmlFor="length">Length (cm)</Label>
        <Input
          id="length"
          name="length"
          type="number"
          placeholder="10"
          value={formData.length ?? ""}
          onChange={handleInputChange}
        />
      </div>

      {/* width */}
      <div className="grid gap-2">
        <Label htmlFor="width">Width (cm)</Label>
        <Input
          id="width"
          name="width"
          type="number"
          placeholder="10"
          value={formData.width ?? ""}
          onChange={handleInputChange}
        />
      </div>

      {/* height */}
      <div className="grid gap-2">
        <Label htmlFor="height">Height (cm)</Label>
        <Input
          id="height"
          name="height"
          type="number"
          placeholder="10"
          value={formData.height ?? ""}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}
