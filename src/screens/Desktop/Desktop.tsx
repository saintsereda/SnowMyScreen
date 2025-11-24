import React from "react";
import { Badge } from "../../components/ui/badge";

export const Desktop = (): JSX.Element => {
  const footerLinks = [
    { text: "Contact us", href: "#" },
    { text: "Privacy policy", href: "#" },
  ];

  return (
    <div className="bg-white w-full min-w-[1440px] min-h-[1024px] relative">
      <div className="absolute w-full top-0 left-0 h-[1024px] bg-[linear-gradient(180deg,rgba(255,255,255,1)_0%,rgba(207,237,255,1)_100%)]" />

      <header className="flex w-full h-14 items-center justify-between px-6 py-0 absolute top-0 left-0 z-10">
        <div className="inline-flex items-center gap-2 relative flex-[0_0_auto]">
          <img
            className="relative w-5 h-5 object-cover"
            alt="Appicon ios default"
            src="/appicon-ios-default-1024x1024-1x-1-1.png"
          />

          <div className="relative w-fit mt-[-1.00px] [font-family:'Geist',Helvetica] font-medium text-black text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
            SnowMyScreen
          </div>
        </div>

        <img
          className="relative w-[124.88px] h-8"
          alt="Download on the mac"
          src="/download-on-the-mac-app-store-badge-us-uk-rgb-blk-092917-1-1.svg"
        />
      </header>

      <main className="flex flex-col w-[1439px] h-[968px] items-center justify-between pt-[200px] pb-14 px-0 absolute top-[calc(50.00%_-_456px)] left-[calc(50.00%_-_719px)]">
        <div className="flex flex-col items-center gap-8 relative flex-1 self-stretch w-full grow">
          <Badge
            variant="secondary"
            className="inline-flex h-8 items-center justify-center gap-1 px-3 py-0 bg-[#ffffff66] rounded-[99px] border border-solid border-[#00366933] hover:bg-[#ffffff66]"
          >
            <span className="relative w-fit [font-family:'Geist',Helvetica] font-medium text-[#003669] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
              ⚡
            </span>

            <span className="relative w-fit [font-family:'Geist',Helvetica] font-normal text-[#003669] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
              <span className="font-medium">an***da.gmail.com</span>
              <span className="[font-family:'Geist',Helvetica] font-normal text-[#003669] text-sm tracking-[0] leading-5">
                {" "}
                just bought the app
              </span>
            </span>
          </Badge>

          <img
            className="relative w-24 h-24 object-cover"
            alt="Appicon ios default"
            src="/appicon-ios-default-1024x1024-1x-1-1.png"
          />

          <div className="flex flex-col items-center gap-4 relative self-stretch w-full flex-[0_0_auto]">
            <h1 className="relative w-[785px] mt-[-1.00px] bg-[linear-gradient(180deg,rgba(0,183,255,1)_0%,rgba(0,137,255,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] [font-family:'Geist',Helvetica] font-medium text-transparent text-[56px] text-center tracking-[0] leading-[64px]">
              Bring your Mac to life with gentle, customizable snowfall
            </h1>
          </div>

          <div className="inline-flex flex-col items-center gap-4 relative flex-[0_0_auto]">
            <img
              className="relative w-[187.32px] h-12"
              alt="Download on the mac"
              src="/download-on-the-mac-app-store-badge-us-uk-rgb-blk-092917-1.svg"
            />

            <p className="relative w-fit opacity-60 [font-family:'Geist',Helvetica] font-normal text-[#003669] text-sm text-center tracking-[0] leading-5 whitespace-nowrap">
              Available for macOS 14.6+
            </p>
          </div>
        </div>

        <footer className="inline-flex items-start gap-4 relative flex-[0_0_auto]">
          {footerLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="relative w-fit mt-[-1.00px] opacity-60 [font-family:'Geist',Helvetica] font-normal text-[#003669] text-sm text-center tracking-[0] leading-5 whitespace-nowrap hover:opacity-100 transition-opacity"
            >
              {link.text}
            </a>
          ))}
        </footer>
      </main>
    </div>
  );
};
