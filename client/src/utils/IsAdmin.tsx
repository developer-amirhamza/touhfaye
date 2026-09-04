// OWNER is the site owner and has full admin access everywhere ADMIN does.
const IsAdmin = (role: any) => {
    if (typeof role !== "string") return false;
    const r = role.toUpperCase();
    return r === "ADMIN" || r === "OWNER";
};

export default IsAdmin;
