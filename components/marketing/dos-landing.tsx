"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  Copy,
  FileText,
  FolderOpen,
  Home,
  LayoutTemplate,
  Plus,
  Search,
  Send,
  Users,
  Folder,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const iconClass = "h-[18px] w-[18px] shrink-0 stroke-[1.5]";

export function DosLandingPage() {
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1A1A1A] [&_.i]:stroke-[1.5] [&_.i]:text-current [&_.i]:h-[18px] [&_.i]:w-[18px]">
      <div className="mx-auto max-w-[1440px]">
        <header
          className={cn(
            "sticky top-0 z-50 flex h-16 items-center justify-between border-b px-8 md:px-20",
            "bg-[rgb(247_247_245/0.86)] backdrop-blur-md",
            navScrolled ? "border-[#EBEBEB]" : "border-transparent",
          )}
        >
          <Link href="/" className="inline-flex items-center gap-2.5 text-[#1E3A5F]">
            <Image
              src="/dos-mark.png"
              alt=""
              width={22}
              height={22}
              className="size-[22px] shrink-0"
              priority
            />
            <span className="text-[15px] font-medium tracking-tight text-[#1A1A1A]">
              DOS
            </span>
            <span className="text-[15px] font-normal text-[#6B6B6B]">Workspace</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
            <a
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]"
              href="#features"
            >
              Features
            </a>
            <a className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]" href="#">
              Solutions
            </a>
            <a className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]" href="#">
              Pricing
            </a>
            <a className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]" href="#">
              Docs
            </a>
            <a className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]" href="#">
              Changelog
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-2 text-sm font-medium text-[#6B6B6B] transition-colors hover:text-[#1E3A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]/25"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 shrink-0 items-center justify-center rounded-md bg-[#1E3A5F] px-3.5 text-sm font-medium text-white transition-colors hover:bg-[#16294A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]/35"
            >
              Get started
            </Link>
          </div>
        </header>

        <section className="px-8 pb-16 pt-[88px] md:px-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E8E4DE] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#1E3A5F]">
            <span className="size-1.5 rounded-full bg-[#1E3A5F]" aria-hidden />
            Built for research teams
          </span>

          <h1 className="mt-5 max-w-[640px] text-pretty text-[2.75rem] font-semibold leading-[1.05] tracking-tight text-[#1A1A1A] md:text-[56px]">
            Your entire research workflow,{" "}
            <span className="text-[#1E3A5F]">in one place.</span>
          </h1>
          <p className="mt-[18px] max-w-[540px] text-lg leading-snug text-[#6B6B6B]">
            DOS Workspace connects project setup, screener writing, quota management
            and field operations into a single intelligent workspace.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              href="/sign-up"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-md bg-[#1E3A5F] px-[18px] text-[15px] font-medium text-white transition-colors hover:bg-[#16294A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]/35"
            >
              Start free trial
            </Link>
            <Link
              href="#"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A1A1A] hover:text-[#1E3A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]/25 rounded-sm px-1"
            >
              See a demo{" "}
              <ArrowRight className="size-4 shrink-0 stroke-[1.5]" aria-hidden />
            </Link>
          </div>

          <div className="mt-14">
            <div
              className="grid h-[540px] grid-cols-1 overflow-hidden rounded-[14px] border border-[#EBEBEB] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(30,58,95,0.18)] md:grid-cols-[56px_minmax(0,1fr)_280px]"
            >
              <aside className="hidden shrink-0 flex-col items-center gap-2 border-b border-[#EBEBEB] py-4 md:flex md:border-b-0 md:border-r md:py-4">
                <Image
                  src="/dos-mark.png"
                  alt=""
                  width={22}
                  height={22}
                  className="size-[22px]"
                />
                <div className="h-2" />
                <div className="flex size-9 items-center justify-center rounded-md bg-[#F7F7F5] text-[#1E3A5F]">
                  <Home className={iconClass} />
                </div>
                <div className="flex size-9 items-center justify-center rounded-md text-[#9B9B9B]">
                  <Folder className={iconClass} />
                </div>
                <div className="flex size-9 items-center justify-center rounded-md text-[#9B9B9B]">
                  <FileText className={iconClass} />
                </div>
                <div className="flex size-9 items-center justify-center rounded-md text-[#9B9B9B]">
                  <BarChart2 className={iconClass} />
                </div>
                <div className="flex size-9 items-center justify-center rounded-md text-[#9B9B9B]">
                  <Send className={iconClass} />
                </div>
                <div className="flex size-9 items-center justify-center rounded-md text-[#9B9B9B]">
                  <LayoutTemplate className={iconClass} />
                </div>
              </aside>

              <main className="min-h-0 overflow-hidden px-6 pb-6 pt-6 md:px-7">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EBEBEB] pb-4">
                  <div className="text-[13px] text-[#6B6B6B]">Dashboard</div>
                  <div className="flex h-8 w-full max-w-[260px] items-center gap-2 rounded-md border border-[#EBEBEB] px-2.5 text-xs text-[#9B9B9B] md:w-auto">
                    <Search className="size-[14px] shrink-0 stroke-[1.5]" />
                    Search projects…
                  </div>
                </div>
                <h2 className="mt-5 text-xl font-semibold tracking-tight">Good morning, Gedas.</h2>
                <div className="mt-1 text-xs text-[#9B9B9B]">Thursday, 14 May 2026</div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(["12", "4", "3", "27"] as const).map((val, i) => (
                    <div
                      key={val + i}
                      className="rounded-lg border border-[#EBEBEB] bg-white p-3.5"
                    >
                      <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
                        {["Active", "In field", "Setup", "Done 30d"][i]}
                      </div>
                      <div className="mt-1.5 text-[22px] font-semibold tracking-tight">{val}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-lg border border-[#EBEBEB] bg-white">
                  <div className="hidden border-b border-[#EBEBEB] md:grid md:grid-cols-[2.5fr_1fr_1fr_1fr] md:gap-8 md:px-4 md:py-2.5">
                    <div className="text-[10px] font-normal uppercase tracking-[0.06em] text-[#9B9B9B]">
                      Project
                    </div>
                    <div className="text-[10px] font-normal uppercase tracking-[0.06em] text-[#9B9B9B]">
                      Client
                    </div>
                    <div className="text-[10px] font-normal uppercase tracking-[0.06em] text-[#9B9B9B]">
                      Status
                    </div>
                    <div className="text-[10px] font-normal uppercase tracking-[0.06em] text-[#9B9B9B]">
                      Updated
                    </div>
                  </div>
                  <DashboardRow
                    name="Automotive Segmentation Study"
                    client="TechCorp"
                    status={<StatusInfield />}
                    updated="2h ago"
                  />
                  <DashboardRow
                    name="Financial Services Usage"
                    client="FinGroup"
                    status={<StatusSetup />}
                    updated="1d ago"
                  />
                  <DashboardRow
                    name="Healthcare Brand Tracker W24"
                    client="MedInsights"
                    status={<StatusDone />}
                    updated="3d ago"
                  />
                  <DashboardRow
                    name="Retail CX Pulse — Q2"
                    client="RetailCo"
                    status={<StatusDraft />}
                    updated="5d ago"
                  />
                </div>
              </main>

              <aside className="hidden flex-col gap-3.5 border-t border-[#EBEBEB] bg-[#F7F7F5] px-5 py-6 md:flex md:border-l md:border-t-0 md:py-6">
                <h4 className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
                  Quick actions
                </h4>
                <div className="flex items-center gap-2.5 rounded-lg border border-[#1E3A5F] bg-[#1E3A5F] px-3 py-3 text-[13px] text-white [&_svg]:stroke-white">
                  <Plus className={iconClass} />
                  New project
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border border-[#EBEBEB] bg-white px-3 py-3 text-[13px] text-[#1A1A1A]">
                  <Copy className={iconClass} />
                  Import from template
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border border-[#EBEBEB] bg-white px-3 py-3 text-[13px] text-[#1A1A1A]">
                  <Users className={iconClass} />
                  Invite a team member
                </div>

                <h4 className="mt-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
                  Field health
                </h4>
                <div className="rounded-lg border border-[#EBEBEB] bg-white p-3.5">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
                    Quota — Auto Study
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#F7F7F5]">
                    <span className="block h-full w-[64%] rounded-full bg-[#1E3A5F]" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-[#6B6B6B]">
                    <span>640 / 1,000</span>
                    <span className="font-medium text-[#2D7D5A]">On pace</span>
                  </div>
                </div>
                <div className="rounded-lg border border-[#EBEBEB] bg-white p-3.5">
                  <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
                    Quota — FinGroup
                  </div>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#F7F7F5]">
                    <span className="block h-full w-[22%] rounded-full bg-[#C47B1E]" />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-[#6B6B6B]">
                    <span>220 / 1,000</span>
                    <span className="font-medium text-[#C47B1E]">Behind</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-6 px-8 py-12 md:px-20 md:py-12" id="logos">
          <div className="shrink-0 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9B9B9B]">
            Trusted by research teams at
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-14 gap-y-4 text-[17px] font-semibold tracking-tight text-[#BEBEBE] md:flex-1">
            <span className="tracking-[-0.05em]">NORTHWIND</span>
            <span>Briar &amp; Bell</span>
            <span className="italic">Halcyon</span>
            <span className="font-mono text-[17px] font-medium tracking-normal">field/works</span>
            <span>Meridian Co.</span>
            <span className="tracking-[-0.05em]">PARLIAMENT</span>
          </div>
        </section>

        <section className="px-8 pb-8 pt-4 md:px-20 md:pb-16" id="features">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.04em] text-[#9B9B9B]">
                What&apos;s inside
              </span>
              <h2 className="max-w-[600px] text-pretty text-[32px] font-semibold leading-tight tracking-tight text-[#1A1A1A]">
                Six tools that finally know about each other.
              </h2>
            </div>
            <p className="max-w-[360px] text-[15px] leading-snug text-[#6B6B6B]">
              Every tool reads from the same project record — set the brief once and
              screener, quotas and field operations pick it up automatically.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FolderOpen className={iconClass} />}
              title="Project Hub"
              body="Create a project once. Every tool picks it up automatically — brief, markets, quotas, sample."
              refLabel="Tool 01 · Core"
            />
            <FeatureCard
              icon={<FileText className={iconClass} />}
              title="Screener Studio"
              body="Write, test and publish screeners without leaving the workspace. Branching, soft-quotas, multi-market."
              refLabel="Tool 02 · Fieldwork"
            />
            <FeatureCard
              icon={<BarChart2 className={iconClass} />}
              title="Quota Tracker"
              body="Monitor field progress across segments in real time. Re-balance from the same screen."
              refLabel="Tool 03 · Fieldwork"
            />
            <FeatureCard
              icon={<Send className={iconClass} />}
              title="Invitely"
              body="Manage respondent invitations, reminders and one-time links. Vendor-agnostic."
              refLabel="Tool 04 · Fieldwork"
            />
            <FeatureCard
              icon={<LayoutTemplate className={iconClass} />}
              title="Project Summary"
              body="Auto-generated briefings your clients actually want to read — pulled from the project record."
              refLabel="Tool 05 · Delivery"
            />
            <FeatureCard
              icon={<Users className={iconClass} />}
              title="Team Access"
              body="Role-based permissions for clients, vendors and internal staff. Project-scoped or workspace-wide."
              refLabel="Tool 06 · Admin"
            />
          </div>
        </section>

        <section
          className="mx-8 mb-8 grid gap-12 rounded-2xl bg-[#1E3A5F] px-8 py-14 text-white md:mx-20 md:grid-cols-2 md:gap-14 md:p-14"
          id="workflow"
        >
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.04em] text-white/60">
              A single record
            </span>
            <h2 className="mt-3 max-w-[460px] text-[36px] font-semibold leading-[1.1] tracking-tight">
              One brief, end to end. No re-keying. No drift.
            </h2>
            <p className="mt-4 max-w-[420px] text-[15px] leading-relaxed text-white/[0.72]">
              Every tool reads from the same project record. Update the field dates in
              Project Hub and the screener, the invites and the quota tracker move with
              it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center justify-center rounded-md bg-white px-[18px] text-[15px] font-medium text-[#1E3A5F] transition-colors hover:bg-[#f5f3f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                Start free trial
              </Link>
              <a
                href="#"
                className="inline-flex h-11 items-center justify-center rounded-md border border-white/25 bg-transparent px-[18px] text-[15px] font-medium text-white transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                Read the docs
              </a>
            </div>
          </div>

          <div className="grid overflow-hidden rounded-lg border border-white/[0.18] bg-white/[0.04] md:grid-cols-4">
            {[
              { n: "01", t: "Brief", d: "Set markets, sample, dates." },
              { n: "02", t: "Screener", d: "Branching + soft quotas." },
              { n: "03", t: "Invite", d: "Vendors & panels." },
              { n: "04", t: "Deliver", d: "Summary & share." },
            ].map((s) => (
              <div
                key={s.n}
                className="border-b border-white/[0.14] px-4 py-4 md:border-b-0 md:border-r md:border-white/[0.14] md:last:border-r-0"
              >
                <span className="mb-5 block font-mono text-[11px] text-white/55">{s.n}</span>
                <div className="text-[13px] font-medium">{s.t}</div>
                <div className="mt-1 text-[11px] text-white/60">{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        <footer className="grid gap-14 border-t border-[#EBEBEB] px-8 py-16 md:grid-cols-4 md:px-20">
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/dos-mark.png" alt="" width={22} height={22} className="size-[22px]" />
              <span className="text-[15px] font-medium tracking-tight text-[#1A1A1A]">DOS</span>
              <span className="text-[15px] font-normal text-[#6B6B6B]">Workspace</span>
            </Link>
            <p className="mt-4 max-w-[280px] text-sm leading-snug text-[#6B6B6B]">
              One workspace. Every research tool. Built by Day One Strategy.
            </p>
          </div>

          <div>
            <h5 className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
              Product
            </h5>
            <FooterLinks links={["Features", "Integrations", "Pricing", "Changelog"]} />
          </div>
          <div>
            <h5 className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
              Company
            </h5>
            <FooterLinks links={["About", "Customers", "Contact"]} />
          </div>
          <div>
            <h5 className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
              Resources
            </h5>
            <FooterLinks links={["Docs", "Templates", "Security"]} />
          </div>

          <div className="col-span-full mt-10 flex flex-col gap-4 border-t border-[#EBEBEB] pt-6 text-xs text-[#9B9B9B] sm:flex-row sm:items-center sm:justify-between md:col-span-4">
            <div>© 2026 Day One Strategy</div>
            <div className="flex flex-wrap gap-5 gap-y-2">
              <Link className="hover:text-[#1E3A5F]" href="#">
                Privacy
              </Link>
              <span aria-hidden className="text-[#BEBEBE]">
                ·
              </span>
              <Link className="hover:text-[#1E3A5F]" href="#">
                Terms
              </Link>
              <span aria-hidden className="text-[#BEBEBE]">
                ·
              </span>
              <Link className="hover:text-[#1E3A5F]" href="#">
                Cookies
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
  refLabel,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  refLabel: string;
}) {
  return (
    <article className="flex min-h-[180px] flex-col rounded-xl border border-[#EBEBEB] bg-white p-6">
      <div className="mb-5 flex size-9 items-center justify-center rounded-md bg-[#F7F7F5] text-[#1E3A5F]">
        {icon}
      </div>
      <h3 className="text-base font-semibold tracking-tight text-[#1A1A1A]">{title}</h3>
      <p className="mt-1.5 text-sm leading-snug text-[#6B6B6B]">{body}</p>
      <div className="mt-auto pt-5 text-[11px] font-medium uppercase tracking-[0.06em] text-[#9B9B9B]">
        {refLabel}
      </div>
    </article>
  );
}

function DashboardRow({
  name,
  client,
  status,
  updated,
}: {
  name: string;
  client: string;
  status: ReactNode;
  updated: string;
}) {
  return (
    <div className="grid grid-cols-2 items-center gap-x-4 border-b border-[#EBEBEB] px-3 py-3 text-[12px] last:border-b-0 md:grid-cols-[2.5fr_1fr_1fr_1fr] md:gap-8 md:px-4 md:gap-y-0">
      <div className="col-span-2 font-medium md:col-span-1">{name}</div>
      <div className="hidden text-[#6B6B6B] md:block">{client}</div>
      <div className="md:justify-self-start">{status}</div>
      <div className="justify-self-end text-[#6B6B6B] md:justify-self-start">{updated}</div>
    </div>
  );
}

function StatusBase({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium [&::before]:size-1.5 [&::before]:rounded-full [&::before]:bg-current [&::before]:opacity-90 [&::before]:content-['']",
        className,
      )}
    >
      {children}
    </span>
  );
}

function StatusInfield() {
  return <StatusBase className="bg-[#E6F1EC] text-[#2D7D5A]">In field</StatusBase>;
}

function StatusSetup() {
  return (
    <StatusBase className="bg-[#EEF1F5] text-[#1E3A5F]">Setup</StatusBase>
  );
}

function StatusDone() {
  return <StatusBase className="bg-[#EFEFEF] text-[#6B6B6B]">Done</StatusBase>;
}

function StatusDraft() {
  return <StatusBase className="bg-[#F8EEDC] text-[#C47B1E]">Draft</StatusBase>;
}

function FooterLinks({ links }: { links: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {links.map((l) => (
        <li key={l}>
          <Link
            href="#"
            className="text-sm text-[#1A1A1A] hover:text-[#1E3A5F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]/25 rounded-sm px-0.5"
          >
            {l}
          </Link>
        </li>
      ))}
    </ul>
  );
}
