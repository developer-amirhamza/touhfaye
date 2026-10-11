"use client";
import React, { useEffect, useState } from "react";

interface GeoDistrict { id: string; name: string; bn_name: string }
interface GeoUpazila { id: string; district_id: string; name: string; bn_name: string }
interface GeoUnion { id: string; upazila_id: string; name: string; bn_name: string }

interface GeoData {
    districts: GeoDistrict[];
    upazilas: GeoUpazila[];
    unions: GeoUnion[];
}

// Sentinel used for both the Upazila/Thana and Union dropdowns' "not in the
// list" option. Bangladesh's open geocode datasets only cover rural
// Upazilas — Dhaka/Chittagong metropolitan Thanas (Dhanmondi, Gulshan,
// Bashundhara, ...) aren't included — so every level can fall back to free
// text instead of blocking the customer from checking out.
const OTHER = "__other__";

interface LocationSelectProps {
    fieldClassName: string;
    onChange: (value: { district: string; upazila: string; union: string }) => void;
}

const LocationSelect: React.FC<LocationSelectProps> = ({ fieldClassName, onChange }) => {
    const [geo, setGeo] = useState<GeoData | null>(null);

    const [districtId, setDistrictId] = useState("");
    const [upazilaId, setUpazilaId] = useState("");
    const [upazilaOther, setUpazilaOther] = useState("");
    const [unionId, setUnionId] = useState("");
    const [unionOther, setUnionOther] = useState("");

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            fetch("/data/bd-geo/districts.json").then((r) => r.json()),
            fetch("/data/bd-geo/upazilas.json").then((r) => r.json()),
            fetch("/data/bd-geo/unions.json").then((r) => r.json()),
        ])
            .then(([districts, upazilas, unions]) => {
                if (!cancelled) setGeo({ districts, upazilas, unions });
            })
            .catch(() => { /* location dropdowns degrade to empty — address line still works */ });
        return () => { cancelled = true; };
    }, []);

    const districts = geo?.districts ?? [];
    const upazilas = geo ? geo.upazilas.filter((u) => u.district_id === districtId) : [];
    const unions = geo ? geo.unions.filter((u) => u.upazila_id === upazilaId) : [];
    const hasUnionOptions = unions.length > 0;

    const districtName = districts.find((d) => d.id === districtId)?.name ?? "";
    const upazilaName = upazilaId === OTHER
        ? upazilaOther.trim()
        : (upazilas.find((u) => u.id === upazilaId)?.name ?? "");
    const unionName = (!hasUnionOptions || unionId === OTHER)
        ? unionOther.trim()
        : (unions.find((u) => u.id === unionId)?.name ?? "");

    useEffect(() => {
        onChange({ district: districtName, upazila: upazilaName, union: unionName });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [districtName, upazilaName, unionName]);

    return (
        <>
            <select
                value={districtId}
                onChange={(e) => {
                    setDistrictId(e.target.value);
                    setUpazilaId("");
                    setUpazilaOther("");
                    setUnionId("");
                    setUnionOther("");
                }}
                required
                className={fieldClassName}
            >
                <option value="">District</option>
                {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>

            <select
                value={upazilaId}
                onChange={(e) => {
                    setUpazilaId(e.target.value);
                    setUnionId("");
                    setUnionOther("");
                }}
                required
                disabled={!districtId}
                className={fieldClassName}
            >
                <option value="">{districtId ? "Upazila / Thana" : "Select district first"}</option>
                {upazilas.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                ))}
                <option value={OTHER}>Other / not listed…</option>
            </select>

            {upazilaId === OTHER && (
                <input
                    placeholder="Enter your area / Thana name"
                    value={upazilaOther}
                    onChange={(e) => setUpazilaOther(e.target.value)}
                    required
                    className={`${fieldClassName} sm:col-span-2`}
                />
            )}

            {hasUnionOptions ? (
                <select
                    value={unionId}
                    onChange={(e) => setUnionId(e.target.value)}
                    disabled={!upazilaId || upazilaId === OTHER}
                    className={fieldClassName}
                >
                    <option value="">Union (optional)</option>
                    {unions.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                    <option value={OTHER}>Other / not listed…</option>
                </select>
            ) : (
                <input
                    placeholder="Union / Ward (optional)"
                    value={unionOther}
                    onChange={(e) => setUnionOther(e.target.value)}
                    disabled={!upazilaId}
                    className={fieldClassName}
                />
            )}

            {hasUnionOptions && unionId === OTHER && (
                <input
                    placeholder="Enter your union / ward name"
                    value={unionOther}
                    onChange={(e) => setUnionOther(e.target.value)}
                    className={`${fieldClassName} sm:col-span-2`}
                />
            )}
        </>
    );
};

export default LocationSelect;
