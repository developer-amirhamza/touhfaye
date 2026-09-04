import { Response, Request } from "express";
import { errorHandler } from "../utils/errorHandler";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../config/sendEmail";
import { ROLES, TRADE_FAMILY } from "../middlewares/role";

interface AuthRequest extends Request {
  userId?: string;
}

const TEAM_EMAIL = "hello@mybestiee.com.au";

// A logged-in consumer applies to become a TRADE or NDIS_COORDINATOR account.
// Creates (or re-submits) an AccountApplication in PENDING status.
export const applyForAccount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);

    const {
      requestedRole,
      businessName,
      abn,
      businessType,
      contactName,
      contactPhone,
      organisation,
      notes,
    } = req.body;

    if (
      !TRADE_FAMILY.includes(requestedRole) &&
      requestedRole !== ROLES.NDIS_COORDINATOR
    ) {
      return errorHandler(
        res,
        400,
        "requestedRole must be TRADE, RETAILER, DISTRIBUTOR or NDIS_COORDINATOR",
        true
      );
    }

    // Wholesale applications (Trade/Retailer/Distributor) require an ABN;
    // NDIS coordinators require an organisation.
    if (TRADE_FAMILY.includes(requestedRole) && !abn) {
      return errorHandler(res, 400, "ABN is required for a wholesale account", true);
    }
    if (requestedRole === ROLES.NDIS_COORDINATOR && !organisation) {
      return errorHandler(
        res,
        400,
        "Organisation is required for an NDIS coordinator account",
        true
      );
    }

    const data = {
      requestedRole,
      status: "PENDING",
      businessName: businessName ?? null,
      abn: abn ?? null,
      businessType: businessType ?? null,
      contactName: contactName ?? null,
      contactPhone: contactPhone ?? null,
      organisation: organisation ?? null,
      notes: notes ?? null,
      reviewedBy: null,
      reviewedAt: null,
    };

    // Upsert so a user can re-apply (e.g. after a rejection).
    const application = await prisma.accountApplication.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName:true, email: true },
    });

    // Notify the team that a new application is awaiting approval.
    sendEmail({
      sendTo: TEAM_EMAIL,
      subject: `New ${requestedRole} account application — ${user?.firstName ?? "Unknown"}`,
      html: `<p>A new account application is awaiting approval.</p>
             <ul>
               <li><b>Applicant:</b> ${user?.firstName ?? ""} (${user?.email ?? ""})</li>
               <li><b>Requested role:</b> ${requestedRole}</li>
               <li><b>Business:</b> ${businessName ?? "-"}</li>
               <li><b>ABN:</b> ${abn ?? "-"}</li>
               <li><b>Organisation:</b> ${organisation ?? "-"}</li>
               <li><b>Contact:</b> ${contactName ?? "-"} / ${contactPhone ?? "-"}</li>
             </ul>`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      error: false,
      message:
        "Application submitted. Our team will review it and email you once approved.",
      data: application,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// The logged-in user's own application (so the portal can show pending/approved state).
export const getMyApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return errorHandler(res, 401, "Authentication required", true);

    const application = await prisma.accountApplication.findUnique({
      where: { userId },
    });

    return res.status(200).json({ success: true, error: false, data: application });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Admin: list applications, optionally filtered by status (?status=PENDING).
export const listApplications = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const applications = await prisma.accountApplication.findMany({
      where: status ? { status: String(status) } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName:true, email: true, role: true } },
      },
    });
    return res.status(200).json({ success: true, error: false, data: applications });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Admin: approve an application. Flips the user's role and grants portal access.
export const approveApplication = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId;
    const { id, creditApproved, creditLimit } = req.body;
    if (!id) return errorHandler(res, 400, "Application id is required", true);

    const application = await prisma.accountApplication.findUnique({
      where: { id },
      include: { user: { select: { id: true, firstName: true, lastName:true, email: true } } },
    });
    if (!application) return errorHandler(res, 404, "Application not found", true);

    const [updatedApp] = await prisma.$transaction([
      prisma.accountApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          creditApproved: Boolean(creditApproved),
          creditLimit: creditApproved && creditLimit != null ? Number(creditLimit) : null,
          reviewedBy: adminId ?? null,
          reviewedAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: application.userId },
        data: { role: application.requestedRole },
      }),
    ]);

    const roleLabel = TRADE_FAMILY.includes(application.requestedRole)
      ? application.requestedRole.charAt(0) + application.requestedRole.slice(1).toLowerCase()
      : "NDIS coordinator";
    sendEmail({
      sendTo: application.user.email,
      subject: "Your Bestiee account has been approved",
      html: `<p>Hi ${application.user.firstName},</p>
             <p>Good news — your ${roleLabel} account has been approved.
             You can now log in to access your portal.</p>
             <p>— The Bestiee team</p>`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      error: false,
      message: "Application approved and access granted.",
      data: updatedApp,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};

// Admin: reject an application (user role stays CONSUMER).
export const rejectApplication = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.userId;
    const { id, notes } = req.body;
    if (!id) return errorHandler(res, 400, "Application id is required", true);

    const application = await prisma.accountApplication.findUnique({
      where: { id },
      include: { user: { select: { firstName: true, lastName:true, email: true } } },
    });
    if (!application) return errorHandler(res, 404, "Application not found", true);

    const updatedApp = await prisma.accountApplication.update({
      where: { id },
      data: {
        status: "REJECTED",
        notes: notes ?? application.notes,
        reviewedBy: adminId ?? null,
        reviewedAt: new Date(),
      },
    });

    sendEmail({
      sendTo: application.user.email,
      subject: "Update on your Bestiee account application",
      html: `<p>Hi ${application.user.firstName},</p>
             <p>Thank you for applying. Unfortunately we couldn't approve your application at this time.
             ${notes ? `<br/><b>Note:</b> ${notes}` : ""}</p>
             <p>Please reach out to ${TEAM_EMAIL} if you'd like to discuss.</p>`,
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      error: false,
      message: "Application rejected.",
      data: updatedApp,
    });
  } catch (error: any) {
    return errorHandler(res, 500, error.message || "Internal server error!", true);
  }
};