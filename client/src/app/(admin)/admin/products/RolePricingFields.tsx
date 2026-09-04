"use client";

// The 5 portal roles a product can have its own price for, on top of the
// main price. Leaving a field blank means that role just gets the main
// price — a guest (not signed in) always gets the main price regardless.
export const PRICE_ROLE_FIELDS: { key: string; label: string }[] = [
    { key: "TRADE", label: "Price for Trade" },
    { key: "RETAILER", label: "Price for Retailer" },
    { key: "DISTRIBUTOR", label: "Price for Distributor" },
    { key: "NDIS_COORDINATOR", label: "Price for NDIS Coordinator" },
    { key: "CONSUMER", label: "Price for Consumer" },
];

export default function RolePricingFields({
    values,
    onChange,
}: {
    values: Record<string, string>;
    onChange: (role: string, value: string) => void;
}) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">Price by portal role (optional)</label>
            <p className="text-xs text-neutral-500 mb-2">
                Leave a field blank to use the main price above for that role. A signed-in account only ever sees
                its own role&apos;s price — guests and admins always see the main price.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PRICE_ROLE_FIELDS.map((f) => (
                    <div key={f.key}>
                        <label className="block text-xs text-neutral-600 mb-1">{f.label}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={values[f.key] ?? ""}
                            onChange={(e) => onChange(f.key, e.target.value)}
                            placeholder="Same as main price"
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
