"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";
import { SummeryApi } from "@/app/common/SummeryApi";

// "Funding doesn't cover this?" — routes high-need / low-funding to a human.
export default function FundingSupportModal({
  open,
  onClose,
  quoteId,
}: {
  open: boolean;
  onClose: () => void;
  quoteId?: string;
}) {
  const [form, setForm] = useState({ participantNeed: "", availableFunding: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      const res = await Axios({
        ...SummeryApi.submitFundingEnquiry,
        data: { ...form, quoteId },
      });
      if (res.data?.success) {
        toast.success(res.data.message || "Sent — our team will be in touch");
        onClose();
        setForm({ participantNeed: "", availableFunding: "", message: "" });
      }
    } catch (e) {
      AxiosToastError(e);
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-[#2f7d6f] text-sm";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-stretch justify-stretch md:items-center md:justify-center bg-black/40 p-0 md:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white w-full h-full md:h-auto md:rounded-2xl md:max-w-md p-6 md:p-7 overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-2xl text-gray-900 mb-1">Talk to us about funding</h3>
            <p className="text-sm text-gray-500 mb-5">
              Tell us a little and we’ll come back with options — a payment plan, partial supply, or hardship support.
            </p>
            <div className="grid gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">Participant need</span>
                <input className={input} value={form.participantNeed} onChange={(e) => setForm({ ...form, participantNeed: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">Available funding</span>
                <input className={input} value={form.availableFunding} onChange={(e) => setForm({ ...form, availableFunding: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-gray-600">Message</span>
                <textarea rows={3} className={input} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="px-5 py-2.5 rounded-full text-sm font-semibold bg-[#2f7d6f] text-white hover:bg-[#27675b] disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send request"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}