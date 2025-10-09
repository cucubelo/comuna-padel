/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { PublicOnlyRoute } from "@/components/auth/ProtectedRoute";

export default function AuthPage() {
  const [activeForm, setActiveForm] = useState("login");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1); // Remove the '#'
      if (hash === "login") {
        setActiveForm("login");
      } else if (hash === "register") {
        setActiveForm("register");
      }
    };

    // Check initial hash on component mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const updateActiveForm = (form: "login" | "register") => {
    if (form === activeForm) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveForm(form);
      setIsTransitioning(false);
    }, 150);
    
    // Update URL hash when changing form
    window.history.replaceState(null, "", `#${form}`);
  };

  // Touch/swipe handling for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeForm === "login") {
      updateActiveForm("register");
    }
    if (isRightSwipe && activeForm === "register") {
      updateActiveForm("login");
    }
  };

  return (
    <PublicOnlyRoute>
      {/* Desktop Layout */}
      <div className="hidden md:block min-h-screen bg-bg-main">
        <div className="min-h-screen flex items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
            {/* Desktop Header */}
            <div className="text-center mb-8 lg:mb-12">
              <div className="flex items-center justify-center mb-6">
                <img
                  src="/logo.png"
                  alt="Comuna Padel Logo"
                  className="h-10 w-10 lg:h-12 lg:w-12 mr-3"
                />
                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-text-main font-montserrat">
                  Comuna Padel
                </h1>
              </div>
              <p className="text-text-secondary font-open-sans text-sm lg:text-base">
                Conecta con jugadores de padel y organiza partidos increíbles
              </p>
            </div>

            {/* Desktop Tab Navigation */}
            <div className="flex mb-6 lg:mb-8 bg-bg-secondary rounded-xl p-1 border border-border">
              <button
                onClick={() => updateActiveForm("login")}
                className={`flex-1 py-3 lg:py-4 px-4 lg:px-6 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 font-open-sans ${
                  activeForm === "login"
                    ? "bg-accent-primary text-bg-main shadow-lg"
                    : "text-text-secondary hover:text-text-main hover:bg-bg-main/50"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => updateActiveForm("register")}
                className={`flex-1 py-3 lg:py-4 px-4 lg:px-6 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 font-open-sans ${
                  activeForm === "register"
                    ? "bg-accent-primary text-bg-main shadow-lg"
                    : "text-text-secondary hover:text-text-main hover:bg-bg-main/50"
                }`}
              >
                Registrarse
              </button>
            </div>

            {/* Desktop Form Container */}
            <div className="bg-bg-secondary rounded-xl lg:rounded-2xl shadow-2xl p-6 lg:p-8 xl:p-10 border border-border">
              <div className={`transition-all duration-300 ease-out ${
                isTransitioning ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
              }`}>
                {activeForm === "login" ? <LoginForm /> : <RegisterForm />}
              </div>
            </div>

            {/* Desktop Footer */}
            <div className="mt-8 text-center">
              <p className="text-text-secondary text-xs lg:text-sm font-open-sans">
                Al continuar, aceptas nuestros{" "}
                <a href="#" className="text-accent-primary hover:text-accent-primary/80 transition-colors">
                  Términos de Servicio
                </a>{" "}
                y{" "}
                <a href="#" className="text-accent-primary hover:text-accent-primary/80 transition-colors">
                  Política de Privacidad
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden min-h-screen bg-bg-main">
        {/* Mobile Background Pattern for Native Feel */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_60%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)]"></div>
        </div>

        {/* Status Bar Simulation (Mobile) */}
        <div className="h-6 bg-bg-main/30 backdrop-blur-sm"></div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header - More compact on mobile */}
          <div className="px-6 py-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center space-x-3 mb-3">
                <img
                  src="/logo.png"
                  alt="Comuna Padel Logo"
                  className="h-10 w-10 drop-shadow-lg"
                />
                <h1 className="text-2xl font-bold text-text-main font-montserrat drop-shadow-md">
                   Comuna Padel
                 </h1>
               </div>
               <p className="text-text-secondary font-open-sans text-sm font-medium">
                 Tu comunidad de padel favorita
               </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Native-style Tab Bar */}
            <div className="px-6 mb-8">
              <div className="bg-bg-secondary/90 backdrop-blur-xl rounded-2xl p-1.5 shadow-xl border border-border">
                <div className="flex relative">
                  {/* Active indicator */}
                  <div 
                    className={`absolute top-1 bottom-1 w-1/2 bg-accent-primary rounded-xl shadow-lg transition-transform duration-300 ease-out ${
                      activeForm === "register" ? "translate-x-full" : "translate-x-0"
                    }`}
                  ></div>
                  
                  <button
                    onClick={() => updateActiveForm("login")}
                    className={`flex-1 py-4 px-4 rounded-xl text-sm font-semibold transition-all duration-300 relative z-10 font-open-sans ${
                      activeForm === "login"
                        ? "text-bg-main"
                        : "text-text-secondary"
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => updateActiveForm("register")}
                    className={`flex-1 py-4 px-4 rounded-xl text-sm font-semibold transition-all duration-300 relative z-10 font-open-sans ${
                      activeForm === "register"
                        ? "text-bg-main"
                        : "text-text-secondary"
                    }`}
                  >
                    Registrarse
                  </button>
                </div>
              </div>
            </div>

            {/* Form Container with Swipe Support */}
            <div 
              ref={containerRef}
              className="flex-1 px-6 pb-8"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className={`transition-all duration-300 ease-out ${
                isTransitioning ? "opacity-0 transform scale-95" : "opacity-100 transform scale-100"
              }`}>
                {/* Card Container - Native App Style */}
                <div className="bg-bg-secondary/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border overflow-hidden">
                  {/* Form Content */}
                  <div className="p-8">
                    {activeForm === "login" ? <LoginForm /> : <RegisterForm />}
                  </div>
                </div>
              </div>
            </div>

            {/* Swipe Indicator (Mobile Only) */}
            <div className="flex justify-center pb-6">
              <div className="flex space-x-3">
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  activeForm === "login" ? "bg-accent-primary shadow-lg" : "bg-text-secondary/40"
                }`}></div>
                <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  activeForm === "register" ? "bg-accent-primary shadow-lg" : "bg-text-secondary/40"
                }`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicOnlyRoute>
  );
}
