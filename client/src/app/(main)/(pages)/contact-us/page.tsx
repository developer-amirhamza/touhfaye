"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { IoCall, IoMail, IoLocationSharp, IoTimeOutline } from "react-icons/io5";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";
import Link from "next/link";

import { SummeryApi } from "@/app/common/SummeryApi";
import Axios from "@/utils/Axios";
import AxiosToastError from "@/utils/AxiosToastError";

const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

const ContactUs = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await Axios({
        ...SummeryApi.submitEnquiry,
        data: {
          type: "GENERAL",
          ...formData,
        },
      });
      if (response.data?.success) {
        toast.success(
          response.data.message || "Thanks — we'll be in touch shortly."
        );
        setFormData(initialFormData);
      }
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setLoading(false);
    }
  };

  const validInput = formData.firstName && formData.email && formData.message;

  const inputClass =
    "w-full p-3 border border-black/10 rounded-lg outline-none bg-background text-text text-sm focus:border-secondary transition-colors";

  return (
    <section className="w-full bg-background py-14 lg:py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary mb-3">
            Contact
          </p>
          <h1 className="playfair-display text-3xl md:text-4xl text-foreground mb-4">
            We&apos;re here to help
          </h1>
          <p className="text-text text-sm md:text-base leading-relaxed">
            Questions about products, orders, or NDIS funding? Send us a
            message and our team will get back to you shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* Contact info */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-primary rounded-2xl p-6 flex flex-col gap-5">
              <ContactRow
                icon={<IoCall size={18} />}
                label="Phone"
                value="0481 707 758"
                href="tel:0481707758"
              />
              <ContactRow
                icon={<IoMail size={18} />}
                label="Email"
                value="hello@mybestiee.com.au"
                href="mailto:hello@mybestiee.com.au"
              />
              <ContactRow
                icon={<IoLocationSharp size={18} />}
                label="Locations"
                value="Sydney · Melbourne · Brisbane"
              />
              <ContactRow
                icon={<IoTimeOutline size={18} />}
                label="Support hours"
                value="Mon–Fri, 9am–5pm AEST"
              />

              <div className="flex items-center gap-3 mt-2 pt-5 border-t border-black/10">
                <Link
                  href="https://www.facebook.com/aubestiee/"
                  className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary-hover text-white flex items-center justify-center transition-colors"
                >
                  <FaFacebookF size={14} />
                </Link>
                <Link
                  href=" https://www.instagram.com/bestieeau/"
                  className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary-hover text-white flex items-center justify-center transition-colors"
                >
                  <FaInstagram size={14} />
                </Link>
                <Link
                  href="https://www.linkedin.com/company/bestieeau/"
                  className="w-9 h-9 rounded-full bg-secondary hover:bg-secondary-hover text-white flex items-center justify-center transition-colors"
                >
                  <FaLinkedinIn size={14} />
                </Link>
              </div>
            </div>

            <div className="bg-primary rounded-2xl p-6">
              <h3 className="playfair-display text-lg text-foreground mb-2">
                NDIS support coordinator?
              </h3>
              <p className="text-text text-sm leading-relaxed mb-4">
                Set up a coordinator account to build quotes and manage
                participant orders.
              </p>
              <Link
                href="/apply/ndis"
                className="inline-block text-sm font-semibold text-secondary underline underline-offset-4"
              >
                Apply for coordinator access
              </Link>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-card rounded-2xl border border-black/5 p-7 flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name">
                  <input
                    className={inputClass}
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Your First Name"
                    required
                  />
                </Field>
                <Field label="Last Name">
                  <input
                    className={inputClass}
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Your Last Name"
                    required
                  />
                </Field>
                <Field label="Email">
                  <input
                    className={inputClass}
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                </Field>
              </div>

              <Field label="Phone (optional)">
                <input
                  className={inputClass}
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="04xx xxx xxx"
                />
              </Field>

              <Field label="Message">
                <textarea
                  className={inputClass}
                  name="message"
                  id="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help?"
                  required
                />
              </Field>

              <button
                type="submit"
                disabled={!validInput || loading}
                className={`mt-2 rounded-full font-semibold text-sm px-6 py-3 transition-colors text-white ${
                  validInput && !loading
                    ? "bg-secondary hover:bg-secondary-hover cursor-pointer"
                    : "bg-secondary/40 cursor-not-allowed"
                }`}
              >
                {loading ? "Sending…" : "Send message"}
              </button>
              <p className="text-xs text-text/70 text-center">
                We typically reply within one business day.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const ContactRow = ({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) => {
  const content = (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 shrink-0 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-text/60">
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="hover:opacity-80 transition-opacity">
      {content}
    </a>
  ) : (
    content
  );
};

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xs font-medium text-text/80">{label}</span>
    {children}
  </label>
);

export default ContactUs;