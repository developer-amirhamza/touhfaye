"use client";
import React, { useEffect, useState } from "react";
import SearchableSelect from "./SearchableSelect";

interface GeoDivision { id: string; name: string; bn_name: string }
interface GeoDistrict { id: string; division_id: string; name: string; bn_name: string }
interface GeoUpazila { id: string; district_id: string; name: string; bn_name: string }
interface GeoUnion { id: string; upazila_id: string; name: string; bn_name: string }

interface GeoData {
    divisions: GeoDivision[];
    districts: GeoDistrict[];
    upazilas: GeoUpazila[];
    unions: GeoUnion[];
}

// Sentinel used for both the Upazila/Thana and Union pickers' "not in the
// list" option. Bangladesh's open geocode datasets only cover rural
// Upazilas — Dhaka/Chittagong metropolitan Thanas (Dhanmondi, Gulshan,
// Bashundhara, ...) aren't included — so every level can fall back to free
// text instead of blocking the customer from checking out.
const OTHER = "__other__";
const OTHER_OPTION = { id: OTHER, name: "Other / not listed…" };

interface LocationSelectProps {
    fieldClassName: string;
    onChange: (value: { division: string; district: string; upazila: string; union: string }) => void;
}

const LocationSelect: React.FC<LocationSelectProps> = ({ fieldClassName, onChange }) => {
    const [geo, setGeo] = useState<GeoData | null>(null);

    const [divisionId, setDivisionId] = useState("");
    const [districtId, setDistrictId] = useState("");
    const [upazilaId, setUpazilaId] = useState("");
    const [upazilaOther, setUpazilaOther] = useState("");
    const [unionId, setUnionId] = useState("");
    const [unionOther, setUnionOther] = useState("");

    useEffect(() => {
        let cancelled = false;
        Promise.all([
            fetch("/data/bd-geo/divisions.json").then((r) => r.json()),
            fetch("/data/bd-geo/districts.json").then((r) => r.json()),
            fetch("/data/bd-geo/upazilas.json").then((r) => r.json()),
            fetch("/data/bd-geo/unions.json").then((r) => r.json()),
        ])
            .then(([divisions, districts, upazilas, unions]) => {
                if (!cancelled) setGeo({ divisions, districts, upazilas, unions });
            })
            .catch(() => { /* location pickers degrade to empty — address line still works */ });
        return () => { cancelled = true; };
    }, []);

    const divisions = geo?.divisions ?? [];
    const districts = geo ? geo.districts.filter((d) => d.division_id === divisionId) : [];
    const upazilas = geo ? geo.upazilas.filter((u) => u.district_id === districtId) : [];
    const unions = geo ? geo.unions.filter((u) => u.upazila_id === upazilaId) : [];
    const hasUnionOptions = unions.length > 0;

    const divisionName = divisions.find((d) => d.id === divisionId)?.name ?? "";
    const districtName = districts.find((d) => d.id === districtId)?.name ?? "";
    const upazilaName = upazilaId === OTHER
        ? upazilaOther.trim()
        : (upazilas.find((u) => u.id === upazilaId)?.name ?? "");
    const unionName = (!hasUnionOptions || unionId === OTHER)
        ? unionOther.trim()
        : (unions.find((u) => u.id === unionId)?.name ?? "");

    useEffect(() => {
        onChange({ division: divisionName, district: districtName, upazila: upazilaName, union: unionName });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [divisionName, districtName, upazilaName, unionName]);

    return (
        <>
            <SearchableSelect
                options={divisions}
                value={divisionId}
                onChange={(id) => {
                    setDivisionId(id);
                    setDistrictId("");
                    setUpazilaId(""); setUpazilaOther("");
                    setUnionId(""); setUnionOther("");
                }}
                placeholder="Division — type to search"
                required
                className={fieldClassName}
            />

            <SearchableSelect
                options={districts}
                value={districtId}
                onChange={(id) => {
                    setDistrictId(id);
                    setUpazilaId(""); setUpazilaOther("");
                    setUnionId(""); setUnionOther("");
                }}
                placeholder="District — type to search"
                disabledPlaceholder="Select division first"
                disabled={!divisionId}
                required
                className={fieldClassName}
            />

            <SearchableSelect
                options={upazilas}
                value={upazilaId}
                onChange={(id) => {
                    setUpazilaId(id);
                    setUnionId(""); setUnionOther("");
                }}
                placeholder="Upazila / Thana — type to search"
                disabledPlaceholder="Select district first"
                disabled={!districtId}
                required={upazilaId !== OTHER}
                className={fieldClassName}
                footerOption={OTHER_OPTION}
            />

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
                <SearchableSelect
                    options={unions}
                    value={unionId}
                    onChange={(id) => setUnionId(id)}
                    placeholder="Union (optional) — type to search"
                    disabledPlaceholder="Select upazila first"
                    disabled={!upazilaId || upazilaId === OTHER}
                    className={fieldClassName}
                    footerOption={OTHER_OPTION}
                />
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
