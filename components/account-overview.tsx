"use client";
import { useAuth } from "./auth-provider";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  HandHeart,
  KeyRound,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { AccountLayout } from "./account-layout";
import {
  demoDonations,
  demoCompletedDonations,
  demoTotalGivenCents,
  formatDonationAmount,
  formatDonationDate,
} from "../lib/account-demo";

const actions = [
  {
    title: "Edit Profile",
    text: "Keep your donor details up to date.",
    href: "/account/profile",
    icon: UserRound,
  },
  {
    title: "Donation History",
    text: "Review gifts and receipt availability.",
    href: "/account/donations",
    icon: ReceiptText,
  },
  {
    title: "Change Password",
    text: "Update your account password.",
    href: "/account/change-password",
    icon: KeyRound,
  },
  {
    title: "Make a Donation",
    text: "Support seva and temple activities.",
    href: "/donate",
    icon: HandHeart,
  },
];
export default function AccountOverview() {
  const { user } = useAuth();
  const latest = demoDonations.slice(0, 3);
  return (
    <AccountLayout
      title={`Welcome, ${user?.name.split(" ")[0] || ""}`}
      description="Thank you for being part of the Pushthidham Haveli community."
    >
      <div className="account-demo-notice">
        <span>DEMO PREVIEW</span>
        <p>
          You are signed in securely. Giving totals and donation history remain
          sample data.
        </p>
      </div>
      <section className="account-summary-grid" aria-label="Giving summary">
        <article className="account-summary-card">
          <span className="account-summary-icon">
            <CircleDollarSign aria-hidden="true" />
          </span>
          <p>Total completed giving</p>
          <strong>{formatDonationAmount(demoTotalGivenCents)}</strong>
          <small>{demoCompletedDonations.length} completed contributions</small>
        </article>
        <article className="account-summary-card">
          <span className="account-summary-icon">
            <ReceiptText aria-hidden="true" />
          </span>
          <p>Contributions shown</p>
          <strong>{demoDonations.length}</strong>
          <small>Across your sample history</small>
        </article>
        <article className="account-summary-card">
          <span className="account-summary-icon">
            <CalendarDays aria-hidden="true" />
          </span>
          <p>Most recent contribution</p>
          <strong>{formatDonationDate(demoDonations[0].date)}</strong>
          <small>{demoDonations[0].givingFor}</small>
        </article>
      </section>
      <section
        className="account-section"
        aria-labelledby="account-actions-title"
      >
        <div className="account-section-heading">
          <div>
            <p className="eyebrow">Your account</p>
            <h2 id="account-actions-title">Quick Actions</h2>
          </div>
        </div>
        <div className="account-action-grid">
          {actions.map(({ title, text, href, icon: Icon }) => (
            <a className="account-action-card" href={href} key={href}>
              <span>
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <ArrowRight aria-hidden="true" className="account-action-arrow" />
            </a>
          ))}
        </div>
      </section>
      <section
        className="account-section account-recent"
        aria-labelledby="recent-title"
      >
        <div className="account-section-heading">
          <div>
            <p className="eyebrow">Your seva</p>
            <h2 id="recent-title">Recent Donations</h2>
          </div>
          <a className="account-inline-link" href="/account/donations">
            View donation history <ArrowRight aria-hidden="true" />
          </a>
        </div>
        <div className="account-recent-list">
          {latest.map((item) => (
            <article className="account-recent-row" key={item.reference}>
              <span className="account-recent-icon">
                <HandHeart aria-hidden="true" />
              </span>
              <div className="account-recent-copy">
                <strong>{item.givingFor}</strong>
                <small>
                  {formatDonationDate(item.date)} · {item.method}
                </small>
              </div>
              <strong className="account-recent-amount">
                {formatDonationAmount(item.amountCents)}
              </strong>
              <span
                className={`account-status account-status-${item.status.toLowerCase()}`}
              >
                {item.status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </AccountLayout>
  );
}
