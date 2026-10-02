"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className="relative flex flex-col min-h-screen text-gray-200"
      style={{
        backgroundColor: "#1a1a1a",
        backgroundImage: 'url("/images/pixelbg.png")',
        backgroundPosition: "center center",
        backgroundSize: "cover",
        backgroundAttachment: "scroll",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* P5.js canvas container */}
      <div id="backgroundCanvas" className="absolute inset-0 z-0 pointer-events-none" />

      {/* P5 and Animation Scripts */}
      {isMounted && (
        <>
          <Script src="https://cdn.jsdelivr.net/npm/p5@1.9.0/lib/p5.js" strategy="afterInteractive" />
          <Script src="/js/background.js?v=sheep-animation-0-5fps-1" strategy="lazyOnload" />
        </>
      )}

      <header className="relative z-10 p-5 flex justify-start items-center bg-transparent">
        <Link href="/">
          <Image
            src="/images/gameking_logo_1.png"
            alt="Gameking Logo"
            width={200}
            height={100}
            className="h-auto max-h-[100px] w-auto"
            priority
          />
        </Link>
      </header>

      <main className="relative z-10 flex-grow p-5 flex flex-col items-center">
        <section className="mt-[50px] text-center w-full">
          <h2 className="mb-0 inline-block -translate-y-[50px]">
            <Image
              src="/images/idea_lab_logo.png"
              alt="FUNZIES"
              width={275}
              height={100}
              className="w-[275px] h-auto mx-auto"
            />
          </h2>

          <div className="flex flex-col items-center gap-5 mt-5 -translate-y-[50px]">
            {/* Row 1 */}
            <div className="flex justify-center gap-[30px]">
              <a href="/tictactoe.html">
                <div className="w-[150px] h-[150px] bg-transparent border-[3px] border-[#ffcc00] rounded-full flex justify-center items-center text-gray-200 font-bold cursor-pointer shadow-[0_0_15px_rgba(255,255,0,0.3)] transition-transform duration-200 hover:scale-110 overflow-hidden box-border">
                  <Image
                    src="/images/cross.jpg"
                    alt="Tic-Tac-Toe"
                    width={150}
                    height={150}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </a>
              
              <a href="/beforegta6.html">
                <div className="relative group w-[150px] h-[150px] bg-transparent border-[3px] border-[#ffcc00] rounded-full flex justify-center items-center text-gray-200 font-bold cursor-pointer shadow-[0_0_15px_rgba(255,255,0,0.3)] transition-transform duration-200 hover:scale-110 overflow-visible box-border">
                  {/* GTA Hover Bubble */}
                  <span className="absolute left-1/2 bottom-[calc(100%+12px)] -translate-x-1/2 translate-y-[6px] bg-gradient-to-b from-[#fffdf0] to-[#fff7cf] text-[#2a2a2a] text-[13px] font-bold tracking-[0.2px] px-[11px] py-[7px] rounded-xl border-2 border-[#ffcc00] shadow-[0_8px_18px_rgba(0,0,0,0.25)] whitespace-nowrap opacity-0 invisible pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 z-50 after:content-[''] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:w-0 after:h-0 after:border-l-[8px] after:border-l-transparent after:border-r-[8px] after:border-r-transparent after:border-t-[9px] after:border-t-[#fff7cf]">
                    work in progress
                  </span>
                  <Image
                    src="/images/beforegta6.jpg"
                    alt="beforegta6"
                    width={150}
                    height={150}
                    className="w-full h-full object-cover rounded-full block mx-auto"
                  />
                </div>
              </a>

              <a href="/dashy.html" aria-label="Open Dashy internal dashboard">
                <div className="w-[150px] h-[150px] bg-transparent border-[3px] border-[#ffcc00] rounded-full flex justify-center items-center text-gray-200 font-bold cursor-pointer shadow-[0_0_15px_rgba(255,255,0,0.3)] transition-transform duration-200 hover:scale-110 overflow-hidden box-border">
                  <Image
                    src="/images/dashy-home-icon.svg"
                    alt="Dashy internal dashboard"
                    width={150}
                    height={150}
                    className="w-full h-full object-cover rounded-full block mx-auto p-4"
                  />
                </div>
              </a>
              
              <div className="w-[150px] h-[150px] bg-transparent border-[3px] border-[#ffcc00] rounded-full flex justify-center items-center shadow-[0_0_15px_rgba(255,255,0,0.3)] box-border"></div>
            </div>

            {/* Row 2 */}
            <div className="flex justify-center gap-[30px]">
              <div className="w-[150px] h-[150px] bg-transparent border-[3px] border-[#ffcc00] rounded-full shadow-[0_0_15px_rgba(255,255,0,0.3)] box-border"></div>
              <div className="w-[150px] h-[150px] bg-transparent border-[3px] border-[#ffcc00] rounded-full shadow-[0_0_15px_rgba(255,255,0,0.3)] box-border"></div>
              <div className="w-[150px] h-[150px] bg-transparent border-[3px] border-[#ffcc00] rounded-full shadow-[0_0_15px_rgba(255,255,0,0.3)] box-border"></div>
            </div>
            
            {/* Scrollable padding */}
            <div className="h-[1000px]"></div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 bg-[#2a2a2a]/50 p-5 text-center border-t border-[#555] text-[#e0e0e0]">
        <div className="contacts-section">
          <h3 className="mt-0 mb-[10px] text-lg font-bold">Contacts:</h3>
          <p className="my-1">Email: gameking@email.com</p>
          <p className="my-1">Phone: 123-456-7890</p>
        </div>
      </footer>
    </div>
  );
}
